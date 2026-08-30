import express from 'express';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import { poolUser } from '../db/connection.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();
const RASTER_DIR = process.env.RASTER_DIR;
const TEMP_BASE_DIR = path.join(process.cwd(), 'tempuploads');

// Ensure directories exist
fs.mkdirSync(TEMP_BASE_DIR, { recursive: true });
fs.mkdirSync(RASTER_DIR, { recursive: true });

const SAFE_NAME = /^[a-zA-Z0-9_]+$/;

// 1️⃣ START UPLOAD
router.post('/start', async (req, res) => {
  try {
    const { file_name, theme, srid, totalChunks, totalSize, chunkSize } = req.body;

    if (!file_name || !theme || !totalChunks || !chunkSize) {
      return res.status(400).json({ error: 'Missing required metadata' });
    }

    if (!SAFE_NAME.test(file_name) || !SAFE_NAME.test(theme)) {
      return res.status(400).json({ error: 'Invalid file_name or theme format' });
    }
    if (srid && !/^\d+$/.test(srid)) {
      return res.status(400).json({ error: 'Invalid SRID format' });
    }

    const finalPath = path.join(RASTER_DIR, `${file_name}.tif`);
    const partPath = path.join(RASTER_DIR, `${file_name}.tif.part`);
    
    if (fs.existsSync(finalPath)) {
      return res.status(409).json({ error: 'File already exists in filesystem' });
    }

    const client = await poolUser.connect();
    try {
      const { rowCount } = await client.query(
        'SELECT 1 FROM catalog WHERE file_name = $1 LIMIT 1',
        [file_name]
      );
      if (rowCount > 0) {
        return res.status(409).json({ error: 'File already exists in database' });
      }
    } finally {
      client.release();
    }

    const uploadId = crypto.randomBytes(16).toString('hex');
    const uploadDir = path.join(TEMP_BASE_DIR, uploadId);
    fs.mkdirSync(uploadDir, { recursive: true });

    // Store metadata
    fs.writeFileSync(
      path.join(uploadDir, 'metadata.json'),
      JSON.stringify({ file_name, theme, srid, totalChunks, totalSize, chunkSize, partPath })
    );

    // Create a 0-byte sparse file so 'r+' stream appending works
    if (!fs.existsSync(partPath)) {
      fs.closeSync(fs.openSync(partPath, 'w'));
    }

    res.json({ uploadId });
  } catch (err) {
    console.error('[UPLOAD START ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2️⃣ UPLOAD CHUNK (DIRECT-TO-DISK via busboy)
router.post('/chunk', (req, res) => {
  const bb = busboy({ headers: req.headers });
  
  let uploadId = null;
  let chunkIndex = null;
  let metadata = null;
  let hasError = false;

  bb.on('field', (name, val) => {
    if (name === 'uploadId') uploadId = val;
    if (name === 'chunkIndex') chunkIndex = parseInt(val, 10);
  });

  bb.on('file', (name, fileStream, info) => {
    if (hasError) return fileStream.resume(); // Ignore stream if error
    
    if (!uploadId || chunkIndex === null) {
      hasError = true;
      fileStream.resume();
      return res.status(400).json({ error: 'Fields must precede file in form-data' });
    }

    const dir = path.join(TEMP_BASE_DIR, uploadId);
    const metaPath = path.join(dir, 'metadata.json');
    
    if (!fs.existsSync(metaPath)) {
      hasError = true;
      fileStream.resume();
      return res.status(404).json({ error: 'Session not found' });
    }

    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch (e) {
      hasError = true;
      fileStream.resume();
      return res.status(500).json({ error: 'Corrupt metadata' });
    }

    const offset = chunkIndex * metadata.chunkSize;
    
    // Pipe directly into the final .part file on the SAN at the correct exact byte offset!
    const writeStream = fs.createWriteStream(metadata.partPath, { flags: 'r+', start: offset });
    
    writeStream.on('error', (err) => {
      console.error('[STREAM WRITE ERROR]', err);
      hasError = true;
      if (!res.headersSent) res.status(500).json({ error: 'Error writing chunk to disk' });
    });

    fileStream.pipe(writeStream);

    writeStream.on('finish', () => {
      if (hasError) return;
      // Mark chunk as done
      fs.writeFileSync(path.join(dir, `chunk_${chunkIndex}.done`), '1');
      res.json({ success: true, chunkIndex });
    });
  });

  bb.on('error', (err) => {
    console.error('[BUSBOY ERROR]', err);
    if (!res.headersSent) res.status(500).json({ error: 'Upload stream error' });
  });

  req.pipe(bb);
});

// 3️⃣ GET STATUS
router.get('/status/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const dir = path.join(TEMP_BASE_DIR, uploadId);

  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: 'Upload session not found' });
  }

  try {
    const files = fs.readdirSync(dir);
    const uploadedChunks = files
      .filter(f => f.startsWith('chunk_') && f.endsWith('.done'))
      .map(f => parseInt(f.replace('chunk_', '').replace('.done', ''), 10));

    res.json({ uploadedChunks });
  } catch (err) {
    console.error('[UPLOAD STATUS ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4️⃣ COMPLETE UPLOAD
router.post('/complete', async (req, res) => {
  const completeStart = performance.now();
  const { uploadId } = req.body;
  if (!uploadId) return res.status(400).json({ error: 'Missing uploadId' });

  const dir = path.join(TEMP_BASE_DIR, uploadId);
  const metaPath = path.join(dir, 'metadata.json');

  if (!fs.existsSync(dir) || !fs.existsSync(metaPath)) {
    return res.status(404).json({ error: 'Upload session not found' });
  }

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  } catch (e) {
    return res.status(500).json({ error: 'Corrupt metadata' });
  }

  const { file_name, theme, srid, totalChunks, partPath } = metadata;
  const finalPath = path.join(RASTER_DIR, `${file_name}.tif`);

  // Verify all chunks are marked done
  for (let i = 0; i < totalChunks; i++) {
    if (!fs.existsSync(path.join(dir, `chunk_${i}.done`))) {
      return res.status(400).json({ error: `Missing chunk ${i}` });
    }
  }

  if (fs.existsSync(finalPath)) {
    fs.rmSync(dir, { recursive: true, force: true });
    return res.status(409).json({ error: 'File already exists in destination' });
  }

  // Rename .part to .tif (Instantaneous!)
  try {
    fs.renameSync(partPath, finalPath);
  } catch (err) {
    console.error('[RENAME ERROR]', err);
    return res.status(500).json({ error: 'Failed to finalize file' });
  }

  // Database Insertion
  let dbSuccess = false;
  const client = await poolUser.connect();
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM catalog WHERE file_name = $1 LIMIT 1',
      [file_name]
    );

    if (rowCount > 0) {
      if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      return res.status(409).json({ error: 'File already exists in database' });
    }

    await client.query(
      `INSERT INTO catalog (file_name, file_type, theme, srid, visibility, is_published)
       VALUES ($1, 'raster', $2, $3, false, false)`,
      [file_name, theme, srid]
    );
    dbSuccess = true;
  } catch (dbError) {
    console.error('[DB INSERT ERROR]', dbError);
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }

  // Cleanup session
  fs.rmSync(dir, { recursive: true, force: true });

  const totalTime = ((performance.now() - completeStart) / 1000).toFixed(2);
  console.log(`[UPLOAD COMPLETE] id=${uploadId} file=${file_name} totalCompletionTime=${totalTime}s`);
  res.json({ success: true, message: 'Upload completed successfully' });
});

// 5️⃣ ABORT UPLOAD
router.delete('/abort/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const dir = path.join(TEMP_BASE_DIR, uploadId);

  if (fs.existsSync(dir)) {
    try {
      const metaPath = path.join(dir, 'metadata.json');
      if (fs.existsSync(metaPath)) {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (fs.existsSync(metadata.partPath)) {
          fs.unlinkSync(metadata.partPath);
        }
      }
    } catch (e) {}
    fs.rmSync(dir, { recursive: true, force: true });
  }
  res.json({ success: true });
});

export default router;

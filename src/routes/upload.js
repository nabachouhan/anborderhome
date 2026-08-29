import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { poolUser } from '../db/connection.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();
const RASTER_DIR = process.env.RASTER_DIR;
const TEMP_BASE_DIR = path.join(process.cwd(), 'tempuploads');

// Ensure base temp directory exists
fs.mkdirSync(TEMP_BASE_DIR, { recursive: true });

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { uploadId } = req.body;
    if (!uploadId) return cb(new Error('Missing uploadId'));
    const dir = path.join(TEMP_BASE_DIR, uploadId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const { chunkIndex } = req.body;
    if (chunkIndex === undefined) return cb(new Error('Missing chunkIndex'));
    cb(null, `chunk_${chunkIndex}`);
  }
});
const upload = multer({ storage });

const SAFE_NAME = /^[a-zA-Z0-9_]+$/;

// 1️⃣ START UPLOAD
router.post('/start', async (req, res) => {
  try {
    const { file_name, theme, srid, totalChunks, totalSize } = req.body;

    if (!file_name || !theme || !totalChunks) {
      return res.status(400).json({ error: 'Missing required metadata' });
    }

    if (!SAFE_NAME.test(file_name) || !SAFE_NAME.test(theme)) {
      return res.status(400).json({ error: 'Invalid file_name or theme format' });
    }
    if (srid && !/^\d+$/.test(srid)) {
      return res.status(400).json({ error: 'Invalid SRID format' });
    }

    const finalPath = path.join(RASTER_DIR, `${file_name}.tif`);
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
      JSON.stringify({ file_name, theme, srid, totalChunks, totalSize })
    );

    res.json({ uploadId });
  } catch (err) {
    console.error('[UPLOAD START ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2️⃣ UPLOAD CHUNK
router.post('/chunk', upload.single('chunk'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No chunk file uploaded' });
  }
  res.json({ success: true, chunkIndex: req.body.chunkIndex });
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
      .filter(f => f.startsWith('chunk_'))
      .map(f => parseInt(f.replace('chunk_', ''), 10));

    res.json({ uploadedChunks });
  } catch (err) {
    console.error('[UPLOAD STATUS ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4️⃣ COMPLETE UPLOAD
router.post('/complete', async (req, res) => {
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

  const { file_name, theme, srid, totalChunks } = metadata;
  const finalDir = RASTER_DIR;
  fs.mkdirSync(finalDir, { recursive: true });
  const finalPath = path.join(finalDir, `${file_name}.tif`);

  // Verify all chunks exist
  for (let i = 0; i < totalChunks; i++) {
    if (!fs.existsSync(path.join(dir, `chunk_${i}`))) {
      return res.status(400).json({ error: `Missing chunk ${i}` });
    }
  }

  if (fs.existsSync(finalPath)) {
    fs.rmSync(dir, { recursive: true, force: true });
    return res.status(409).json({ error: 'File already exists in destination' });
  }

  // Merge chunks using streams
  try {
    const writeStream = fs.createWriteStream(finalPath);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(dir, `chunk_${i}`);
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        readStream.on('error', reject);
        writeStream.on('error', reject);
        readStream.on('end', resolve);
        readStream.pipe(writeStream, { end: false });
      });
    }
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

  } catch (mergeError) {
    console.error('[MERGE ERROR]', mergeError);
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    return res.status(500).json({ error: 'Error merging file' });
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

  // Cleanup chunks
  fs.rmSync(dir, { recursive: true, force: true });

  console.log(`[UPLOAD COMPLETE] ${file_name}`);
  res.json({ success: true, message: 'Upload and merge completed successfully' });
});

// 5️⃣ ABORT UPLOAD
router.delete('/abort/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const dir = path.join(TEMP_BASE_DIR, uploadId);

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  res.json({ success: true });
});

export default router;

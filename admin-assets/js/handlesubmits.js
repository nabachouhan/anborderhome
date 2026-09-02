
// handle submissions forms admin--starts------


function formDataToObject(formData) {
  const obj = {};
  formData.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

// Generic function to handle form submissions
const handleFormSubmit = async (event, url) => {
  event.preventDefault(); // Prevent the default form submission

  const formData = new FormData(event.target); // Create a FormData object from the form
  const clickedButtonValue = event.submitter.value;
  formData.append('submit', clickedButtonValue);

  const formDataObj = formDataToObject(formData); // Convert FormData to an object for logging
  console.log('Submitting to URL:', url, 'with data:', formDataObj);

  // First, show confirmation before submitting the data
  const confirmationResult = await Swal.fire({
    title: 'Confirm Submission',
    text: 'Are you sure you want proceed?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes!',
    cancelButtonText: 'No!'
  });

  if (!confirmationResult.isConfirmed) {
    // If the user cancels, exit the function
    return;
  }
  document.getElementById('loader0').style.display = 'block';

  // Proceed with the fetch request if confirmed
  await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById('loader0').style.display = 'none'
      console.log('Response data:', data);
      if (data) {
        Swal.fire({
          title: data.title,
          text: data.message,
          confirmButtonText: "OK",
          icon: data.icon
        }).then((result) => {
          if (result.isConfirmed && data.redirect !== undefined) {
            window.location.href = data.redirect; // Replace with your desired URL
          }
        });
      } else {
        console.error('Unexpected response format:', data);
        Swal.fire({
          title: 'Error',
          text: 'Unexpected response format.',
          icon: 'error'
        });
      }
    })
    .catch(error => {
      document.getElementById('loader0').style.display = 'none'
      console.error('Fetch error:', error);
      Swal.fire({
        title: 'Error',
        text: `An error occurred: ${error.message}`,
        icon: 'error'
      });
    });
};

// Attach event listeners to each form, passing the appropriate endpoint URL
document.addEventListener('DOMContentLoaded', function () {

  const adminUpload = document.getElementById('vectorUploadForm');

  if (adminUpload) {
    adminUpload.addEventListener('submit', function (e) {
      console.log("entered");

      const file_type = document.getElementById('file_type').value;
      if (file_type === 'vector') {

        console.log("HII admin")
        handleFormSubmit(e, '/admin/shpuploads');

      }
      else if (file_type === 'raster') {

        handleFormSubmit(e, '/admin/tiffuploads');
      }



    })
  }




  const adminCatalogForm = document.getElementById('adminCatalogForm');

  if (adminCatalogForm) {
    // const file_type = document.getElementById('file_type').value;
    adminCatalogForm.addEventListener('submit', function (e) {
      const file_type = document.getElementById('file_type').value;
      if (file_type === 'vector') {
        handleFormSubmit(e, '/admin/publish');
      }
      else if (file_type === 'raster') {
        handleFormSubmit(e, '/admin/publish-tiff');

      }
    });

  }

  const metadataForm = document.getElementById('metadataForm');
  if (metadataForm) {
    metadataForm.addEventListener('submit', function (e) {
      console.log("HII ctalog")
      handleFormSubmit(e, '/admin/metadata');
    });
  }

  // ✅ Update Password form handler
  const updatePasswordForm = document.getElementById('updatePasswordForm');
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', function (e) {
      const newPassword     = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Client-side match check before handing off to handleFormSubmit
      if (newPassword !== confirmPassword) {
        e.preventDefault();
        Swal.fire('Mismatch', 'New password and confirm password do not match.', 'error');
        return;
      }
      if (newPassword.length < 6) {
        e.preventDefault();
        Swal.fire('Weak Password', 'New password must be at least 6 characters.', 'warning');
        return;
      }

      handleFormSubmit(e, '/admin/update-password');
    });
  }

});
// handle submissions--ends------

// Sidebar toggle
const sidebarBtn = document.getElementById("toggleSidebarBtn");
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", () => {
    toggleadminSidebar();
  });
}
// Sidebar toggle


// admin Logout--start
function handleAdminLogout(event, url) {
  event.preventDefault(); // Prevent the default form submission

  function proceedLogout() {
    fetch(url, { // Send the FormData object to the specified route
      method: 'POST',
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data) {
          Swal.fire({
            title: data.title,
            text: data.message,
            icon: data.icon
          }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
              window.location.href = '/';
            }
          });
        } // Handle the response data
      })
      .catch(error => {
        console.error('Error:', error); // Handle any errors
      });


  }
  Swal.fire({
    title: "Proceed Logout",
    icon: "warning",
    showCancelButton: true,

  }).then((result) => {
    /* Read more about isConfirmed, isDenied below */
    if (result.isConfirmed) {
      proceedLogout()
    }
  });
}

// Attach event listeners to each form, passing the appropriate endpoint URL
document.getElementById('adminLogout').addEventListener('click', function (e) {
  console.log("clickeed loggout..........");
  handleAdminLogout(e, '/admin/logout');
});
// admin Logout--end
// ---------------------------------------------------------------------------

//   admin side bar toggle-- starts
function toggleadminSidebar() {
  const adminsidebar = document.getElementById('admin-sidebar');
  const mainContent = document.getElementById('mainContent');
  adminsidebar.classList.toggle('admin-sidebar-collapsed');
  mainContent.classList.toggle('content-expanded');
}
//   admin side bar toggle-- ends

// ----------------------------------------------------------------


// ****************admin uplod toggle uplod form hendle start********************
// ---shape file upload form ----

document.addEventListener('DOMContentLoaded', () => {
  const vectorOption       = document.getElementById('vectorOption');
  const rasterOption       = document.getElementById('rasterOption');
  const manualRasterOption = document.getElementById('manualRasterOption');
  const metadataOption     = document.getElementById('metadataOption');
  const categoriesOption   = document.getElementById('categoriesOption');

  const vectorForm       = document.getElementById('vectorUploadForm');
  const rasterForm       = document.getElementById('rasterUploadForm');
  const manualRasterForm = document.getElementById('manualRasterForm');
  const metadataForm     = document.getElementById('metadataForm');
  const categoriesForm   = document.getElementById('categoriesForm');

  const filenameInput = document.getElementById('filename');
  const thumbnailInput = document.getElementById('thumbnail');
  const thumbnailPreview = document.getElementById('thumbnailPreview');
  const steps = metadataForm.querySelectorAll('.form-step');
  const nextButtons = metadataForm.querySelectorAll('.next-btn');
  const prevButtons = metadataForm.querySelectorAll('.prev-btn');
  const progressBar = metadataForm.querySelector('.progress-bar');
  let currentStep = 0;

  // ── Untracked file loader ─────────────────────────────────────
  // Reads from untraked_RASTER_DIR via GET /admin/raster/untracked
  async function loadUntrackedFiles() {
    const sel    = document.getElementById('manual_source_file');
    const status = document.getElementById('untrackedStatus');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Loading… —</option>';
    if (status) status.textContent = '';

    try {
      const res  = await fetch('/admin/raster/untracked');
      const data = await res.json();
      const files = data.files || [];

      if (files.length === 0) {
        sel.innerHTML = '<option value="">— No files in incoming directory —</option>';
        if (status) status.textContent = 'No .tif files found in the incoming (pscp) directory.';
        return;
      }

      sel.innerHTML = '<option value="">— Select a file —</option>' +
        files.map(f => `<option value="${f}">${f}.tif</option>`).join('');
      if (status) status.textContent = `${files.length} file(s) available.`;
    } catch (err) {
      sel.innerHTML = '<option value="">— Error loading files —</option>';
      if (status) status.textContent = 'Could not fetch file list.';
      console.error('[untracked]', err);
    }
  }

  // Toggle forms based on radio button Admin Upload
  function toggleForms() {
    // Hide all first
    vectorForm.classList.add('form-hidden');
    rasterForm.classList.add('form-hidden');
    if (manualRasterForm) manualRasterForm.classList.add('form-hidden');
    metadataForm.classList.add('form-hidden');
    if (categoriesForm) categoriesForm.classList.add('form-hidden');

    // Show based on selection
    if (vectorOption.checked) {
      vectorForm.classList.remove('form-hidden');
    }

    if (rasterOption.checked) {
      rasterForm.classList.remove('form-hidden');
    }

    if (manualRasterOption && manualRasterOption.checked) {
      if (manualRasterForm) manualRasterForm.classList.remove('form-hidden');
      loadUntrackedFiles();
    }

    if (metadataOption.checked) {
      metadataForm.classList.remove('form-hidden');
      updateStep();
    }

    if (categoriesOption && categoriesOption.checked) {
      if (categoriesForm) categoriesForm.classList.remove('form-hidden');
      loadCategories();
    }
  }




  document.getElementById("rasterUploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("upload_raster_file");
    if (!fileInput || !fileInput.files.length) {
      Swal.fire("No file", "Please select a GeoTIFF file", "warning");
      return;
    }

    const file = fileInput.files[0];
    const fileName = document.getElementById("raster_file_name").value;

    if (!fileName) {
      Swal.fire("Missing name", "Please enter file name", "warning");
      return;
    }

    /* ✅ CONFIRM DIALOG */
    const confirm = await Swal.fire({
      title: "Are you sure?",
      html: `
      <b>File:</b> ${file.name}<br>
      <b>Save as:</b> ${fileName}.tif
    `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, upload",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch(`/admin/raster/precheck/${fileName}`);
    if (!res.ok) {
      Swal.fire("Duplicate", "File already exists", "error");
      return;
    }

    // only now start tus.Upload()


    /* ✅ PROGRESS POPUP */
    Swal.fire({
      title: "Uploading raster…",
      html: `
      <div style="margin-top:10px">
        <b id="uploadPercent">0%</b>
        <div style="width:100%;background:#eee;height:10px;border-radius:5px;margin-top:6px">
          <div id="uploadBar" style="width:0%;height:10px;background:#28a745;border-radius:5px"></div>
        </div>
      </div>
    `,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });



    let uploadFailed = false;

    // ─────────────────────────────────────────────────────────────
    // 🛡️ WAF BYPASS: Custom HTTP stack
    //   WAFs block "application/offset+octet-stream"; we disguise it
    //   as "application/octet-stream". The Express middleware restores
    //   it before @tus/server sees the request.
    //
    //   Implements the full tus-js-client HttpRequest interface:
    //   open(), setHeader(), setProgressHandler(), send(), abort()
    // ─────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────
    // 🛡️ WAF BYPASS: Custom HTTP stack — complete tus-js-client
    //   HttpStack + HttpRequest interface implementation.
    //
    //   WAFs block "application/offset+octet-stream"; we disguise it
    //   as "application/octet-stream". The Express middleware restores
    //   it before @tus/server sees the request.
    //
    //   Defers xhr.open() until send() so setRequestHeader() can be
    //   called in the correct order (open → setHeader → send).
    //
    //   Required request methods (tus-js-client calls all of these):
    //     getMethod, getURL, setHeader, getHeader,
    //     setProgressHandler, send, abort, getUnderlyingObject
    // ─────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────
    // 🛡️ CUSTOM CHUNKED POST UPLOADER
    // ─────────────────────────────────────────────────────────────
    class ChunkedUploader {
      constructor(file, fileName) {
        this.file = file;
        this.fileName = fileName;
        this.chunkSize = 5 * 1024 * 1024; // 5 MB chunks
        this.totalChunks = Math.ceil(file.size / this.chunkSize);
        this.uploadId = null;
        this.uploadedChunks = new Set();
        this.storageKey = `upload_v2_${file.name}_${file.lastModified}`;
        this.aborted = false;
      }

      async start() {
        try {
          // Check for existing session (Resume functionality)
          const savedId = localStorage.getItem(this.storageKey);
          if (savedId) {
            try {
              const res = await fetch(`/admin/upload/status/${savedId}`);
              if (res.ok) {
                const data = await res.json();
                this.uploadId = savedId;
                this.uploadedChunks = new Set(data.uploadedChunks);
                console.log('Resuming upload...', this.uploadedChunks);
              } else {
                localStorage.removeItem(this.storageKey);
              }
            } catch (e) {
              console.warn('Failed to fetch status, starting fresh');
            }
          }

          // Start new session if needed
          if (!this.uploadId) {
            const res = await fetch('/admin/upload/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file_name: this.fileName,
                theme: "raster",
                srid: "4326",
                totalChunks: this.totalChunks,
                totalSize: this.file.size,
                chunkSize: this.chunkSize
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to start upload');
            
            this.uploadId = data.uploadId;
            localStorage.setItem(this.storageKey, this.uploadId);
          }

          await this.uploadChunks();
          
          if (!this.aborted) {
            await this.completeUpload();
          }

        } catch (error) {
          this.handleError(error);
        }
      }

      async uploadChunks() {
        const UPLOAD_CONCURRENCY = 4; // Configurable concurrency limit
        const pendingChunks = [];
        
        for (let i = 0; i < this.totalChunks; i++) {
          if (!this.uploadedChunks.has(i)) {
            pendingChunks.push(i);
          }
        }

        const uploadTask = async (chunkIndex) => {
          if (this.aborted) return;
          
          const start = chunkIndex * this.chunkSize;
          const end = Math.min(start + this.chunkSize, this.file.size);
          const chunk = this.file.slice(start, end);
          
          const formData = new FormData();
          formData.append('uploadId', this.uploadId);
          formData.append('chunkIndex', chunkIndex);
          formData.append('chunk', chunk, 'chunk');

          let retries = 3;
          let success = false;
          
          while (retries > 0 && !success && !this.aborted) {
            const chunkStart = performance.now();
            try {
              const res = await fetch('/admin/upload/chunk', {
                method: 'POST',
                body: formData
              });
              if (!res.ok) throw new Error('Chunk upload failed');
              
              this.uploadedChunks.add(chunkIndex);
              success = true;
              this.updateProgress();
              
              const duration = (performance.now() - chunkStart) / 1000;
              const speed = ((chunk.size / (1024 * 1024)) / duration).toFixed(2);
              console.log(`[UPLOAD] id=${this.uploadId} chunk=${chunkIndex}/${this.totalChunks} size=${(chunk.size/(1024*1024)).toFixed(2)}MB time=${duration.toFixed(2)}s speed=${speed}MB/s`);
            } catch (err) {
              retries--;
              if (retries === 0) throw err;
              // Exponential backoff: 1s, 2s, 4s
              const backoff = 1000 * Math.pow(2, 3 - retries - 1); 
              await new Promise(r => setTimeout(r, backoff));
            }
          }
        };

        const workers = [];
        for (let i = 0; i < UPLOAD_CONCURRENCY; i++) {
          workers.push((async () => {
            while (pendingChunks.length > 0 && !this.aborted) {
              const nextChunk = pendingChunks.shift();
              await uploadTask(nextChunk);
            }
          })());
        }

        console.log(`[UPLOAD] id=${this.uploadId} concurrency=${UPLOAD_CONCURRENCY}`);
        await Promise.all(workers);
      }

      async completeUpload() {
        const res = await fetch('/admin/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId: this.uploadId })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Merge failed');

        localStorage.removeItem(this.storageKey);
        this.updateProgress(100);
        Swal.fire("Success", "Raster uploaded successfully", "success");
      }

      abort() {
        this.aborted = true;
        if (this.uploadId) {
          fetch(`/admin/upload/abort/${this.uploadId}`, { method: 'DELETE' }).catch(()=>{});
        }
        localStorage.removeItem(this.storageKey);
        this.updateProgress(0);
      }

      updateProgress(overridePct) {
        let pct = overridePct;
        if (pct === undefined) {
          pct = ((this.uploadedChunks.size / this.totalChunks) * 100).toFixed(2);
        }
        const pctEl = document.getElementById('uploadPercent');
        const barEl = document.getElementById('uploadBar');
        if (pctEl) pctEl.innerText = `${pct}%`;
        if (barEl) barEl.style.width = `${pct}%`;
        console.log(`Raster upload ${pct}%`);
      }

      handleError(error) {
        console.error("Upload error:", error);
        this.updateProgress(0);
        
        if (error.message.includes('already exists')) {
          this.abort();
          Swal.fire({
            icon: "error",
            title: "Duplicate file",
            text: error.message
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Upload failed",
            text: error.message
          });
        }
      }
    }

    const uploader = new ChunkedUploader(file, fileName);
    uploader.start();
  });


  // ── Manual Raster Entry: Refresh button ──────────────────────
  const refreshUntrackedBtn = document.getElementById('refreshUntrackedBtn');
  if (refreshUntrackedBtn) {
    refreshUntrackedBtn.addEventListener('click', loadUntrackedFiles);
  }

  // ── Manual Raster Entry: Submit button ───────────────────────
  const manualRasterSubmitBtn = document.getElementById('manualRasterSubmitBtn');
  if (manualRasterSubmitBtn) {
    manualRasterSubmitBtn.addEventListener('click', async () => {
      const source_file = document.getElementById('manual_source_file')?.value?.trim();
      const file_name   = document.getElementById('manual_file_name')?.value?.trim();

      // Validate source selection
      if (!source_file) {
        Swal.fire('No file selected', 'Please select a file from the incoming directory dropdown.', 'warning');
        return;
      }

      // Validate catalog name
      if (!file_name) {
        Swal.fire('Missing name', 'Please enter a catalog file name.', 'warning');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(file_name)) {
        Swal.fire('Invalid name', 'File name may only contain letters, numbers, and underscores.', 'warning');
        return;
      }

      const confirmed = await Swal.fire({
        title: 'Register to catalog?',
        html: `
          <table class="table table-sm text-start mt-2">
            <tr><td><b>Source file</b></td><td>${source_file}.tif</td></tr>
            <tr><td><b>Catalog name</b></td><td>${file_name}.tif</td></tr>
            <tr><td><b>Type</b></td><td>GeoTIFF (raster)</td></tr>
            <tr><td><b>Theme</b></td><td>raster</td></tr>
          </table>
          <p class="text-muted small">The file will be moved from the incoming directory to the raster store.</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, register',
        cancelButtonText: 'Cancel',
      });
      if (!confirmed.isConfirmed) return;

      try {
        manualRasterSubmitBtn.disabled = true;
        manualRasterSubmitBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Registering…';

        const res = await fetch('/admin/raster/manual-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_file, file_name }),
        });
        const data = await res.json();

        Swal.fire({
          title: data.title || (res.ok ? 'Success' : 'Error'),
          text:  data.message,
          icon:  data.icon  || (res.ok ? 'success' : 'error'),
        });

        if (res.ok) {
          // Clear inputs and refresh dropdown
          document.getElementById('manual_file_name').value = '';
          loadUntrackedFiles();
        }
      } catch (err) {
        Swal.fire('Error', 'Network error. Please try again.', 'error');
        console.error('[manual-entry]', err);
      } finally {
        manualRasterSubmitBtn.disabled = false;
        manualRasterSubmitBtn.innerHTML = '<i class="bi bi-database-add me-1"></i> Register to Catalog';
      }
    });
  }


  // Toggle forms based on radio button Admin Upload

  // Update active step and progress bar
  function updateStep() {
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === currentStep);
    });
    progressBar.style.width = `${(currentStep + 1) * 33.33}%`;
    progressBar.textContent = `Step ${currentStep + 1} of 3`;
  }

  // Radio button handlers
  vectorOption.addEventListener('change', toggleForms);
  rasterOption.addEventListener('change', toggleForms);
  if (manualRasterOption) manualRasterOption.addEventListener('change', toggleForms);
  metadataOption.addEventListener('change', toggleForms);
  if (categoriesOption) {
    categoriesOption.addEventListener('change', toggleForms);
  }


  // Filename validation
  if (filenameInput) {
    filenameInput.addEventListener('input', () => {
      const pattern = /^[a-z0-9_]+$/;
      filenameInput.classList.toggle('is-invalid', !pattern.test(filenameInput.value) && filenameInput.value !== '');
    });
  }

  // Thumbnail preview
  if (thumbnailInput && thumbnailPreview) {
    thumbnailInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      thumbnailPreview.style.display = file ? 'block' : 'none';
      thumbnailPreview.src = file ? URL.createObjectURL(file) : '';
    });
  }

  // Step navigation
  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        updateStep();
      }
    });
  });

  prevButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        updateStep();
      }
    });
  });

  // Categories Hierarchy Management
  const categoryTreeContainer = document.getElementById('categoryTreeContainer');
  const categoryActionForm = document.getElementById('categoryActionForm');
  const catIdInput = document.getElementById('cat_id');
  const catNameInput = document.getElementById('cat_name');
  const catParentSelect = document.getElementById('cat_parent_id');
  const catSubmitBtn = document.getElementById('cat_submit_btn');
  const catCancelBtn = document.getElementById('cat_cancel_btn');
  const actionFormTitle = document.getElementById('actionFormTitle');

  // Also reference the category dropdown inside the metadata form:
  const metaCategorySelect = document.getElementById('meta_category_id');

  let allCategories = [];

  async function loadCategories() {
    try {
      const response = await fetch('/admin/categories');
      if (response.ok) {
        const data = await response.json();
        allCategories = data.categories;
        renderCategoryTree();
        populateCategoryDropdowns();
      } else {
        console.error("Failed to load categories");
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }

  // Populate both the parent select (in categories form) and the catalog metadata categories dropdown
  function populateCategoryDropdowns() {
    if (!catParentSelect) return;
    const currentEditId = catIdInput.value ? parseInt(catIdInput.value, 10) : null;
    
    // Determine which IDs to exclude (current category and all its descendants to avoid circular inheritance)
    const excludedIds = new Set();
    if (currentEditId) {
      excludedIds.add(currentEditId);
      let newAdditions = true;
      while (newAdditions) {
        newAdditions = false;
        allCategories.forEach(cat => {
          if (cat.parent_id && excludedIds.has(cat.parent_id) && !excludedIds.has(cat.id)) {
            excludedIds.add(cat.id);
            newAdditions = true;
          }
        });
      }
    }

    let parentOptionsHtml = '<option value="">None (Top-Level Category)</option>';
    
    const sortedCats = getHierarchicalList();
    sortedCats.forEach(item => {
      if (!excludedIds.has(item.id)) {
        const indent = '&nbsp;&nbsp;'.repeat(item.depth);
        parentOptionsHtml += `<option value="${item.id}">${indent}${item.name}</option>`;
      }
    });
    catParentSelect.innerHTML = parentOptionsHtml;

    // 2. Metadata form hierarchical category select
    if (metaCategorySelect) {
      let metaOptionsHtml = '<option value="">Select Category (None)</option>';
      sortedCats.forEach(item => {
        const indent = '&nbsp;&nbsp;'.repeat(item.depth);
        metaOptionsHtml += `<option value="${item.id}">${indent}${item.name}</option>`;
      });
      metaCategorySelect.innerHTML = metaOptionsHtml;
    }
  }

  // Generates flat list sorted by tree hierarchy with depth metadata
  function getHierarchicalList() {
    const list = [];
    
    function traverse(parentId, depth) {
      const children = allCategories.filter(c => c.parent_id === parentId);
      children.sort((a, b) => a.name.localeCompare(b.name));
      children.forEach(child => {
        list.push({ ...child, depth });
        traverse(child.id, depth + 1);
      });
    }

    const roots = allCategories.filter(c => !c.parent_id);
    roots.sort((a, b) => a.name.localeCompare(b.name));
    roots.forEach(root => {
      list.push({ ...root, depth: 0 });
      traverse(root.id, 1);
    });

    return list;
  }

  // Render categories tree structure recursively
  function renderCategoryTree() {
    if (!categoryTreeContainer) return;
    if (allCategories.length === 0) {
      categoryTreeContainer.innerHTML = '<div class="text-muted p-2">No categories found. Create one on the right.</div>';
      return;
    }

    function buildTreeHtml(parentId) {
      const children = allCategories.filter(c => c.parent_id === parentId);
      if (children.length === 0) return '';

      children.sort((a, b) => a.name.localeCompare(b.name));
      
      let html = '<ul class="list-unstyled ps-3 mt-1">';
      children.forEach(cat => {
        html += `
          <li class="py-1 border-bottom-dashed">
            <div class="d-flex align-items-center justify-content-between gap-2">
              <span>
                <i class="bi bi-folder-fill text-warning me-1"></i>
                <strong>${cat.name}</strong> 
              </span>
              <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-outline-primary btn-xs py-0 px-1 border-0 btn-edit-category" data-id="${cat.id}" title="Edit">
                  <i class="bi bi-pencil-square"></i>
                </button>
                <button type="button" class="btn btn-outline-danger btn-xs py-0 px-1 border-0 btn-delete-category" data-id="${cat.id}" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            ${buildTreeHtml(cat.id)}
          </li>
        `;
      });
      html += '</ul>';
      return html;
    }

    categoryTreeContainer.innerHTML = buildTreeHtml(null) || '<div class="text-muted p-2">No categories found. Create one on the right.</div>';
  }

  function editCategory(id) {
    const cat = allCategories.find(c => c.id === id);
    if (!cat) return;

    catIdInput.value = cat.id;
    catNameInput.value = cat.name;
    
    populateCategoryDropdowns();
    catParentSelect.value = cat.parent_id || "";

    actionFormTitle.textContent = "Edit Category";
    catSubmitBtn.textContent = "Save Changes";
    catCancelBtn.classList.remove('d-none');
  }

  function deleteCategory(id) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the category. Any subcategories and catalog items will have their category set to None.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/admin/categories/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            Swal.fire('Deleted!', 'Category has been deleted.', 'success');
            loadCategories();
            resetCategoryForm();
          } else {
            const data = await response.json();
            Swal.fire('Error', data.error || 'Failed to delete category', 'error');
          }
        } catch (err) {
          Swal.fire('Error', 'Network error occurred', 'error');
        }
      }
    });
  }

  if (categoryTreeContainer) {
    categoryTreeContainer.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-category');
      const deleteBtn = e.target.closest('.btn-delete-category');
      if (editBtn) {
        const id = parseInt(editBtn.getAttribute('data-id'), 10);
        editCategory(id);
      } else if (deleteBtn) {
        const id = parseInt(deleteBtn.getAttribute('data-id'), 10);
        deleteCategory(id);
      }
    });
  }

  function resetCategoryForm() {
    if (!catIdInput) return;
    catIdInput.value = "";
    catNameInput.value = "";
    catParentSelect.value = "";
    actionFormTitle.textContent = "Create New Category";
    catSubmitBtn.textContent = "Create Category";
    catCancelBtn.classList.add('d-none');
    populateCategoryDropdowns();
  }

  if (catCancelBtn) {
    catCancelBtn.addEventListener('click', resetCategoryForm);
  }

  if (categoryActionForm) {
    categoryActionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = catIdInput.value;
      const name = catNameInput.value.trim();
      const parent_id = catParentSelect.value || null;

      const url = id ? `/admin/categories/${id}` : '/admin/categories';
      const method = id ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, parent_id })
        });

        const data = await response.json();
        if (response.ok) {
          Swal.fire({
            title: id ? 'Updated!' : 'Created!',
            text: id ? 'Category updated successfully.' : 'New category created successfully.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          loadCategories();
          resetCategoryForm();
        } else {
          Swal.fire('Error', data.error || 'Failed to save category', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'Network error occurred', 'error');
      }
    });
  }

  // Load categories initially
  loadCategories();
});


// request form
// Sample card data (simulating multiple cards)
const cardData = Array.from({ length: 2 }, (_, index) => ({
  requestId: 12345 + index,
  name: `John Doe ${index + 1}`,
  email: `john.doe${index + 1}@example.com`,
  organization: `Example Corp ${index + 1}`,
  designation: `Manager ${index + 1}`,
  fileTitle: `Project Proposal ${index + 1}`,
  requestDate: `2025-04-${26 - index}`,
  field1: `Project Scope ${index + 1}`,
  field2: `Budget Details ${index + 1}`
}));

const cardsPerPage = 5;
let currentPage = 1;

// Function to render cards for the current page
function renderCards(page) {
  const start = (page - 1) * cardsPerPage;
  const end = start + cardsPerPage;
}

// Function to render pagination
function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  const totalPages = Math.ceil(cardData.length / cardsPerPage);
  pagination.innerHTML = '';

  // Previous button
  pagination.innerHTML += `
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
                </li>
            `;

  // Page numbers (current and adjacent pages)
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pagination.innerHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                    </li>
                `;
  }

  // Next button
  pagination.innerHTML += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
                </li>
            `;
}

// Function to change page
function changePage(page) {
  const totalPages = Math.ceil(cardData.length / cardsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderCards(currentPage);
    renderPagination();
  }
}

// Initial render
if (document.getElementById('pagination')) {
  renderCards(currentPage);
  renderPagination();
}
// ****************admin uplod toggle uplod form hendle ends********************


// ============================================
// COMPLETE JAVASCRIPT - PROJECT INTAKE FORM
// ============================================

// Google Apps Script web app URL (using your /dev testing endpoint)
const scriptURL = 'https://script.google.com/macros/s/AKfycbz83n733BArBaJ8c5pTlRelVUaMcLuWz4t0kF0nM7rEW_u9FgeNve_EhL4zNGMRZf4QIw/exec';

// ============================================
// DOM ELEMENTS
// ============================================
const intakeForm = document.getElementById('intakeForm');
const returnUrlField = document.getElementById('returnUrl');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const statusToast = document.getElementById('statusMessage');
const submitBtn = document.getElementById('submitBtn');
const deployLink = document.getElementById('deployLink');

// ============================================
// STATE
// ============================================
let uploadQueue = [];

// ============================================
// FORM CONFIGURATION
// ============================================
if (intakeForm) {
  intakeForm.action = scriptURL;
}

// Deploy link setup
if (deployLink) {
  deployLink.href = scriptURL;
  deployLink.style.display = 'inline-block';
}

// ============================================
// ACCORDION FUNCTIONALITY
// ============================================
const accordionHeaders = Array.from(document.querySelectorAll('.accordion-header'));
const accordionItems = Array.from(document.querySelectorAll('.accordion-item'));

function closeAllExcept(openItem) {
  accordionItems.forEach(item => {
    if (item !== openItem && item.classList.contains('open')) {
      item.classList.remove('open');
      const header = item.querySelector('.accordion-header');
      if (header) header.setAttribute('aria-expanded', 'false');
    }
  });
}

accordionHeaders.forEach(header => {
  header.addEventListener('click', function() {
    const item = this.closest('.accordion-item');
    if (!item) return;

    const isOpen = item.classList.contains('open');
    if (isOpen) {
      item.classList.remove('open');
      this.setAttribute('aria-expanded', 'false');
      return;
    }

    closeAllExcept(item);
    item.classList.add('open');
    this.setAttribute('aria-expanded', 'true');
  });
});

// ============================================
// BADGE COUNTER UPDATES
// ============================================
function updateBadges() {
  const categories = {
    branding: 'badge-branding',
    web: 'badge-web',
    qr: 'badge-qr',
    print: 'badge-print',
    marketing: 'badge-marketing',
    computer: 'badge-computer',
    photocopy: 'badge-photocopy',
    other: 'badge-other'
  };

  for (const [cat, badgeId] of Object.entries(categories)) {
    const grid = document.querySelector(`.checkbox-grid[data-category="${cat}"]`);
    const badge = document.getElementById(badgeId);
    if (!grid || !badge) continue;
    badge.textContent = grid.querySelectorAll('input[type="checkbox"]:checked').length;
  }
}

// Attach change listeners to all checkboxes
document.querySelectorAll('.checkbox-container input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', updateBadges);
});

// Initial badge update
updateBadges();

// ============================================
// DRAG AND DROP FUNCTIONALITY
// ============================================
if (dropArea) {
  // Prevent default drag behaviors
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
      e.preventDefault();
      dropArea.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, e => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
    });
  });

  // Handle dropped files
  dropArea.addEventListener('drop', e => {
    handleFiles(e.dataTransfer.files);
  });
}

// ============================================
// FILE INPUT HANDLER
// ============================================
if (fileInput) {
  fileInput.addEventListener('change', function() {
    handleFiles(this.files);
  });
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, options = {}) {
  if (!statusToast) return;
  
  statusToast.className = 'toast show';
  if (options.html) {
    statusToast.innerHTML = message;
  } else {
    statusToast.textContent = message;
  }
  statusToast.style.background = options.background || 'rgba(91, 124, 250, 0.08)';
  statusToast.style.borderColor = options.borderColor || 'rgba(91, 124, 250, 0.2)';
  
  // Auto-hide after 7 seconds
  clearTimeout(statusToast._timeout);
  statusToast._timeout = setTimeout(() => {
    statusToast.className = 'toast';
  }, options.timeout || 7000);
}

// ============================================
// FILE HANDLING
// ============================================
function handleFiles(files) {
  if (!files || files.length === 0) return;

  const allowed = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'ai', 'psd', 'svg', 'zip', 'rar', 'cdr', 'xls', 'xlsx'];

  Array.from(files).forEach(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (allowed.includes(ext)) {
      uploadQueue.push(file);
    } else {
      alert(`.${ext} is not supported.`);
    }
  });

  renderPreviews();
  updateFileInput();
}

// ============================================
// RENDER FILE PREVIEWS
// ============================================
function renderPreviews() {
  if (!previewContainer) return;
  previewContainer.innerHTML = '';

  uploadQueue.forEach((file, idx) => {
    const chip = document.createElement('div');
    chip.className = 'preview-chip';
    
    // Determine icon based on file type
    const icon = file.type.startsWith('image/') ? '<i class="fas fa-image"></i>' : '<i class="fas fa-file"></i>';
    
    // Truncate long filenames
    const displayName = file.name.length > 18 ? file.name.slice(0, 15) + '…' : file.name;
    
    chip.innerHTML = `
      ${icon} 
      ${displayName} 
      <button type="button" class="remove-chip" data-idx="${idx}">
        <i class="fas fa-xmark"></i>
      </button>
    `;

    previewContainer.appendChild(chip);
    
    // Remove button handler
    const removeBtn = chip.querySelector('.remove-chip');
    if (removeBtn) {
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        uploadQueue.splice(parseInt(removeBtn.dataset.idx, 10), 1);
        renderPreviews();
        updateFileInput();
      });
    }
  });
}

// ============================================
// UPDATE FILE INPUT
// ============================================
function updateFileInput() {
  if (!fileInput) return;
  
  const dataTransfer = new DataTransfer();
  uploadQueue.forEach(file => dataTransfer.items.add(file));
  fileInput.files = dataTransfer.files;
}

// ============================================
// FORM SUBMISSION HANDLER
// ============================================
async function handleFormSubmit(e) {
  // Validate required fields
  const checkboxes = document.querySelectorAll('input[name="services[]"]:checked');
  const otherField = document.querySelector('input[name="otherService"]');
  const other = otherField ? otherField.value.trim() : '';

  // Check if at least one service is selected
  if (checkboxes.length === 0 && other === '') {
    e.preventDefault();
    showToast('⚠️ Please select at least one service or describe your request.', {
      background: 'rgba(247, 127, 58, 0.08)',
      borderColor: 'rgba(247, 127, 58, 0.2)'
    });
    return;
  }

  // Set return URL
  if (returnUrlField) {
    returnUrlField.value = window.location.href;
  }

  // Disable submit button and show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner spinner"></i> submitting to Google Sheet...';
  showToast('⏳ sending data to Google Sheet ...');

  const formData = new FormData(intakeForm);

  try {
    const resp = await fetch(scriptURL, {
      method: 'POST',
      body: formData,
      credentials: 'omit'
    });

    if (resp.ok) {
      showToast('✅ Success! Your data has been saved to Google Sheet.', {
        background: 'rgba(40, 167, 69, 0.15)',
        borderColor: 'rgba(40, 167, 69, 0.3)'
      });
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> send complete brief';
      intakeForm.reset();
      uploadQueue = [];
      renderPreviews();
      updateBadges();
    } else {
      const text = await resp.text().catch(() => '');
      // If we got a 404, provide a helpful link to Apps Script projects
      if (resp.status === 404) {
        showToast('<strong>404 Not Found.</strong> The Apps Script URL returned 404. Please verify your deployment. <a href="https://script.google.com/home/projects" target="_blank" rel="noopener">Open Apps Script</a>', { background: 'rgba(220,53,69,0.08)', borderColor: 'rgba(220,53,69,0.2)', html: true, timeout: 15000 });
      } else {
        showToast('⚠️ Submission failed. ' + (text || resp.statusText), { background: 'rgba(220,53,69,0.08)', borderColor: 'rgba(220,53,69,0.2)' });
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> send complete brief';
    }
  } catch (err) {
    // network / CORS error — fallback to regular form submit so the existing server behavior continues
    console.warn('Fetch submit failed, falling back to normal form submit:', err);
    intakeForm.removeEventListener('submit', handleFormSubmit);
    intakeForm.submit();
  }
}

// ============================================
// ATTACH FORM SUBMIT LISTENER
// ============================================
if (intakeForm) {
  intakeForm.addEventListener('submit', handleFormSubmit);
}

// ============================================
// CHECK URL PARAMETERS FOR SUCCESS STATE
// ============================================
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('success') === 'true') {
    showToast('✅ Success! Your data has been saved to Google Sheet.', {
      background: 'rgba(40, 167, 69, 0.15)',
      borderColor: 'rgba(40, 167, 69, 0.3)'
    });
    
    // Reset submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> send complete brief';
    }
  }
  
  // Check for error
  if (urlParams.get('error') === 'true') {
    showToast('❌ Error submitting form. Please try again.', {
      background: 'rgba(220, 53, 69, 0.08)',
      borderColor: 'rgba(220, 53, 69, 0.2)'
    });
    
    // Reset submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> send complete brief';
    }
  }
}

// ============================================
// EXPOSE FUNCTIONS TO WINDOW
// ============================================
window.handleFiles = handleFiles;
window.showToast = showToast;
window.updateBadges = updateBadges;

// ============================================
// INITIALIZE
// ============================================
checkUrlParams();

// Log that script is loaded
console.log('✅ Intake Form JavaScript loaded successfully');
console.log('📝 Script URL:', scriptURL);
console.log('📁 Upload queue ready:', uploadQueue);

// Debug banner: show active script URL on the page to help diagnose 404 issues
try {
  const existing = document.getElementById('scriptUrlDebug');
  if (existing) existing.remove();
  const debugEl = document.createElement('div');
  debugEl.id = 'scriptUrlDebug';
  debugEl.style.position = 'fixed';
  debugEl.style.bottom = '12px';
  debugEl.style.left = '12px';
  debugEl.style.padding = '8px 10px';
  debugEl.style.background = 'rgba(0,0,0,0.6)';
  debugEl.style.color = 'white';
  debugEl.style.fontSize = '12px';
  debugEl.style.borderRadius = '6px';
  debugEl.style.zIndex = 9999;
  debugEl.textContent = `Script URL: ${scriptURL}`;
  document.body.appendChild(debugEl);
  // Also expose current form action for quick check
  if (intakeForm) console.log('Form action:', intakeForm.action);
} catch (e) {
  console.warn('Could not add debug banner', e);
}
  // ACCORDION — auto‑close: only one open at a time
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  const accordionItems = document.querySelectorAll('.accordion-item');

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
    header.addEventListener('click', function(e) {
      const item = this.closest('.accordion-item');
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

  // BADGE COUNTS
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
      if (grid) {
        const checked = grid.querySelectorAll('input[type="checkbox"]:checked').length;
        document.getElementById(badgeId).textContent = checked;
      }
    }
  }

  document.querySelectorAll('.checkbox-container input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateBadges);
  });
  updateBadges();

  // UPLOAD
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('previewContainer');
  const statusToast = document.getElementById('statusMessage');
  const submitBtn = document.getElementById('submitBtn');
  let uploadQueue = [];

  ['dragenter', 'dragover'].forEach(ev => {
    dropArea.addEventListener(ev, e => { e.preventDefault(); dropArea.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(ev => {
    dropArea.addEventListener(ev, e => { e.preventDefault(); dropArea.classList.remove('dragover'); });
  });
  dropArea.addEventListener('drop', e => { handleFiles(e.dataTransfer.files); });

  function handleFiles(files) {
    const allowed = ['png','jpg','jpeg','gif','pdf','doc','docx','ai','psd','svg','zip','rar','cdr','xls','xlsx'];
    for (let f of files) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (allowed.includes(ext)) uploadQueue.push(f);
      else alert(`".${ext}" not supported.`);
    }
    renderPreviews();
    updateFileInput();
  }

  function renderPreviews() {
    previewContainer.innerHTML = '';
    uploadQueue.forEach((file, idx) => {
      const chip = document.createElement('div');
      chip.className = 'preview-chip';
      const icon = file.type.startsWith('image/') ? '<i class="fas fa-image"></i>' : '<i class="fas fa-file"></i>';
      chip.innerHTML = `${icon} ${file.name.length > 18 ? file.name.slice(0,15)+'…' : file.name} 
        <button type="button" class="remove-chip" data-idx="${idx}"><i class="fas fa-xmark"></i></button>`;
      previewContainer.appendChild(chip);
      chip.querySelector('.remove-chip').addEventListener('click', function(e) {
        e.stopPropagation();
        uploadQueue.splice(parseInt(this.dataset.idx), 1);
        renderPreviews();
        updateFileInput();
      });
    });
  }

  function updateFileInput() {
    const dt = new DataTransfer();
    uploadQueue.forEach(f => dt.items.add(f));
    fileInput.files = dt.files;
  }

  // ===== FORM SUBMISSION — Google Sheet via Apps Script =====
  // The form action is set to the Apps Script URL.
  // We also handle validation and UI feedback.
  document.getElementById('intakeForm').addEventListener('submit', function(e) {
    const returnUrlField = document.getElementById('returnUrl');
    if (returnUrlField) {
      returnUrlField.value = window.location.href;
    }

    const checkboxes = document.querySelectorAll('input[name="services[]"]:checked');
    const other = document.querySelector('input[name="otherService"]').value.trim();
    if (checkboxes.length === 0 && other === "") {
      e.preventDefault();
      statusToast.textContent = "⚠️ Please select at least one service or describe your request.";
      statusToast.className = "toast show";
      statusToast.style.background = "rgba(247, 127, 58, 0.08)";
      statusToast.style.borderColor = "rgba(247, 127, 58, 0.2)";
      return;
    }

    // Show loading state (the form will submit to the Apps Script URL)
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner spinner"></i> submitting to Google Sheet...';
    statusToast.textContent = "⏳ sending data to Google Sheet ...";
    statusToast.className = "toast show";
    statusToast.style.background = "rgba(91, 124, 250, 0.08)";
    statusToast.style.borderColor = "rgba(91, 124, 250, 0.2)";
  });

  // Optional: handle successful redirect or iframe postmessage
  // The Apps Script will redirect to a success page.
  // We can detect if the page was redirected back with a success param.
  (function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      statusToast.textContent = "✅ Success! Your data has been saved to Google Sheet.";
      statusToast.className = "toast show";
      statusToast.style.background = "rgba(40, 167, 69, 0.15)";
      statusToast.style.borderColor = "rgba(40, 167, 69, 0.3)";
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> send complete brief';
    }
  })();

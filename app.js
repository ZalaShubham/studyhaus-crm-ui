// ==================== STATUS TOGGLE (Open / Closed) ====================
function toggleStatus() {
  const btn  = document.getElementById('status-toggle');
  const text = btn.querySelector('.status-text');
  const isOpen = btn.classList.contains('open');

  btn.classList.toggle('open',   !isOpen);
  btn.classList.toggle('closed',  isOpen);
  text.textContent = isOpen ? 'Closed' : 'Open';
  showToast(isOpen ? 'Space marked as Closed 🔒' : 'Space marked as Open ✅', isOpen ? 'warning' : 'success');
}

// ==================== DARK / LIGHT THEME TOGGLE ====================
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const moon = document.getElementById('icon-moon');
  const sun  = document.getElementById('icon-sun');

  if (isLight) {
    moon.style.display = 'none';
    sun.style.display  = 'block';
  } else {
    moon.style.display = 'block';
    sun.style.display  = 'none';
  }
  // Persist preference
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Apply saved theme on load
(function applyTheme() {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    const moon = document.getElementById('icon-moon');
    const sun  = document.getElementById('icon-sun');
    if (moon) moon.style.display = 'none';
    if (sun)  sun.style.display  = 'block';
  }
})();

// ==================== NAVIGATION ====================
function navigate(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === page) {
      item.classList.add('active');
    }
  });

  // On mobile, close sidebar after navigation
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('mobile-open');
  }
}

// ==================== SIDEBAR TOGGLE ====================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

// ==================== FILTER TABS ====================
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    const group = this.closest('.filter-tabs');
    group.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// ==================== SEAT CLICK ====================
document.querySelectorAll('.seat').forEach(seat => {
  seat.addEventListener('click', function () {
    const title = this.getAttribute('title') || 'Seat info';
    const parts = title.split(' - ');
    const seatId = parts[0];
    const info = parts[1] || 'No info';
    showToast(`${seatId}: ${info}`, 'info');
  });
});

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('toast-visible'), 10);
  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Toast styles injected dynamically
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
    padding: 0.75rem 1.25rem; border-radius: 10px;
    font-size: 13.5px; font-weight: 600; color: #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    transform: translateY(20px); opacity: 0;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    max-width: 320px;
  }
  .toast-visible { transform: translateY(0); opacity: 1; }
  .toast-success { background: #10b981; }
  .toast-info    { background: #3b82f6; }
  .toast-warning { background: #f59e0b; }
  .toast-error   { background: #f43f5e; }
`;
document.head.appendChild(toastStyles);

// ==================== TASK CHECKBOXES ====================
document.querySelectorAll('.task-item input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', function () {
    const info = this.closest('.task-item').querySelector('.task-info');
    const badge = this.closest('.task-item').querySelector('.badge');
    if (this.checked) {
      info.classList.add('done');
      if (badge) {
        badge.className = 'badge badge-paid';
        badge.textContent = 'Done';
      }
      showToast('Task marked as complete ✓', 'success');
    } else {
      info.classList.remove('done');
      if (badge) {
        badge.className = 'badge badge-pending';
        badge.textContent = 'Open';
      }
    }
  });
});

// ==================== FORM INPUTS ====================
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
  el.addEventListener('focus', function () {
    this.closest('.form-group')?.querySelector('label')?.style.setProperty('color', '#10b981');
  });
  el.addEventListener('blur', function () {
    this.closest('.form-group')?.querySelector('label')?.style.removeProperty('color');
  });
});

// ==================== ADMISSION FORM STEPS ====================
const nextBtn = document.querySelector('.admission-form-card .btn-primary');
let currentStep = 1;
if (nextBtn) {
  nextBtn.addEventListener('click', function () {
    if (currentStep < 4) {
      currentStep++;
      updateStepper(currentStep);
      if (currentStep === 4) {
        this.textContent = 'Submit Admission';
        this.style.background = '#8b5cf6';
      }
    } else {
      showToast('Admission submitted successfully! 🎉', 'success');
      currentStep = 1;
      updateStepper(1);
      nextBtn.textContent = 'Next: Plan Selection →';
      nextBtn.style.background = '';
    }
  });
}

function updateStepper(step) {
  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.toggle('active', i < step);
  });
  const labels = ['Next: Plan Selection →', 'Next: Seat Assignment →', 'Next: Initial Payment →', 'Submit Admission'];
  if (nextBtn && step <= 4) {
    nextBtn.textContent = labels[step - 1];
  }
}

// ==================== SETTINGS SAVE ====================
const saveBtn = document.querySelector('#page-settings .btn-primary');
if (saveBtn) {
  saveBtn.addEventListener('click', () => showToast('Settings saved successfully!', 'success'));
}

// ==================== COLLECT PAYMENT BUTTONS ====================
document.querySelectorAll('.btn-xs').forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const text = this.textContent.trim();
    if (text === 'Collect') showToast('Payment collected successfully!', 'success');
    else if (text === 'Receipt') showToast('Receipt downloaded!', 'info');
    else if (text === 'Download') showToast('Document downloaded!', 'info');
    else if (text === 'Generate PDF') showToast('Generating report…', 'info');
  });
});

// ==================== PRIMARY BUTTONS ====================
document.querySelectorAll('.btn-primary').forEach(btn => {
  if (!btn.closest('.admission-form-card') && btn.id !== 'save-settings') {
    btn.addEventListener('click', function (e) {
      const text = this.textContent.trim();
      if (text.includes('New admission') || text.includes('Add Student')) {
        navigate('admissions');
      } else if (text.includes('Schedule Announcement')) {
        showToast('Announcement scheduler coming soon!', 'info');
      } else if (text.includes('New Plan') || text.includes('Log') || text.includes('Add') || text.includes('Upload') || text.includes('Mark')) {
        showToast('Feature panel opening soon…', 'info');
      }
    });
  }
});

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', function (e) {
  if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    const search = document.querySelector('.topbar-search input');
    if (document.activeElement !== search) {
      e.preventDefault();
      search?.focus();
    }
  }
  if (e.key === 'Escape') {
    const search = document.querySelector('.topbar-search input');
    search?.blur();
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('mobile-open');
    }
  }
});

// ==================== ANIMATE BARS ON ANALYTICS PAGE ====================
function animateBars() {
  const bars = document.querySelectorAll('#page-analytics .bar');
  bars.forEach((bar, i) => {
    bar.style.height = '0%';
    setTimeout(() => {
      bar.style.height = bar.style.getPropertyValue('--h') || getComputedStyle(bar).getPropertyValue('--h');
    }, i * 100 + 100);
  });
}

// Observe when analytics page becomes active
const analyticsPage = document.getElementById('page-analytics');
const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => {
    if (m.target.classList.contains('active')) animateBars();
  });
});
if (analyticsPage) observer.observe(analyticsPage, { attributes: true, attributeFilter: ['class'] });

// ==================== NOTIFICATION READ ====================
document.querySelectorAll('.notif-item.unread').forEach(item => {
  item.addEventListener('click', function () {
    this.classList.remove('unread');
    const dot = this.querySelector('.dot-unread');
    if (dot) dot.remove();
    // Update badge count
    const unread = document.querySelectorAll('.notif-item.unread').length;
    const badge = document.querySelector('.nav-badge');
    if (badge) badge.textContent = unread || '';
    if (!unread && badge) badge.style.display = 'none';
  });
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
  // Stagger metric cards animation
  document.querySelectorAll('.metric-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 60);
  });
});

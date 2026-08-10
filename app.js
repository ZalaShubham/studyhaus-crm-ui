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
    if (moon) moon.style.display = 'block';
    if (sun)  sun.style.display  = 'none';
  } else {
    if (moon) moon.style.display = 'none';
    if (sun)  sun.style.display  = 'block';
  }
  // Persist preference
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Apply saved theme on load
(function applyTheme() {
  const isLight = localStorage.getItem('theme') === 'light';
  if (isLight) {
    document.body.classList.add('light-mode');
  }
  const moon = document.getElementById('icon-moon');
  const sun  = document.getElementById('icon-sun');
  if (isLight) {
    if (moon) moon.style.display = 'block';
    if (sun)  sun.style.display  = 'none';
  } else {
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
  
  if (typeof toast.showPopover === 'function') {
    toast.setAttribute('popover', 'manual');
  }
  
  document.body.appendChild(toast);
  
  if (typeof toast.showPopover === 'function') {
    toast.showPopover();
  }

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
    position: fixed; top: auto; left: auto; bottom: 1.5rem; right: 1.5rem; z-index: 99999;
    padding: 0.75rem 1.25rem; border-radius: 10px; border: none;
    font-size: 13.5px; font-weight: 600; color: #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    transform: translateY(20px); opacity: 0; margin: 0;
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

// Override native alert with custom toast
window.alert = function(msg) {
  let type = 'info';
  const lowerMsg = String(msg).toLowerCase();
  
  if (lowerMsg.includes('error') || lowerMsg.includes('fail') || lowerMsg.includes('invalid') || lowerMsg.includes('denied')) {
    type = 'error';
  } else if (lowerMsg.includes('success') || lowerMsg.includes('saved') || lowerMsg.includes('updated') || lowerMsg.includes('approved') || lowerMsg.includes('admitted')) {
    type = 'success';
  } else if (lowerMsg.includes('warning') || lowerMsg.includes('required') || lowerMsg.includes('missing') || lowerMsg.includes('please')) {
    type = 'warning';
  }
  
  window.showToast(msg, type);
};

// ==================== CUSTOM MODALS ====================
if (!document.getElementById('modal-styles')) {
  const modalStyles = document.createElement('style');
  modalStyles.id = 'modal-styles';
  modalStyles.textContent = `
    @keyframes smoothPopup {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .smooth-modal {
      animation: smoothPopup 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .smooth-modal::backdrop {
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      animation: fadeIn 0.25s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(modalStyles);
}

window.showCustomConfirm = (title, message, confirmText = "Confirm", isDanger = false) => {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "card smooth-modal";
    dialog.style.cssText = "border:none; border-radius:12px; padding:0; box-shadow:0 10px 30px rgba(0,0,0,0.5); background: var(--bg-card, #fff); color: var(--text-primary, #0f172a); max-width: 400px; margin: auto;";
    dialog.innerHTML = `
      <div style="padding: 1.5rem; text-align: center;">
        <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">${title}</h3>
        <p style="color: var(--text-secondary, #475569); margin-bottom: 1.5rem; font-size: 0.95rem;">${message}</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn btn-ghost" id="confirm-cancel" style="flex: 1; border: 1px solid var(--border, #e2e8f0); border-radius: 999px;">Cancel</button>
          <button class="btn btn-primary" id="confirm-ok" style="flex: 1; border: none; border-radius: 999px; color: #fff; ${isDanger ? 'background: #f43f5e;' : 'background: #0f172a;'}">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector("#confirm-cancel").onclick = () => { dialog.close(); dialog.remove(); resolve(false); };
    dialog.querySelector("#confirm-ok").onclick = () => { dialog.close(); dialog.remove(); resolve(true); };
  });
};

window.showCustomPrompt = (title, message, confirmText = "Submit", isDanger = false, defaultValue = "") => {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "card smooth-modal";
    dialog.style.cssText = "border:none; border-radius:12px; padding:0; box-shadow:0 10px 30px rgba(0,0,0,0.5); background: var(--bg-card, #fff); color: var(--text-primary, #0f172a); max-width: 400px; margin: auto;";
    dialog.innerHTML = `
      <div style="padding: 1.5rem;">
        <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem; text-align: center;">${title}</h3>
        <p style="color: var(--text-secondary, #475569); margin-bottom: 1rem; font-size: 0.95rem; text-align: center;">${message}</p>
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <input type="text" id="prompt-input" value="${defaultValue}" class="input-field" style="width: 100%; box-sizing: border-box; padding: 0.5rem; border:1px solid var(--border, #e2e8f0); border-radius:6px;" autofocus />
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn btn-ghost" id="prompt-cancel" style="flex: 1; border: 1px solid var(--border, #e2e8f0); border-radius: 999px;">Cancel</button>
          <button class="btn btn-primary" id="prompt-ok" style="flex: 1; border: none; border-radius: 999px; color: #fff; ${isDanger ? 'background: #f43f5e;' : 'background: #0f172a;'}">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector("#prompt-cancel").onclick = () => { dialog.close(); dialog.remove(); resolve(null); };
    dialog.querySelector("#prompt-ok").onclick = () => {
      const val = dialog.querySelector("#prompt-input").value;
      dialog.close(); dialog.remove(); resolve(val);
    };
  });
};

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

// ==================== ANALYTICS FILTER TABS ====================
document.querySelectorAll('#page-analytics .filter-tabs .filter-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    const filterType = this.textContent.trim();
    
    const subtitle = document.querySelector('#page-analytics .page-subtitle');
    const metricValues = document.querySelectorAll('#page-analytics .metric-value');
    const metricChanges = document.querySelectorAll('#page-analytics .metric-change');
    const chartBars = document.querySelectorAll('#page-analytics .bar');
    
    if (filterType === 'This Month') {
      if(subtitle) subtitle.textContent = 'July 2024 performance overview';
      if(metricValues[0]) metricValues[0].textContent = '₹71,000';
      if(metricChanges[0]) { metricChanges[0].textContent = '↑ 12%'; metricChanges[0].className = 'metric-change positive'; }
      if(metricValues[1]) metricValues[1].textContent = '8';
      if(metricChanges[1]) { metricChanges[1].textContent = '↑ 3 vs last month'; metricChanges[1].className = 'metric-change positive'; }
      if(metricValues[2]) metricValues[2].textContent = '68%';
      if(metricChanges[2]) { metricChanges[2].textContent = '↑ 5%'; metricChanges[2].className = 'metric-change positive'; }
      if(metricValues[3]) metricValues[3].textContent = '72%';
      if(metricChanges[3]) { metricChanges[3].textContent = 'Similar to last month'; metricChanges[3].className = 'metric-change neutral'; }
      
      if(chartBars[0]) chartBars[0].style.setProperty('--h', '45%');
      if(chartBars[1]) chartBars[1].style.setProperty('--h', '58%');
      if(chartBars[2]) chartBars[2].style.setProperty('--h', '50%');
      if(chartBars[3]) chartBars[3].style.setProperty('--h', '62%');
      if(chartBars[4]) chartBars[4].style.setProperty('--h', '85%'); 
      if(chartBars[5]) chartBars[5].style.setProperty('--h', '95%'); 
    } 
    else if (filterType === 'Last Month') {
      if(subtitle) subtitle.textContent = 'June 2024 performance overview';
      if(metricValues[0]) metricValues[0].textContent = '₹63,392';
      if(metricChanges[0]) { metricChanges[0].textContent = '↑ 8%'; metricChanges[0].className = 'metric-change positive'; }
      if(metricValues[1]) metricValues[1].textContent = '5';
      if(metricChanges[1]) { metricChanges[1].textContent = '↓ 1 vs previous'; metricChanges[1].className = 'metric-change negative'; }
      if(metricValues[2]) metricValues[2].textContent = '63%';
      if(metricChanges[2]) { metricChanges[2].textContent = '↑ 2%'; metricChanges[2].className = 'metric-change positive'; }
      if(metricValues[3]) metricValues[3].textContent = '70%';
      if(metricChanges[3]) { metricChanges[3].textContent = 'Similar to previous'; metricChanges[3].className = 'metric-change neutral'; }

      if(chartBars[0]) chartBars[0].style.setProperty('--h', '35%');
      if(chartBars[1]) chartBars[1].style.setProperty('--h', '45%');
      if(chartBars[2]) chartBars[2].style.setProperty('--h', '58%');
      if(chartBars[3]) chartBars[3].style.setProperty('--h', '50%');
      if(chartBars[4]) chartBars[4].style.setProperty('--h', '62%');
      if(chartBars[5]) chartBars[5].style.setProperty('--h', '85%');
    }
    else if (filterType === 'Quarter') {
      if(subtitle) subtitle.textContent = 'Q3 2024 performance overview';
      if(metricValues[0]) metricValues[0].textContent = '₹205,500';
      if(metricChanges[0]) { metricChanges[0].textContent = '↑ 18%'; metricChanges[0].className = 'metric-change positive'; }
      if(metricValues[1]) metricValues[1].textContent = '22';
      if(metricChanges[1]) { metricChanges[1].textContent = '↑ 5 vs last quarter'; metricChanges[1].className = 'metric-change positive'; }
      if(metricValues[2]) metricValues[2].textContent = '65%';
      if(metricChanges[2]) { metricChanges[2].textContent = '↑ 4%'; metricChanges[2].className = 'metric-change positive'; }
      if(metricValues[3]) metricValues[3].textContent = '71%';
      if(metricChanges[3]) { metricChanges[3].textContent = 'Similar to last quarter'; metricChanges[3].className = 'metric-change neutral'; }

      if(chartBars[0]) chartBars[0].style.setProperty('--h', '60%');
      if(chartBars[1]) chartBars[1].style.setProperty('--h', '70%');
      if(chartBars[2]) chartBars[2].style.setProperty('--h', '65%');
      if(chartBars[3]) chartBars[3].style.setProperty('--h', '80%');
      if(chartBars[4]) chartBars[4].style.setProperty('--h', '90%'); 
      if(chartBars[5]) chartBars[5].style.setProperty('--h', '100%'); 
    }

    animateBars();
  });
});


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
  const defaultPage = document.body.getAttribute('data-default-page') || 'dashboard';
  navigate(defaultPage);
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

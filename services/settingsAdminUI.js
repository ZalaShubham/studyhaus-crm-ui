import { getSettings, saveSettings } from "./settingsService.js";

/**
 * Initializes the Settings Admin UI
 */
export const initSettingsAdminUI = async () => {
  const saveBtn = document.querySelector('#page-settings .btn-primary');
  const qrInput = document.getElementById('setting-qr-url');
  const qrUpload = document.getElementById('setting-qr-upload');
  const qrPreview = document.getElementById('setting-qr-preview');
  
  if (!saveBtn || !qrInput) return;

  // Load existing settings
  try {
    const currentSettings = await getSettings();
    if (currentSettings.qrCodeUrl) {
      if (currentSettings.qrCodeUrl.startsWith('data:image')) {
        if (qrPreview) {
          qrPreview.src = currentSettings.qrCodeUrl;
          qrPreview.style.display = 'block';
        }
      } else {
        qrInput.value = currentSettings.qrCodeUrl;
        if (qrPreview) {
          qrPreview.src = currentSettings.qrCodeUrl;
          qrPreview.style.display = 'block';
        }
      }
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }

  // Handle file upload preview
  let uploadedBase64 = null;
  if (qrUpload && qrPreview) {
    qrUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedBase64 = ev.target.result;
        qrPreview.src = uploadedBase64;
        qrPreview.style.display = 'block';
        qrInput.value = ''; // clear url input if file uploaded
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle Save
  saveBtn.addEventListener('click', async () => {
    // Collect the original function behavior
    const oldBtnText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      // Prioritize uploaded image over URL string
      const qrCodeUrl = uploadedBase64 || qrInput.value.trim();
      
      await saveSettings({
        qrCodeUrl: qrCodeUrl
      });
      
      // showToast is defined globally in app.js
      if (typeof window.showToast === 'function') {
        window.showToast('Settings saved successfully!', 'success');
      } else {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      if (typeof window.showToast === 'function') {
        window.showToast('Failed to save settings', 'error');
      } else {
        alert('Failed to save settings');
      }
    } finally {
      saveBtn.textContent = oldBtnText;
      saveBtn.disabled = false;
    }
  });
};

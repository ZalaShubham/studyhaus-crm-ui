import { getSettings, saveSettings } from "./settingsService.js";
import { fetchAllTemplates, addTemplate, updateTemplate, deleteTemplate } from "./messageTemplateService.js";

/**
 * Initializes the Settings Admin UI
 */
export const initSettingsAdminUI = async () => {
  const saveBtn = document.querySelector('#page-settings .btn-primary');
  const qrInput = document.getElementById('setting-qr-url');
  const qrUpload = document.getElementById('setting-qr-upload');
  const qrPreview = document.getElementById('setting-qr-preview');
  const langSelect = document.getElementById('setting-language');
  
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
    if (langSelect && currentSettings.language) {
      langSelect.value = currentSettings.language;
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
      const language = langSelect ? langSelect.value : "en";
      
      await saveSettings({
        qrCodeUrl: qrCodeUrl,
        language: language
      });
      
      // Immediately trigger language switch
      import('./translationService.js').then(({ setLanguage }) => {
        setLanguage(language);
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

  // --- Message Templates Logic ---
  let allTemplates = [];
  const templatesTbody = document.getElementById('settings-templates-tbody');
  const btnAddTemplate = document.getElementById('btn-add-template');
  const modalTemplate = document.getElementById('modal-template-form');
  const formTemplate = document.getElementById('form-template');

  const renderTemplates = () => {
    if (!templatesTbody) return;
    if (allTemplates.length === 0) {
      templatesTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No templates found.</td></tr>`;
      return;
    }
    
    templatesTbody.innerHTML = allTemplates.map(t => `
      <tr>
        <td style="font-weight: 500;">${t.name}</td>
        <td><div style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t.message}">${t.message}</div></td>
        <td>
          <button class="btn btn-secondary btn-edit-template" data-id="${t.id}" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;" data-i18n="btn.edit">${window.t ? window.t("btn.edit") : "Edit"}</button>
          <button class="btn btn-ghost btn-delete-template" data-id="${t.id}" style="padding: 4px 8px; font-size: 12px; color: var(--danger);" data-i18n="btn.delete">${window.t ? window.t("btn.delete") : "Delete"}</button>
        </td>
      </tr>
    `).join('');
  };

  const loadTemplates = async () => {
    try {
      allTemplates = await fetchAllTemplates();
      renderTemplates();
    } catch (e) {
      console.error("Failed to load templates:", e);
    }
  };

  // Initial load
  if (templatesTbody) {
    loadTemplates();
  }

  // Add Template button
  if (btnAddTemplate && modalTemplate) {
    btnAddTemplate.addEventListener('click', () => {
      document.getElementById('modal-template-title').innerText = "Add Template";
      document.getElementById('template-id').value = "";
      document.getElementById('template-name').value = "";
      document.getElementById('template-message').value = "";
      modalTemplate.showModal();
    });
  }

  // Edit and Delete Delegations
  if (templatesTbody) {
    templatesTbody.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.btn-edit-template');
      const deleteBtn = e.target.closest('.btn-delete-template');

      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const template = allTemplates.find(t => t.id === id);
        if (template) {
          document.getElementById('modal-template-title').innerText = "Edit Template";
          document.getElementById('template-id').value = template.id;
          document.getElementById('template-name').value = template.name;
          document.getElementById('template-message').value = template.message;
          modalTemplate.showModal();
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this template?")) {
          deleteBtn.disabled = true;
          try {
            await deleteTemplate(id);
            allTemplates = allTemplates.filter(t => t.id !== id);
            renderTemplates();
            if (window.showToast) window.showToast('Template deleted successfully', 'success');
          } catch (err) {
            console.error(err);
            if (window.showToast) window.showToast('Failed to delete template', 'error');
            deleteBtn.disabled = false;
          }
        }
      }
    });
  }

  // Form Submit
  if (formTemplate) {
    formTemplate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-template');
      saveBtn.disabled = true;
      const originalText = saveBtn.innerText;
      saveBtn.innerText = "Saving...";

      const id = document.getElementById('template-id').value;
      const name = document.getElementById('template-name').value.trim();
      const message = document.getElementById('template-message').value.trim();

      try {
        if (id) {
          const updated = await updateTemplate(id, { name, message });
          const index = allTemplates.findIndex(t => t.id === id);
          if (index !== -1) allTemplates[index] = updated;
          if (window.showToast) window.showToast('Template updated', 'success');
        } else {
          const added = await addTemplate({ name, message });
          allTemplates.push(added);
          if (window.showToast) window.showToast('Template added', 'success');
        }
        renderTemplates();
        modalTemplate.close();
      } catch (err) {
        console.error(err);
        if (window.showToast) window.showToast('Failed to save template', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
      }
    });
  }
};

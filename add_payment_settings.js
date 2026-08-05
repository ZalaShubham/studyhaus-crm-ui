const fs = require('fs');

const paymentSettingsCard = `
            <div class="card settings-card">
              <div class="settings-section-title">Payment Settings</div>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>QR Code Image URL</label>
                  <input type="url" id="setting-qr-url" placeholder="https://example.com/qr.png" />
                  <small style="color:var(--text-muted); font-size:11px; margin-top:4px; display:block;">Provide a direct link to your payment QR code image.</small>
                </div>
              </div>
            </div>`;

const files = [
  'e:/INTERNSHIP-JUNTOAUG2026/clone/admin/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/manager/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/employee/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/index.html'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('Payment Settings')) {
      content = content.replace(
        '<div class="card settings-card">\n              <div class="settings-section-title">Preferences</div>',
        paymentSettingsCard + '\n            <div class="card settings-card">\n              <div class="settings-section-title">Preferences</div>'
      );
      fs.writeFileSync(f, content, 'utf8');
      console.log('Updated ' + f);
    }
  }
});

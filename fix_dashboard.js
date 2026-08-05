const fs = require('fs');

let content = fs.readFileSync('admin/dashboard.html', 'utf-8');

// 1. Students Page - Leaving Date Column
content = content.replace(
  `<th style="cursor:pointer;" onclick="window.setSort('paymentDueDate')">Due Date ↕</th>
                  <th style="cursor:pointer;" onclick="window.setSort('status')">Status ↕</th>`,
  `<th style="cursor:pointer;" onclick="window.setSort('paymentDueDate')">Due Date ↕</th>
                  <th style="cursor:pointer;" onclick="window.setSort('plannedExitDate')">Leaving Date ↕</th>
                  <th style="cursor:pointer;" onclick="window.setSort('status')">Status ↕</th>`
);

content = content.replace(
  `<tbody id="students-table-body">
                <tr><td colspan="7" style="text-align:center;">Loading...</td></tr>
              </tbody>`,
  `<tbody id="students-table-body">
                <tr><td colspan="8" style="text-align:center;">Loading...</td></tr>
              </tbody>`
);


// 2. Announcements
content = content.replace(
  `<select id="ann-audience">
                    <option value="All Students">All Students</option>
                    <option value="Active Students">Active Students Only</option>
                    <option value="Staff">Staff</option>
                  </select>`,
  `<select id="ann-audience" onchange="window.handleAudienceChange && window.handleAudienceChange()">
                    <option value="All Students">All Students</option>
                    <option value="Active Students">Active Students Only</option>
                    <option value="Staff">Staff</option>
                    <option value="Specific Students">Specific Students</option>
                  </select>
                </div>
                <div class="form-group" id="ann-specific-students-group" style="display: none; margin-bottom: 1rem;">
                  <label>Select Students</label>
                  <div id="ann-specific-students-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; font-size: 13px;">
                    <!-- Checkboxes injected by JS -->
                  </div>`
);

// 3. DOB required
content = content.replace(
  `<label style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 6px; display: block;">Date of birth</label>
                    <input type="date" id="adm-dob" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #64748b;" />`,
  `<label style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 6px; display: block;">Date of birth *</label>
                    <input type="date" id="adm-dob" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #64748b;" required />`
);

// 4. Payment Settings
content = content.replace(
  `<div class="card settings-card">
              <div class="settings-section-title">Preferences</div>`,
  `<div class="card settings-card">
              <div class="settings-section-title">Payment Settings</div>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label>Upload QR Code Image</label>
                  <input type="file" id="setting-qr-upload" accept="image/*" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--border);" />
                  <div style="margin-top: 0.5rem; text-align: center;">
                    <img id="setting-qr-preview" src="" style="max-height: 150px; display: none; border: 1px solid var(--border); border-radius: 8px; margin: 0 auto;" />
                  </div>
                  <div style="margin-top: 1rem;">
                    <label>Or enter Image URL</label>
                    <input type="url" id="setting-qr-url" placeholder="https://example.com/qr.png" />
                  </div>
                  <small style="color:var(--text-muted); font-size:11px; margin-top:4px; display:block;">Upload a QR code or provide a direct link to it.</small>
                </div>
              </div>
            </div>
            <div class="card settings-card">
              <div class="settings-section-title">Preferences</div>`
);

fs.writeFileSync('admin/dashboard.html', content);
console.log('Fixed admin/dashboard.html!');

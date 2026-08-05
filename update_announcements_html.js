const fs = require('fs');

const files = [
  'e:/INTERNSHIP-JUNTOAUG2026/clone/admin/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/employee/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/manager/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/index.html'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Add "Specific Students" to Audience dropdown and onchange event
    content = content.replace(
      /<select id="ann-audience">/g,
      '<select id="ann-audience" onchange="window.handleAudienceChange && window.handleAudienceChange()">'
    );
    
    if (!content.includes('<option value="Specific Students">Specific Students</option>')) {
      content = content.replace(
        /<option value="Staff">Staff<\/option>/g,
        '<option value="Staff">Staff</option>\n                    <option value="Specific Students">Specific Students</option>'
      );
    }
    
    // Add specific students div right after audience div
    const specificStudentsDiv = `
                <div class="form-group" id="ann-specific-students-group" style="display: none; margin-bottom: 1rem;">
                  <label>Select Students</label>
                  <div id="ann-specific-students-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; font-size: 13px;">
                    <!-- Checkboxes injected by JS -->
                  </div>
                </div>`;
                
    if (!content.includes('id="ann-specific-students-group"')) {
      content = content.replace(
        /(<select id="ann-audience"[\s\S]*?<\/select>\s*<\/div>)/,
        `$1${specificStudentsDiv}`
      );
    }

    fs.writeFileSync(file, content);
    console.log('Updated HTML file: ' + file);
  }
});

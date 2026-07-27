const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const staffStart = html.indexOf('<!-- Staff Page -->');
const tasksStart = html.indexOf('<!-- Tasks Page -->');

if (staffStart === -1 || tasksStart === -1) {
  console.error("Could not find bounds of Staff page in index.html");
  process.exit(1);
}

const replacement = `<!-- Staff Page -->
        <div class="page" id="page-staff">
          <div class="page-header" style="margin-bottom: 2rem;">
            <div>
              <h1>Staff</h1>
              <p class="page-subtitle">Employees, roles, and payroll.</p>
            </div>
            <div>
              <button class="btn btn-primary" style="background:#1e3a8a; color:#fff; border:none; border-radius:999px; padding:8px 16px; font-weight:500; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Add staff
              </button>
            </div>
          </div>
          
          <div class="card" style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
            <h3 style="font-size:15px; font-weight:600; color:#0f172a; margin-bottom:1.5rem;">Team (4)</h3>
            
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; color:#475569;">
                <thead>
                  <tr style="color:#94a3b8; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; border-top:1px solid #e2e8f0;">
                    <th style="padding:12px 16px; font-weight:700; color:#0f172a;">Name</th>
                    <th style="padding:12px 16px; font-weight:700;">Role</th>
                    <th style="padding:12px 16px; font-weight:700;">Contact</th>
                    <th style="padding:12px 16px; font-weight:700;">Joined</th>
                    <th style="padding:12px 16px; font-weight:700; text-align:right;">Salary</th>
                    <th style="padding:12px 16px; font-weight:700; text-align:right;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px; display:flex; align-items:center; gap:12px;">
                      <div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; color:#475569; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600;">SY</div>
                      <span style="font-weight:600; color:#0f172a;">Suresh Yadav</span>
                    </td>
                    <td style="padding:16px;">Receptionist</td>
                    <td style="padding:16px;">+91 9876500011</td>
                    <td style="padding:16px;">2024-06-10</td>
                    <td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹15,000</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Active</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px; display:flex; align-items:center; gap:12px;">
                      <div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; color:#475569; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600;">RK</div>
                      <span style="font-weight:600; color:#0f172a;">Ramesh Kumar</span>
                    </td>
                    <td style="padding:16px;">Cleaner</td>
                    <td style="padding:16px;">+91 9876500022</td>
                    <td style="padding:16px;">2024-08-01</td>
                    <td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹9,000</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Active</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px; display:flex; align-items:center; gap:12px;">
                      <div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; color:#475569; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600;">AS</div>
                      <span style="font-weight:600; color:#0f172a;">Anita Sharma</span>
                    </td>
                    <td style="padding:16px;">Manager</td>
                    <td style="padding:16px;">+91 9876500033</td>
                    <td style="padding:16px;">2024-01-15</td>
                    <td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹25,000</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">Active</span></td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:16px; display:flex; align-items:center; gap:12px;">
                      <div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; color:#475569; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600;">VS</div>
                      <span style="font-weight:600; color:#0f172a;">Vikas Singh</span>
                    </td>
                    <td style="padding:16px;">Security</td>
                    <td style="padding:16px;">+91 9876500044</td>
                    <td style="padding:16px;">2025-02-20</td>
                    <td style="padding:16px; font-weight:600; color:#0f172a; text-align:right;">₹12,000</td>
                    <td style="padding:16px; text-align:right;"><span style="background:#fffbeb; color:#d97706; border:1px solid #fde68a; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:600;">On Leave</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
`;

const newHtml = html.substring(0, staffStart) + replacement + "\n          " + html.substring(tasksStart);
fs.writeFileSync('index.html', newHtml);
console.log('index.html updated successfully with Staff page.');

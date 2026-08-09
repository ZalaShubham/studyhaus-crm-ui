const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const admissionsStart = html.indexOf('<!-- Admissions Page -->');
const admissionsEnd = html.indexOf('<!-- Payments Page -->');

if (admissionsStart === -1 || admissionsEnd === -1) {
  console.error("Could not find bounds of Admissions page in index.html");
  process.exit(1);
}

const replacement = `<!-- Admissions Page -->
        <div class="page" id="page-admissions">
          <div class="page-header" style="margin-bottom: 1.5rem;">
            <div>
              <h1>Admissions</h1>
              <p class="page-subtitle">Add students directly or review pending self-registrations.</p>
            </div>
          </div>

          <!-- Tab Pills -->
          <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem;">
            <button class="btn btn-primary" id="tab-new-admission" onclick="window.switchAdmissionTab('new')" style="background:#fff; color:#0f172a; border:1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius:999px; font-weight:600; padding:6px 16px; font-size:13px;">New admission</button>
            <button class="btn btn-ghost" id="tab-pending-approval" onclick="window.switchAdmissionTab('pending')" style="background:#f1f5f9; color:#64748b; border:none; border-radius:999px; font-weight:500; padding:6px 16px; font-size:13px;">Pending approval</button>
          </div>

          <!-- New Admission Form View -->
          <div id="view-new-admission" style="display: flex; gap: 1.5rem; align-items: flex-start;">
            
            <!-- Form Card -->
            <div class="card" style="flex: 1; padding: 2rem; border-radius: 12px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
              <h3 style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">Student details</h3>
              <p style="font-size: 13px; color: #64748b; margin-bottom: 2rem;">Fields marked * are required. Students can sign in later using their phone number.</p>
              
              <form id="admission-form" onsubmit="event.preventDefault(); window.submitAdmissionForm();">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Student Name *</label>
                    <input type="text" id="adm-name" required style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;" />
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Mobile *</label>
                    <input type="tel" pattern="[0-9]{10}" id="adm-phone" required style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;" />
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Parent mobile</label>
                    <input type="tel" pattern="[0-9]{10}" id="adm-parent-phone" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;" />
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Email</label>
                    <input type="email" id="adm-email" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;" />
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Date of birth *</label>
                    <input type="date" id="adm-dob" required style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; color: var(--text-primary);" />
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Gender *</label>
                    <select id="adm-gender" required style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; color: var(--text-primary); background: var(--bg-card);">
                      <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">College / Institute</label>
                    <input type="text" id="adm-college" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;" />
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Course</label>
                    <input type="text" id="adm-course" placeholder="UPSC, CA, JEE..." style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;" />
                  </div>
                  <div class="form-group" style="grid-column: 1 / -1; margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Address</label>
                    <textarea id="adm-address" rows="2" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;"></textarea>
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Membership plan *</label>
                    <select id="adm-plan" required onchange="window.updateSummary()" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; color: var(--text-primary); background: var(--bg-card);">
                      <option value="">Choose plan</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin:0;">
                    <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">Seat (optional)</label>
                    <select id="adm-seat" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; color: var(--text-primary); background: var(--bg-card);">
                      <option value="">Loading...</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <!-- Sticky Summary Sidebar -->
            <div style="width: 280px; position: sticky; top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
              <div class="card" style="padding: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: none;">
                <h4 style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 1rem;">SUMMARY</h4>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 12px;">
                  <span>Plan</span><span id="summary-plan" style="color: #0f172a; font-weight: 600;">—</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 12px;">
                  <span>Amount</span><span id="summary-amount" style="color: #0f172a; font-weight: 600;">—</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 12px;">
                  <span>Start</span><span id="summary-start" style="color: #0f172a; font-weight: 600;">—</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
                  <span>Ends</span><span id="summary-ends" style="color: #0f172a; font-weight: 600;">—</span>
                </div>
              </div>
              <button class="btn btn-primary" id="btn-submit-admission" onclick="document.getElementById('admission-form').requestSubmit()" style="background: #1e3a8a; color: #fff; width: 100%; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; border:none; cursor:pointer;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Confirm admission
              </button>
            </div>
            
          </div>
          
          <!-- Pending Approval View -->
          <div id="view-pending-approval" style="display: none;">
            <div class="card" style="padding: 1.5rem; border-radius: 12px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
              <h3 style="margin-bottom: 1.5rem; font-size: 15px; font-weight: 600;">Pending Approvals</h3>
              <div class="table-container">
                <table class="data-table" style="width: 100%; text-align: left; font-size: 13px;">
                  <thead>
                    <tr style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                      <th style="padding: 12px 16px;">Student</th>
                      <th style="padding: 12px 16px;">Phone</th>
                      <th style="padding: 12px 16px;">Plan</th>
                      <th style="padding: 12px 16px;">Date</th>
                      <th style="padding: 12px 16px; text-align:right;">Action</th>
                    </tr>
                  </thead>
                  <tbody id="pending-admissions-body">
                    <tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        `;

const newHtml = html.substring(0, admissionsStart) + replacement + html.substring(admissionsEnd);
fs.writeFileSync('index.html', newHtml);
console.log('index.html updated successfully.');

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Sidebar Logo
html = html.replace(
  /<div class="sidebar-logo">[\s\S]*?<\/div>/,
  `<div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>
        <div class="logo-text">
          <div class="logo-text-main">Studyhaus</div>
          <div class="logo-text-sub">Reading Space CRM</div>
        </div>
      </div>`
);

// 2. Seat Legend
html = html.replace(
  /<div class="seat-legend">[\s\S]*?<\/div>/,
  `<div class="seat-legend">
              <span class="legend-pill available"><span class="legend-dot"></span>Available</span>
              <span class="legend-pill occupied"><span class="legend-dot"></span>Occupied</span>
              <span class="legend-pill reserved"><span class="legend-dot"></span>Reserved</span>
              <span class="legend-pill maintenance"><span class="legend-dot"></span>Maintenance</span>
            </div>`
);

// 3. Seat Map layout changes
// We'll wrap the floors in a tab group and put them in a big card.
html = html.replace(
  /<div class="seat-floors">/,
  `<div class="floor-tabs">
            <button class="floor-tab active">Ground Floor</button>
            <button class="floor-tab">First Floor</button>
            <button class="floor-tab">Second Floor</button>
          </div>
          <div class="card" style="padding: 2rem;">
            <div class="seat-floors">`
);

// Close the card after seat-floors
html = html.replace(
  /<\/div>\s*<!-- Memberships Page -->/,
  `<\/div>\n          <\/div>\n\n        <!-- Memberships Page -->`
);

// 4. Update the Topbar elements
// E.g. "Open" badge
html = html.replace(
  /<button class="status-badge open".*?>[\s\S]*?<\/button>/,
  `<button class="status-badge open" id="status-toggle" onclick="toggleStatus()">
            <span class="status-dot"></span>
            <span class="status-text">Open</span>
          </button>`
);

// 5. Update Membership Plans
html = html.replace(
  /<div class="plan-grid" id="membership-plans-grid">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Attendance Page -->/,
  `<div class="plan-grid" id="membership-plans-grid">
            <div class="plan-card">
              <div class="plan-header">
                <div class="plan-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="12" rx="2"></rect><line x1="8" y1="5" x2="16" y2="5"></line></svg></div>
                <div class="plan-title-area">
                  <h3>Regular Fixed Seat</h3>
                  <p>Permanently assigned seat, all-day access.</p>
                </div>
              </div>
              <div class="plan-price-area">
                <div class="plan-price">₹1,000<span> / month</span></div>
              </div>
              <div class="plan-features">
                <div class="plan-feature"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>All-day access</div>
                <div class="plan-feature"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>2 active</div>
              </div>
              <div class="plan-actions">
                <button class="btn btn-ghost">Edit</button>
                <button class="btn btn-primary">Assign</button>
              </div>
            </div>

            <div class="plan-card">
              <div class="plan-header">
                <div class="plan-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg></div>
                <div class="plan-title-area">
                  <h3>Rotational Seat</h3>
                  <p>No fixed seat. Capped at 30 active students.</p>
                </div>
              </div>
              <div class="plan-price-area">
                <div class="plan-price">₹800<span> / month</span></div>
              </div>
              <div class="plan-features">
                <div class="plan-feature"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>All-day access</div>
                <div class="plan-feature"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>0 active · cap 30</div>
              </div>
              <div class="plan-actions">
                <button class="btn btn-ghost">Edit</button>
                <button class="btn btn-primary">Assign</button>
              </div>
            </div>

            <div class="plan-card">
              <div class="plan-header">
                <div class="plan-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div>
                <div class="plan-title-area">
                  <h3>Night Study</h3>
                  <p>Night access 7 PM – 7 AM only.</p>
                </div>
              </div>
              <div class="plan-price-area">
                <div class="plan-price">₹700<span> / month</span></div>
              </div>
              <div class="plan-features">
                <div class="plan-feature"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>7 PM – 7 AM</div>
                <div class="plan-feature"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>0 active</div>
              </div>
              <div class="plan-actions">
                <button class="btn btn-ghost">Edit</button>
                <button class="btn btn-primary">Assign</button>
              </div>
            </div>
          </div>
        </div>
        <!-- Attendance Page -->`
);

// 6. Update Attendance Metrics
html = html.replace(
  /<div><h1>Attendance<\/h1><p class="page-subtitle">.*?<\/p><\/div>/,
  `<div><h1>Attendance</h1><p class="page-subtitle">Live check-ins, QR scans, and attendance trends.</p></div>`
);
html = html.replace(
  /<div class="page-header">\s*<div><h1>Attendance<\/h1><p class="page-subtitle">.*?<\/p><\/div>\s*<button class="btn btn-primary">[\s\S]*?<\/button>\s*<\/div>/,
  `<div class="page-header">
            <div><h1>Attendance</h1><p class="page-subtitle">Live check-ins, QR scans, and attendance trends.</p></div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export</button>
              <button class="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Scan QR</button>
            </div>
          </div>
          <div class="att-metrics">
            <div class="att-metric-card">
              <div class="att-metric-info">
                <div class="att-metric-label">Present Today</div>
                <div class="att-metric-val">21</div>
              </div>
              <div class="att-metric-icon present"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></div>
            </div>
            <div class="att-metric-card">
              <div class="att-metric-info">
                <div class="att-metric-label">Absent Today</div>
                <div class="att-metric-val">3</div>
              </div>
              <div class="att-metric-icon absent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path><path d="M9 11l6 6"></path><path d="M15 11l-6 6"></path></svg></div>
            </div>
            <div class="att-metric-card">
              <div class="att-metric-info">
                <div class="att-metric-label">Late Arrivals</div>
                <div class="att-metric-val">3</div>
              </div>
            </div>
            <div class="att-metric-card">
              <div class="att-metric-info">
                <div class="att-metric-label">Avg Hours</div>
                <div class="att-metric-val">5.9h</div>
              </div>
            </div>
          </div>`
);

// 7. Update Admissions Form (Replace the entire page-admissions content)
html = html.replace(
  /<div class="page" id="page-admissions">[\s\S]*?<!-- Settings Page -->/,
  `<div class="page" id="page-admissions">
          <div class="page-header">
            <div><h1>Admissions</h1><p class="page-subtitle">Add students directly or review pending self-registrations.</p></div>
          </div>
          
          <div class="floor-tabs" style="margin-bottom: 2rem;">
            <button class="floor-tab active">New admission</button>
            <button class="floor-tab">Pending approval</button>
          </div>

          <div class="admission-layout">
            <div class="admission-form-area card" style="padding: 2rem;">
              <div class="form-section-title">Student details</div>
              <div class="form-section-desc">Fields marked * are required. Students can sign in later using their phone number.</div>
              
              <form id="admission-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label>Full name *</label>
                    <input type="text" id="adm-name" required />
                  </div>
                  <div class="form-group">
                    <label>Mobile *</label>
                    <input type="tel" id="adm-phone" required />
                  </div>
                  <div class="form-group">
                    <label>Parent mobile</label>
                    <input type="tel" id="adm-parent-phone" />
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="adm-email" />
                  </div>
                  <div class="form-group">
                    <label>Date of birth</label>
                    <input type="date" id="adm-dob" />
                  </div>
                  <div class="form-group">
                    <label>Gender</label>
                    <select id="adm-gender"><option>Select</option><option>Male</option><option>Female</option><option>Other</option></select>
                  </div>
                  <div class="form-group">
                    <label>College / Institute</label>
                    <input type="text" id="adm-college" />
                  </div>
                  <div class="form-group">
                    <label>Course</label>
                    <input type="text" id="adm-course" placeholder="UPSC, CA, JEE..." />
                  </div>
                  <div class="form-group full">
                    <label>Address</label>
                    <textarea id="adm-address" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Membership plan *</label>
                    <select id="adm-plan"><option>Choose plan</option></select>
                  </div>
                  <div class="form-group">
                    <label>Seat (optional)</label>
                    <select id="adm-seat"><option>58 available</option></select>
                  </div>
                </div>
              </form>
            </div>

            <div class="admission-summary-area">
              <div class="summary-card">
                <div class="summary-title">SUMMARY</div>
                <div class="summary-row"><span>Plan</span><span>—</span></div>
                <div class="summary-row"><span>Amount</span><span>—</span></div>
                <div class="summary-row"><span>Start</span><span>27/7/2026</span></div>
                <div class="summary-row"><span>Ends</span><span>27/8/2026</span></div>
              </div>
              <button class="btn btn-primary" style="width: 100%; margin-top: 1rem; padding: 12px; font-size: 14px;" id="btn-confirm-admission">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Confirm admission
              </button>
            </div>
          </div>
        </div>

        <!-- Settings Page -->`
);

fs.writeFileSync('index.html', html);
console.log('index.html updated successfully.');

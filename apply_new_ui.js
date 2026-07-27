const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('style.css', 'utf8');

// Replace Root
css = css.replace(/:root {[\s\S]*?}/, `:root {
  --bg-base:       #f8fafc;
  --bg-card:       #ffffff;
  --bg-hover:      #f1f5f9;
  --bg-gray:       #f1f5f9;
  --border:        #e2e8f0;
  --text-primary:  #0f172a;
  --text-secondary:#475569;
  --text-muted:    #94a3b8;
  
  --primary:       #0f172a;
  --accent-emerald: #10b981;
  --accent-red:     #f43f5e;
  --accent-amber:   #f59e0b;
  --accent-blue:    #3b82f6;

  --sidebar-w: 240px;
}`);

// Remove light mode body block since root is now light mode
css = css.replace(/body\.light-mode \{[\s\S]*?\}/, '');

// Fix nav item active
css = css.replace(/\.nav-item\.active \{[\s\S]*?\}/, `.nav-item.active {
  background: var(--bg-gray);
  color: var(--text-primary);
  font-weight: 600;
  border-radius: 12px;
}`);

// Update logo
css = css.replace(/\.logo-icon \{[\s\S]*?\}/, `.logo-icon {
  width: 32px; height: 32px;
  background: var(--primary);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}`);
css = css.replace(/\.logo-text \{[\s\S]*?\}/, `.logo-text {
  display: flex; flex-direction: column;
}`);

// Add missing seat map styles
css += `
/* Seat Map Overrides */
.seat-legend { display: flex; gap: 1rem; margin-bottom: 1.5rem; font-size: 13px; font-weight: 500; flex-wrap: wrap; }
.legend-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; border: 1px solid transparent; background: #fff; }
.legend-pill.available { color: #166534; border-color: #bbf7d0; }
.legend-pill.occupied { color: #991b1b; border-color: #fecaca; }
.legend-pill.reserved { color: #92400e; border-color: #fde68a; }
.legend-pill.maintenance { color: #1e40af; border-color: #bfdbfe; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

.floor-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: var(--bg-gray); padding: 4px; border-radius: 999px; display: inline-flex; }
.floor-tab { background: transparent; border: none; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; }
.floor-tab.active { background: #fff; color: var(--text-primary); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

.seat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; }
.seat { 
  height: 80px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: 0.2s;
  background: var(--bg-card);
}
.seat.available { color: #166534; border-color: #bbf7d0; background: #f0fdf4; }
.seat.occupied { color: #991b1b; border-color: #fecaca; background: #fef2f2; }
.seat.reserved { color: #92400e; border-color: #fde68a; background: #fffbeb; }
.seat.maintenance { color: #1e40af; border-color: #bfdbfe; background: #eff6ff; }
.topbar-search { border-radius: 999px; background: #fff; border: 1px solid var(--border); }
`;
fs.writeFileSync('style.css', css);

// 2. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Logo update
html = html.replace(/<div class="logo-icon">S<\/div>\s*<span class="logo-text">Studyhaus<\/span>/, 
  `<div class="logo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>
        <div class="logo-text">
          <div style="font-weight: 700; font-size: 1.1rem; color: #0f172a; line-height: 1.2;">Studyhaus</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Reading Space CRM</div>
        </div>`);

// Topbar Open badge
html = html.replace(/<button class="status-badge open".*?>[\s\S]*?<\/button>/, 
  `<button class="status-badge open" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;" id="status-toggle" onclick="toggleStatus()"><span class="status-dot"></span><span class="status-text">Open</span></button>`);

// Topbar User Avatar
html = html.replace(/<div class="topbar-avatar".*?>\?<\/div>/, `<div class="topbar-avatar" style="background:#0f172a; color:#fff;">V</div>`);
html = html.replace(/<span class="topbar-username".*?>…<\/span>/, `<span class="topbar-username" id="current-user-name">Vraj</span>`);

// Seat Map Header Buttons
html = html.replace(/<div>\s*<h1>Seat Map<\/h1>\s*<p class="page-subtitle">36 occupied · 18 available across 3 floors<\/p>\s*<\/div>/, 
  `<div>
              <h1>Seat Map</h1>
              <p class="page-subtitle">36 occupied · 18 available across 3 floors</p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-ghost" style="background: #fff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 999px; padding: 6px 16px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filter</button>
              <button class="btn btn-primary" style="background: #0f172a; color: #fff; border-radius: 999px; padding: 6px 16px;">+ Add seat</button>
            </div>`);

// Seat Map Legend
html = html.replace(/<div class="seat-legend">[\s\S]*?<\/div>/, 
  `<div class="seat-legend">
              <span class="legend-pill available"><span class="legend-dot"></span>Available</span>
              <span class="legend-pill occupied"><span class="legend-dot"></span>Occupied</span>
              <span class="legend-pill reserved"><span class="legend-dot"></span>Reserved</span>
              <span class="legend-pill maintenance"><span class="legend-dot"></span>Maintenance</span>
            </div>`);

// Seat Map Floors structure update to add pills
html = html.replace(/<div class="seat-floors">/, 
  `<div class="floor-tabs">
            <button class="floor-tab active">Ground Floor</button>
            <button class="floor-tab">First Floor</button>
            <button class="floor-tab">Second Floor</button>
          </div>
          <div class="card" style="padding: 1.5rem;">
            <div class="seat-floors">`);

html = html.replace(/<\/div>\s*<!-- Memberships Page -->/, `</div></div>\n        <!-- Memberships Page -->`);

// Replace seat numbers like G-01 to 01 inside the span
// We use a regex to capture G-, F-, S- followed by digits inside the seat spans
html = html.replace(/<span>([GFS])-(\d+)<\/span>/g, '<span>$2</span>');

fs.writeFileSync('index.html', html);
console.log('Update complete!');

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
  --border-bright: #cbd5e1;
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

// Add missing generic utilities
css += `
.topbar-search { border-radius: 999px !important; background: #fff !important; border: 1px solid var(--border) !important; }
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

// Update sidebar nav label for Seat Management -> Seat Map
html = html.replace(/Seat Management/g, 'Seat Map');

fs.writeFileSync('index.html', html);
console.log('index.html and style.css updated!');

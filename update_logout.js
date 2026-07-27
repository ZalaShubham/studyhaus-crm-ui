const fs = require('fs');

// 1. Update style.css
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('.user-dropdown')) {
    css += `\n/* User Dropdown */
.topbar-user {
  position: relative;
  cursor: pointer;
}
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 220px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  display: none;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
}
.topbar-user:hover .user-dropdown, .topbar-user:focus-within .user-dropdown {
  display: flex;
}
.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}
.dropdown-item {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
`;
    fs.writeFileSync('style.css', css);
    console.log("Updated style.css");
}

// 2. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Remove logout button from sidebar
const logoutBtnRegex = /<button onclick="window\.logout\(\)" style="margin-top: 1rem;[\s\S]*?Logout\s*<\/button>/;
html = html.replace(logoutBtnRegex, '');

// Replace .topbar-user
const oldUser = `<div class="topbar-user">
            <div class="topbar-avatar" style="background:var(--primary); color:#fff;">V</div>
            <span class="topbar-username" id="current-user-name">Vraj</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--text-muted)"><polyline points="6 9 12 15 18 9"/></svg>
          </div>`;

const newUser = `<div class="topbar-user" tabindex="0">
            <div class="topbar-avatar" style="background:var(--primary); color:#fff;">V</div>
            <span class="topbar-username" id="current-user-name">Vraj</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--text-muted)"><polyline points="6 9 12 15 18 9"/></svg>
            
            <div class="user-dropdown">
              <div class="dropdown-header">Signed In As Employee</div>
              <div class="dropdown-item">Profile</div>
              <div class="dropdown-item">Reading space settings</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" onclick="window.logout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </div>
            </div>
          </div>`;

// Fallback regex if precise string matching fails (due to whitespace)
const userRegex = /<div class="topbar-user">[\s\S]*?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var\(--text-muted\)"><polyline points="6 9 12 15 18 9"\/><\/svg>\s*<\/div>/;

if (html.includes(oldUser)) {
    html = html.replace(oldUser, newUser);
    console.log("Updated topbar user (string match)");
} else if (userRegex.test(html)) {
    html = html.replace(userRegex, newUser);
    console.log("Updated topbar user (regex match)");
} else {
    console.log("Could not find topbar user block to replace.");
}

fs.writeFileSync('index.html', html);
console.log("Updated index.html");

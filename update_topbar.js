const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace Logo
const oldLogo = `<div class="logo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>
        <div class="logo-text">
          <div style="font-weight: 700; font-size: 1.1rem; color: #0f172a; line-height: 1.2;">Studyhaus</div>
          <div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Reading Space CRM</div>
        </div>`;

const newLogo = `<div class="logo-icon" style="background: #0284c7; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        </div>
        <div class="logo-text">
          <div style="font-weight: 700; font-size: 1.1rem; color: #1e3a8a; line-height: 1.2;">Studyhaus</div>
          <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">Reading Space CRM</div>
        </div>`;

if (html.includes(oldLogo)) {
    html = html.replace(oldLogo, newLogo);
    console.log("Updated logo successfully.");
} else {
    console.log("Could not find old logo string.");
}

// 2. Add Notification Bell
const oldTopbarActions = `<button class="status-badge open" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;" id="status-toggle" onclick="toggleStatus()"><span class="status-dot"></span><span class="status-text">Open</span></button>
          <button class="icon-btn theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode">`;

const newTopbarActions = `<button class="status-badge open" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;" id="status-toggle" onclick="toggleStatus()"><span class="status-dot"></span><span class="status-text">Open</span></button>
          <button class="icon-btn" onclick="navigate('notifications')" title="Notifications" style="position: relative;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span style="position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background-color: #ef4444; border-radius: 50%;"></span>
          </button>
          <button class="icon-btn theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode">`;

if (html.includes(oldTopbarActions)) {
    html = html.replace(oldTopbarActions, newTopbarActions);
    console.log("Updated topbar actions successfully.");
} else {
    // Try with CRLF just in case
    const oldTopbarActionsCRLF = `<button class="status-badge open" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;" id="status-toggle" onclick="toggleStatus()"><span class="status-dot"></span><span class="status-text">Open</span></button>\r\n          <button class="icon-btn theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode">`;
    const newTopbarActionsCRLF = `<button class="status-badge open" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;" id="status-toggle" onclick="toggleStatus()"><span class="status-dot"></span><span class="status-text">Open</span></button>\r\n          <button class="icon-btn" onclick="navigate('notifications')" title="Notifications" style="position: relative;">\r\n            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>\r\n            <span style="position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background-color: #ef4444; border-radius: 50%;"></span>\r\n          </button>\r\n          <button class="icon-btn theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode">`;
    if (html.includes(oldTopbarActionsCRLF)) {
        html = html.replace(oldTopbarActionsCRLF, newTopbarActionsCRLF);
        console.log("Updated topbar actions successfully (CRLF).");
    } else {
        console.log("Could not find old topbar actions string.");
    }
}

fs.writeFileSync('index.html', html);

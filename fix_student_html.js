const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Replace the malformed sidebar-logo section with the correct one
const correctSidebarLogo = `      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>
        <div class="logo-text">
          <div class="logo-text-main">Studyhaus</div>
          <div class="logo-text-sub">Reading Space CRM</div>
        </div>
      </div>`;

// Find the start of sidebar-logo and the start of sidebar-nav, and replace everything in between
html = html.replace(/<div class="sidebar-logo">[\s\S]*?<nav class="sidebar-nav">/, correctSidebarLogo + '\n\n      <nav class="sidebar-nav">');

fs.writeFileSync('index.html', html);
console.log('index.html fixed!');

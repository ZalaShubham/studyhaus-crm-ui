const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Use regex to match the logo so it works regardless of line endings/spaces
const logoRegex = /<div class="logo-icon">[\s\S]*?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"\/><\/svg><\/div>\s*<div class="logo-text">\s*<div style="font-weight: 700; font-size: 1.1rem; color: #0f172a; line-height: 1.2;">Studyhaus<\/div>\s*<div style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Reading Space CRM<\/div>\s*<\/div>/g;

const newLogo = `<div class="logo-icon" style="background: #0284c7; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        </div>
        <div class="logo-text">
          <div style="font-weight: 700; font-size: 1.1rem; color: #1e3a8a; line-height: 1.2;">Studyhaus</div>
          <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">Reading Space CRM</div>
        </div>`;

if (logoRegex.test(html)) {
    html = html.replace(logoRegex, newLogo);
    console.log("Updated logo successfully using regex.");
    fs.writeFileSync('index.html', html);
} else {
    console.log("Could not find old logo string even with regex.");
}

const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// The topbar avatar
html = html.replace(
    /<div class="topbar-avatar" style="background:var\(--primary\); color:#fff;">V<\/div>/g,
    '<div class="topbar-avatar" id="topbar-user-avatar" style="background:var(--primary); color:#fff;">V</div>'
);

// The topbar username
html = html.replace(
    /<span class="topbar-username" id="current-user-name">Vraj<\/span>/g,
    '<span class="topbar-username" id="topbar-user-name">Vraj</span>'
);

// Update dropdown header to use the actual role
html = html.replace(
    /<div class="dropdown-header">Signed In As Employee<\/div>/g,
    '<div class="dropdown-header">Signed In As <span id="topbar-user-role">Employee</span></div>'
);

fs.writeFileSync('index.html', html);
console.log("Updated index.html");

// 2. Update auth/guard.js
let guard = fs.readFileSync('auth/guard.js', 'utf8');

const oldDomUpdate = `          const nameEl    = document.getElementById("current-user-name");
          const roleEl    = document.getElementById("current-user-role");
          const avatarEl  = document.getElementById("current-user-avatar");
          const greetEl   = document.getElementById("dashboard-greeting");

          if (nameEl)   nameEl.textContent   = displayName;
          if (roleEl)   roleEl.textContent   = role;
          if (avatarEl) avatarEl.textContent = initials;
          if (greetEl)  greetEl.textContent  = \`\${timeGreeting}, \${displayName.split(" ")[0]}! 👋\`;`;

const newDomUpdate = `          const nameEl    = document.getElementById("current-user-name");
          const topbarNameEl = document.getElementById("topbar-user-name");
          const roleEl    = document.getElementById("current-user-role");
          const topbarRoleEl = document.getElementById("topbar-user-role");
          const avatarEl  = document.getElementById("current-user-avatar");
          const topbarAvatarEl = document.getElementById("topbar-user-avatar");
          const greetEl   = document.getElementById("dashboard-greeting");

          if (nameEl)   nameEl.textContent   = displayName;
          if (topbarNameEl) topbarNameEl.textContent = displayName;
          if (roleEl)   roleEl.textContent   = role;
          if (topbarRoleEl) topbarRoleEl.textContent = role;
          if (avatarEl) avatarEl.textContent = initials;
          if (topbarAvatarEl) topbarAvatarEl.textContent = initials;
          if (greetEl)  greetEl.textContent  = \`\${timeGreeting}, \${displayName.split(" ")[0]}! 👋\`;`;

if (guard.includes(oldDomUpdate)) {
    guard = guard.replace(oldDomUpdate, newDomUpdate);
    fs.writeFileSync('auth/guard.js', guard);
    console.log("Updated guard.js");
} else {
    // try with CRLF
    const oldDomUpdateCRLF = oldDomUpdate.replace(/\n/g, '\r\n');
    const newDomUpdateCRLF = newDomUpdate.replace(/\n/g, '\r\n');
    if (guard.includes(oldDomUpdateCRLF)) {
        guard = guard.replace(oldDomUpdateCRLF, newDomUpdateCRLF);
        fs.writeFileSync('auth/guard.js', guard);
        console.log("Updated guard.js (CRLF)");
    } else {
        console.log("Could not find DOM update block in guard.js");
    }
}

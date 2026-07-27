const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Regex to capture:
// 1. The anchor tag opening and the entire SVG block
// 2. The loose text (trimming whitespace)
// 3. The closing </a> OR the <span class="nav-badge"
const regex = /(<a class="nav-item[^>]*>[\s\S]*?<svg[^>]*>[\s\S]*?<\/svg>)\s+([A-Za-z\s]+?)\s+(<\/a>|<span class="nav-badge")/g;

html = html.replace(regex, '$1\n            <span>$2</span>\n            $3');

// Also update the sidebar toggle button from "toggleSidebar()" to actually toggle the .collapsed class on sidebar and adjust main layout.
// In app.js, toggleSidebar might already be doing it. Let's check it.
fs.writeFileSync('index.html', html);
console.log("Updated nav-items with <span> wrapper in index.html");

const fs = require('fs');

// 1. Update index.html Memberships header
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/<div><h1>Memberships<\/h1><p class="page-subtitle">Manage membership plans and pricing<\/p><\/div>/g, 
  `<div><h1>Membership Plans</h1><p class="page-subtitle">Create and manage the plans students subscribe to.</p></div>`);

fs.writeFileSync('index.html', html);
console.log('index.html updated for Memberships header.');

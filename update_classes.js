const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/class="seat /g, 'class="seat-card ');
fs.writeFileSync('index.html', html);
console.log('Classes replaced successfully.');

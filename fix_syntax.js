const fs = require('fs');

let code = fs.readFileSync('services/seatMapUI.js', 'utf8');

// The file was written with literal backslashes escaping template literals and variables.
// E.g., \` instead of `, \${ instead of ${, \\n instead of \n
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\${/g, '${');
code = code.replace(/\\\\n/g, '\\n');

fs.writeFileSync('services/seatMapUI.js', code);
console.log('Fixed syntax errors in seatMapUI.js');

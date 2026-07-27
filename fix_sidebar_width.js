const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

// Fix sidebar collapsed min-width
if (css.includes('.sidebar.collapsed { width: 60px; }')) {
    css = css.replace('.sidebar.collapsed { width: 60px; }', '.sidebar.collapsed { width: 60px; min-width: 60px; }');
    fs.writeFileSync('style.css', css);
    console.log("Updated style.css to fix collapsed sidebar min-width");
} else {
    console.log("Could not find '.sidebar.collapsed { width: 60px; }' in style.css");
}

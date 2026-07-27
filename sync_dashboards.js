const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');
// Update the paths to be relative for one folder deep
index = index.replace('href="style.css"', 'href="../style.css"');
index = index.replace('src="app.js"', 'src="../app.js"');
index = index.replace('src="firebase-entry.js"', 'src="../firebase-entry.js"');

const dirs = ['admin', 'manager', 'employee', 'student'];
dirs.forEach(dir => {
    fs.writeFileSync(`${dir}/dashboard.html`, index);
});
console.log('Dashboards synced!');

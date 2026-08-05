const fs = require('fs');

function updateFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace text inside elements while maintaining logic
  // e.g., >Ground Floor< -> >${window.t ? window.t('floor.ground') : 'Ground Floor'}<
  content = content.replace(/>Ground Floor</g, `>\${window.t ? window.t('floor.ground') : 'Ground Floor'}<`);
  content = content.replace(/>First Floor</g, `>\${window.t ? window.t('floor.first') : 'First Floor'}<`);
  content = content.replace(/>Second Floor</g, `>\${window.t ? window.t('floor.second') : 'Second Floor'}<`);

  // Instead of replacing "Available" string literals in JS code (which breaks logic), 
  // only replace them inside HTML tags. Wait, >Available< is inside HTML.
  content = content.replace(/>Available</g, `>\${window.t ? window.t('status.available') : 'Available'}<`);
  content = content.replace(/>Occupied</g, `>\${window.t ? window.t('status.occupied') : 'Occupied'}<`);
  content = content.replace(/>Reserved</g, `>\${window.t ? window.t('status.reserved') : 'Reserved'}<`);
  content = content.replace(/>Maintenance</g, `>\${window.t ? window.t('status.maintenance') : 'Maintenance'}<`);

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated UI translation for ${file}`);
}

updateFile('services/seatMapUI.js');
updateFile('services/liveSeatMapUI.js');

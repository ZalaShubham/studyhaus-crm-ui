const fs = require('fs');

function updateFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Hardcoded UI replacements for Seat Maps
  content = content.replace(/>Available</g, `>\${window.t('status.available')}<`);
  content = content.replace(/>Occupied</g, `>\${window.t('status.occupied')}<`);
  content = content.replace(/>Reserved</g, `>\${window.t('status.reserved')}<`);
  content = content.replace(/>Maintenance</g, `>\${window.t('status.maintenance')}<`);
  
  content = content.replace(/>Ground Floor</g, `>\${window.t('floor.ground')}<`);
  content = content.replace(/>First Floor</g, `>\${window.t('floor.first')}<`);
  content = content.replace(/>Second Floor</g, `>\${window.t('floor.second')}<`);
  
  content = content.replace(/"Available"/g, `window.t('status.available')`);
  content = content.replace(/"Occupied"/g, `window.t('status.occupied')`);
  content = content.replace(/"Reserved"/g, `window.t('status.reserved')`);
  content = content.replace(/"Maintenance"/g, `window.t('status.maintenance')`);
  
  content = content.replace(/'Available'/g, `window.t('status.available')`);
  content = content.replace(/'Occupied'/g, `window.t('status.occupied')`);
  content = content.replace(/'Reserved'/g, `window.t('status.reserved')`);
  content = content.replace(/'Maintenance'/g, `window.t('status.maintenance')`);

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated UI translation for ${file}`);
}

updateFile('services/seatMapUI.js');
updateFile('services/liveSeatMapUI.js');

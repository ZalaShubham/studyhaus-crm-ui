const fs = require('fs');
const files = ['manager/dashboard.html', 'employee/dashboard.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  
  if (c.includes('page-live-seat-map')) {
    console.log('Already updated:', file);
    return;
  }

  // Add page div after page-seats div
  if (c.includes('id="page-seats"')) {
    c = c.replace(
      '<div class="page" id="page-seats"></div>',
      '<div class="page" id="page-seats"></div>\n\n        <!-- Live Seat Map Page -->\n        <div class="page" id="page-live-seat-map"></div>'
    );
    console.log('Added page div to:', file);
  }

  // Add nav link — find the Seat Map nav item and add Live Seat Map after it
  const seatNavRegex = /(<a class="nav-item" data-page="seats"[^>]*>[\s\S]*?<\/a>)/;
  if (seatNavRegex.test(c)) {
    const liveSeatNavLink = `
          <a class="nav-item" data-page="live-seat-map" onclick="navigate('live-seat-map')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            <span data-i18n="menu.liveSeatMap">Live Seat Map</span>
            </a>`;
    c = c.replace(seatNavRegex, (match) => match + liveSeatNavLink);
    console.log('Added nav link to:', file);
  }

  fs.writeFileSync(file, c);
  console.log('Saved:', file);
});

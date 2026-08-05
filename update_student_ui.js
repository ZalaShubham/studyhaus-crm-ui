const fs = require('fs');
let content = fs.readFileSync('services/studentPortalUI.js', 'utf8');

// Replace dynamic strings that lack data-i18n attributes with data-i18n
// Welcome back
content = content.replace(/<h1>\$\{window\.t \? window\.t\('studentPortal\.welcome', \{name: s\.name\}\) : 'Welcome back, ' \+ s\.name\}<\/h1>/g, 
  '<h1 data-i18n="studentPortal.welcome" data-i18n-args=\'{"name":"${s.name}"}\'>${window.t ? window.t(\\'studentPortal.welcome\\', {name: s.name}) : \\'Welcome back, \\' + s.name}</h1>');

// For metric values:
content = content.replace(/<div class="metric-value" style="font-size: 1\.1rem;">\$\{s\.planName \|\| window\.t \? window\.t\('studentPortal\.none'\) : 'None'\}<\/div>/g, 
  '<div class="metric-value" style="font-size: 1.1rem;"><span data-i18n="studentPortal.none" style="display:${s.planName ? \\'none\\' : \\'inline\\'}">None</span><span style="display:${s.planName ? \\'inline\\' : \\'none\\'}">${s.planName || \\'\\'}</span></div>');

content = content.replace(/<div class="metric-value">\$\{s\.seatNumber \|\| window\.t \? window\.t\('studentPortal\.unassigned'\) : 'Unassigned'\}<\/div>/g, 
  '<div class="metric-value"><span data-i18n="studentPortal.unassigned" style="display:${s.seatNumber ? \\'none\\' : \\'inline\\'}">Unassigned</span><span style="display:${s.seatNumber ? \\'inline\\' : \\'none\\'}">${s.seatNumber || \\'\\'}</span></div>');

content = content.replace(/<div class="metric-value">\$\{s\.status \|\| window\.t \? window\.t\('studentPortal\.pending'\) : 'Pending'\}<\/div>/g, 
  '<div class="metric-value"><span data-i18n="studentPortal.pending" style="display:${s.status ? \\'none\\' : \\'inline\\'}">Pending</span><span style="display:${s.status ? \\'inline\\' : \\'none\\'}">${s.status || \\'\\'}</span></div>');

// Days Remaining
content = content.replace(/<div class="metric-value" style="color: \$\{daysRemaining < 5 \? 'var\(--danger\)' : 'inherit'\}">\$\{daysRemaining\} \$\{window\.t \? window\.t\('studentPortal\.days'\) : 'Days'\}<\/div>/g, 
  '<div class="metric-value" style="color: ${daysRemaining < 5 ? \\'var(--danger)\\' : \\'inherit\\'}">${daysRemaining} <span data-i18n="studentPortal.days">Days</span></div>');

// Due date label (Due:)
content = content.replace(/<div style="font-size: 0\.75rem; color: var\(--text-muted\); margin-top: 2px;">\$\{window\.t \? window\.t\('studentPortal\.due'\) : 'Due:'\} \$\{s\.paymentDueDate \|\| 'N\/A'\}<\/div>/g, 
  '<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;"><span data-i18n="studentPortal.due">Due:</span> ${s.paymentDueDate || \\'N/A\\'}</div>');

fs.writeFileSync('services/studentPortalUI.js', content);
console.log('Fixed studentPortalUI.js data-i18n tags');

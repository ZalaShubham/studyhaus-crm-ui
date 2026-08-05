const fs = require('fs');
let file = 'services/studentPortalUI.js';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');

  // Hardcoded UI replacements for Student Portal Dashboard

  content = content.replace(/Welcome back, ([\$\{\}s\.nameA-Za-z]+)/, `\${window.t ? window.t('studentPortal.welcome', {name: $1}) : 'Welcome back, ' + $1}`);
  
  content = content.replace(/<span class="btn-text">Check-in Now<\/span>/, `<span class="btn-text" data-i18n="studentPortal.checkInBtn">\${window.t ? window.t('studentPortal.checkInBtn') : 'Check-in Now'}</span>`);
  
  content = content.replace(/<span class="btn-text">Check-out Now<\/span>/, `<span class="btn-text" data-i18n="studentPortal.checkOutBtn">\${window.t ? window.t('studentPortal.checkOutBtn') : 'Check-out Now'}</span>`);

  content = content.replace(/<div class="metric-label">Membership Plan<\/div>/, `<div class="metric-label" data-i18n="studentPortal.plan">\${window.t ? window.t('studentPortal.plan') : 'Membership Plan'}</div>`);
  content = content.replace(/'None'/, `window.t ? window.t('studentPortal.none') : 'None'`);

  content = content.replace(/<div class="metric-label">Seat Number<\/div>/, `<div class="metric-label" data-i18n="studentPortal.seatNum">\${window.t ? window.t('studentPortal.seatNum') : 'Seat Number'}</div>`);
  content = content.replace(/'Unassigned'/, `window.t ? window.t('studentPortal.unassigned') : 'Unassigned'`);

  content = content.replace(/<div class="metric-label">Status<\/div>/, `<div class="metric-label" data-i18n="studentPortal.status">\${window.t ? window.t('studentPortal.status') : 'Status'}</div>`);
  content = content.replace(/'Pending'/, `window.t ? window.t('studentPortal.pending') : 'Pending'`);

  content = content.replace(/<div class="metric-label">Days Remaining<\/div>/, `<div class="metric-label" data-i18n="studentPortal.daysRem">\${window.t ? window.t('studentPortal.daysRem') : 'Days Remaining'}</div>`);
  content = content.replace(/\$\{daysRemaining\} Days/, `\${daysRemaining} \${window.t ? window.t('studentPortal.days') : 'Days'}`);
  content = content.replace(/Due:/, `\${window.t ? window.t('studentPortal.due') : 'Due:'}`);

  content = content.replace(/<h3 style="margin-bottom: 1rem;">Quick Links<\/h3>/, `<h3 style="margin-bottom: 1rem;" data-i18n="studentPortal.quickLinks">\${window.t ? window.t('studentPortal.quickLinks') : 'Quick Links'}</h3>`);

  content = content.replace(/<h4 style="margin: 0;">Payments & Renewals<\/h4>/, `<h4 style="margin: 0;" data-i18n="studentPortal.paymentsTitle">\${window.t ? window.t('studentPortal.paymentsTitle') : 'Payments & Renewals'}</h4>`);
  content = content.replace(/Submit payments and view history/, `\${window.t ? window.t('studentPortal.paymentsDesc') : 'Submit payments and view history'}`);

  content = content.replace(/<h4 style="margin: 0;">Attendance<\/h4>/, `<h4 style="margin: 0;" data-i18n="studentPortal.attendanceTitle">\${window.t ? window.t('studentPortal.attendanceTitle') : 'Attendance'}</h4>`);
  content = content.replace(/View check-ins and hours/, `\${window.t ? window.t('studentPortal.attendanceDesc') : 'View check-ins and hours'}`);

  content = content.replace(/<h4 style="margin: 0;">Complaints<\/h4>/, `<h4 style="margin: 0;" data-i18n="studentPortal.complaintsTitle">\${window.t ? window.t('studentPortal.complaintsTitle') : 'Complaints'}</h4>`);
  content = content.replace(/Report issues and track status/, `\${window.t ? window.t('studentPortal.complaintsDesc') : 'Report issues and track status'}`);

  content = content.replace(/<h4 style="margin: 0;">My Profile<\/h4>/, `<h4 style="margin: 0;" data-i18n="studentPortal.profileTitle">\${window.t ? window.t('studentPortal.profileTitle') : 'My Profile'}</h4>`);
  content = content.replace(/Update personal information/, `\${window.t ? window.t('studentPortal.profileDesc') : 'Update personal information'}`);


  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
}

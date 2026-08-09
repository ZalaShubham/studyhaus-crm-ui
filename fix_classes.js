const fs = require('fs');
const files = [
  'student/dashboard.html',
  'services/paymentAdminUI.js',
  'services/expenseAdminUI.js',
  'index.html',
  'manager/dashboard.html',
  'employee/dashboard.html',
  'admin/dashboard.html'
];
for(let f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/class="card" class="card-theme"/g, 'class="card card-theme"');
  fs.writeFileSync(f, content);
  console.log('Fixed '+f);
}

const fs = require('fs');

const files = [
  'admin/dashboard.html',
  'employee/dashboard.html',
  'manager/dashboard.html',
  'student/dashboard.html',
  'index.html'
];

for(let f of files) {
  if(!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');
  
  // 1. Full name
  // from: data-i18n="form.studentName">Full name </label>
  // to:   data-i18n="form.studentName">Full name *</label>
  // or if already has *, skip.
  content = content.replace(/data-i18n="form\.studentName">Full name( \*)? <\/label>/g, 'data-i18n="form.studentName">Full name *</label>');
  // Also check if there's without space
  content = content.replace(/data-i18n="form\.studentName">Full name<\/label>/g, 'data-i18n="form.studentName">Full name *</label>');

  // 2. Date of birth
  // from: Date of birth</label>
  // to:   Date of birth *</label>
  content = content.replace(/Date of birth( \*)?<\/label>/g, 'Date of birth *</label>');
  // Add required to input
  content = content.replace(/id="adm-dob" style/g, 'id="adm-dob" required style');

  // 3. Gender
  // from: data-i18n="form.gender">Gender </label>
  // to:   data-i18n="form.gender">Gender *</label>
  content = content.replace(/data-i18n="form\.gender">Gender( \*)? <\/label>/g, 'data-i18n="form.gender">Gender *</label>');
  content = content.replace(/data-i18n="form\.gender">Gender<\/label>/g, 'data-i18n="form.gender">Gender *</label>');
  
  // Ensure required is on gender (it usually is)
  
  fs.writeFileSync(f, content);
  console.log('Fixed mandatory fields in ' + f);
}

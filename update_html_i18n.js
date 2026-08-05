const fs = require('fs');
const htmlFiles = ['student-register.html', 'index.html', 'admin/dashboard.html', 'manager/dashboard.html', 'employee/dashboard.html'];

const replacements = [
  { regex: />Student Name</g, replace: ' data-i18n="form.studentName">Student Name<' },
  { regex: />Father Name</g, replace: ' data-i18n="form.fatherName">Father Name<' },
  { regex: />Mother Name</g, replace: ' data-i18n="form.motherName">Mother Name<' },
  { regex: />Phone</g, replace: ' data-i18n="form.phone">Phone<' },
  { regex: />Email</g, replace: ' data-i18n="form.email">Email<' },
  { regex: />Address</g, replace: ' data-i18n="form.address">Address<' },
  { regex: />Gender</g, replace: ' data-i18n="form.gender">Gender<' },
  { regex: />Date of Birth</g, replace: ' data-i18n="form.dob">Date of Birth<' },
  { regex: />Emergency Contact</g, replace: ' data-i18n="form.emergencyContact">Emergency Contact<' },
  { regex: />Membership</g, replace: ' data-i18n="form.membership">Membership<' },
  { regex: />Documents</g, replace: ' data-i18n="form.documents">Documents<' },
  
  // Placeholders
  { regex: /placeholder="Search students/g, replace: 'data-i18n="search.students" placeholder="Search students' },
  { regex: /placeholder="Search seats/g, replace: 'data-i18n="search.seats" placeholder="Search seats' },
  { regex: /placeholder="Search receipts/g, replace: 'data-i18n="search.receipts" placeholder="Search receipts' }
];

for (const file of htmlFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const r of replacements) {
       content = content.replace(r.regex, r.replace);
    }
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}

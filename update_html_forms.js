const fs = require('fs');
const htmlFiles = ['student-register.html', 'index.html', 'admin/dashboard.html', 'manager/dashboard.html', 'employee/dashboard.html', 'student/dashboard.html'];

const replacements = [
  // Forms
  { regex: />Full name \*?</g, replace: ` data-i18n="form.studentName">Full name <` },
  { regex: />Email address \*?</g, replace: ` data-i18n="form.email">Email address <` },
  { regex: />Phone number \*?</g, replace: ` data-i18n="form.phone">Phone number <` },
  { regex: />Password \*?</g, replace: ` data-i18n="form.password">Password <` },
  { regex: />Date of birth \*?</g, replace: ` data-i18n="form.dob">Date of birth <` },
  { regex: />Residential address \*?</g, replace: ` data-i18n="form.address">Residential address <` },
  { regex: />Gender \*?</g, replace: ` data-i18n="form.gender">Gender <` },
  { regex: />Father's Name/g, replace: ` data-i18n="form.fatherName">Father's Name<` },
  { regex: />Mother's Name/g, replace: ` data-i18n="form.motherName">Mother's Name<` },
  { regex: />Emergency Contact \(Phone\)/g, replace: ` data-i18n="form.emergencyContact">Emergency Contact (Phone)<` },
  
  // Actions
  { regex: />Create account</g, replace: ` data-i18n="btn.register">Create account<` },
  { regex: />Sign in</g, replace: ` data-i18n="btn.login">Sign in<` },
  { regex: />Cancel</g, replace: ` data-i18n="btn.cancel">Cancel<` },
  
  // Modals & Titles
  { regex: />Add New Student</g, replace: ` data-i18n="student.add">Add New Student<` },
  { regex: />Upload Document</g, replace: ` data-i18n="doc.upload">Upload Document<` }
];

for (const file of htmlFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const r of replacements) {
      content = content.replace(r.regex, (match) => {
         return r.replace;
      });
    }
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}

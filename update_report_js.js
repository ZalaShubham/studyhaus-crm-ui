const fs = require('fs');
const file = 'services/reportAdminUI.js';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  { regex: /"Dashboard Summary Report"/g, replace: 'window.t ? window.t("report.dashboardTitle") : "Dashboard Summary Report"' },
  { regex: /"Student Analytics Report"/g, replace: 'window.t ? window.t("report.studentTitle") : "Student Analytics Report"' },
  { regex: /"Attendance Trend Report"/g, replace: 'window.t ? window.t("report.attendanceTitle") : "Attendance Trend Report"' },
  { regex: /"Revenue & Collections Report"/g, replace: 'window.t ? window.t("report.paymentTitle") : "Revenue & Collections Report"' },
  { regex: /"Expense Analysis Report"/g, replace: 'window.t ? window.t("report.expenseTitle") : "Expense Analysis Report"' },
  { regex: /"Complaint Resolution Report"/g, replace: 'window.t ? window.t("report.complaintTitle") : "Complaint Resolution Report"' },
  { regex: /"Visitor Analytics Report"/g, replace: 'window.t ? window.t("report.visitorTitle") : "Visitor Analytics Report"' },
  { regex: /"Membership Renewal Report"/g, replace: 'window.t ? window.t("report.renewalTitle") : "Membership Renewal Report"' },
  { regex: /"Seat Occupancy Report"/g, replace: 'window.t ? window.t("report.seatTitle") : "Seat Occupancy Report"' }
];

for (const r of replacements) {
  content = content.replace(r.regex, r.replace);
}

fs.writeFileSync(file, content);

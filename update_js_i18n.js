const fs = require('fs');
const path = require('path');

const servicesDir = 'services';
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));

const replacements = [
  // Table headers
  { regex: /<th>Name<\/th>/g, replace: '<th data-i18n="table.name">\\${window.t ? window.t("table.name") : "Name"}</th>' },
  { regex: /<th>Seat<\/th>/g, replace: '<th data-i18n="table.seat">\\${window.t ? window.t("table.seat") : "Seat"}</th>' },
  { regex: /<th>Status<\/th>/g, replace: '<th data-i18n="table.status">\\${window.t ? window.t("table.status") : "Status"}</th>' },
  { regex: /<th>Payment<\/th>/g, replace: '<th data-i18n="table.payment">\\${window.t ? window.t("table.payment") : "Payment"}</th>' },
  { regex: /<th>Date<\/th>/g, replace: '<th data-i18n="table.date">\\${window.t ? window.t("table.date") : "Date"}</th>' },
  { regex: /<th>Amount<\/th>/g, replace: '<th data-i18n="table.amount">\\${window.t ? window.t("table.amount") : "Amount"}</th>' },
  { regex: /<th>Phone<\/th>/g, replace: '<th data-i18n="table.phone">\\${window.t ? window.t("table.phone") : "Phone"}</th>' },
  { regex: /<th>Membership<\/th>/g, replace: '<th data-i18n="table.membership">\\${window.t ? window.t("table.membership") : "Membership"}</th>' },
  { regex: /<th>Action<\/th>/g, replace: '<th data-i18n="table.action">\\${window.t ? window.t("table.action") : "Action"}</th>' },
  
  // Empty states
  { regex: /No Students Found/g, replace: '${window.t ? window.t("empty.students") : "No Students Found"}' },
  { regex: /No Attendance Available/g, replace: '${window.t ? window.t("empty.attendance") : "No Attendance Available"}' },
  { regex: /No Payments Found/g, replace: '${window.t ? window.t("empty.payments") : "No Payments Found"}' },
  { regex: /No Reports Available/g, replace: '${window.t ? window.t("empty.reports") : "No Reports Available"}' },

  // Buttons
  { regex: />Edit</g, replace: ' data-i18n="btn.edit">${window.t ? window.t("btn.edit") : "Edit"}<' },
  { regex: />Save</g, replace: ' data-i18n="btn.save">${window.t ? window.t("btn.save") : "Save"}<' },
  { regex: />Update</g, replace: ' data-i18n="btn.update">${window.t ? window.t("btn.update") : "Update"}<' },
  { regex: />Delete</g, replace: ' data-i18n="btn.delete">${window.t ? window.t("btn.delete") : "Delete"}<' }
];

for (const file of files) {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const r of replacements) {
    if (content.match(r.regex)) {
      // Safety check: if it already contains window.t("table.name"), don't replace
      if (!content.includes(r.replace)) {
        content = content.replace(r.regex, r.replace);
        modified = true;
      }
    }
  }
  
  // Replace window.showToast calls globally using a callback to safely stringify
  const toastRegex = /window\.showToast\(\"([^\"]+)\"/g;
  content = content.replace(toastRegex, (match, msg) => {
    // Escape single quotes in the message
    const escapedMsg = msg.replace(/'/g, "\\'");
    return `window.showToast(window.t ? window.t('${escapedMsg}') || "${msg}" : "${msg}"`;
  });
  
  if (modified || content.match(toastRegex)) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}

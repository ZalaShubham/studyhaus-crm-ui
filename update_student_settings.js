const fs = require('fs');
const htmlFiles = ['admin/dashboard.html', 'manager/dashboard.html', 'employee/dashboard.html', 'student/dashboard.html', 'index.html'];

const replacements = [
  // Student specific menu
  { regex: /<span>Payments & Renewals<\/span>/g, replace: '<span data-i18n="menu.paymentsRenewals">Payments & Renewals</span>' },
  
  // Settings page texts
  { regex: /Configure your reading space/g, replace: '<span data-i18n="settings.configureReadingSpace">Configure your reading space</span>' },
  { regex: /Reading Space Info/g, replace: '<span data-i18n="settings.readingSpaceInfo">Reading Space Info</span>' },
  { regex: /Space Name/g, replace: '<span data-i18n="settings.spaceName">Space Name</span>' },
  { regex: /GST Number/g, replace: '<span data-i18n="settings.gstNumber">GST Number</span>' },
  { regex: /Opening Time/g, replace: '<span data-i18n="settings.openingTime">Opening Time</span>' },
  { regex: /Closing Time/g, replace: '<span data-i18n="settings.closingTime">Closing Time</span>' },
  { regex: /Preferences/g, replace: '<span data-i18n="settings.preferences">Preferences</span>' },
  { regex: /Send SMS on payment/g, replace: '<span data-i18n="settings.sendSMS">Send SMS on payment</span>' },
  { regex: /Auto-send SMS receipt after each payment/g, replace: '<span data-i18n="settings.sendSMSDesc">Auto-send SMS receipt after each payment</span>' },
  { regex: /Renewal reminders/g, replace: '<span data-i18n="settings.renewalReminders">Renewal reminders</span>' },
  { regex: /Alert students 3 days before plan expiry/g, replace: '<span data-i18n="settings.renewalRemindersDesc">Alert students 3 days before plan expiry</span>' },
  { regex: /Attendance notifications/g, replace: '<span data-i18n="settings.attendanceNotifications">Attendance notifications</span>' },
  { regex: /Notify admin if student absent 3\+ days/g, replace: '<span data-i18n="settings.attendanceNotificationsDesc">Notify admin if student absent 3+ days</span>' },
  { regex: /Visitor log/g, replace: '<span data-i18n="settings.visitorLog">Visitor log</span>' },
  { regex: /Require visitor log for every entry/g, replace: '<span data-i18n="settings.visitorLogDesc">Require visitor log for every entry</span>' },
  { regex: /System Language/g, replace: '<span data-i18n="settings.systemLanguage">System Language</span>' }
];

for (const file of htmlFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We only want to replace plain text, but some of these might be inside labels already.
    // So let's be more specific for labels:
    content = content.replace(/<label>Space Name<\/label>/g, '<label data-i18n="settings.spaceName">Space Name</label>');
    content = content.replace(/<label>Address<\/label>/g, '<label data-i18n="settings.address">Address</label>');
    content = content.replace(/<label>Phone<\/label>/g, '<label data-i18n="settings.phone">Phone</label>');
    content = content.replace(/<label>Email<\/label>/g, '<label data-i18n="settings.email">Email</label>');
    content = content.replace(/<label>GST Number<\/label>/g, '<label data-i18n="settings.gstNumber">GST Number</label>');
    content = content.replace(/<label>Opening Time<\/label>/g, '<label data-i18n="settings.openingTime">Opening Time</label>');
    content = content.replace(/<label>Closing Time<\/label>/g, '<label data-i18n="settings.closingTime">Closing Time</label>');
    
    // Some are titles / descriptions
    content = content.replace(/>Configure your reading space<\/p>/g, ' data-i18n="settings.configureReadingSpace">Configure your reading space</p>');
    content = content.replace(/>Reading Space Info<\/h3>/g, ' data-i18n="settings.readingSpaceInfo">Reading Space Info</h3>');
    content = content.replace(/>Preferences<\/h3>/g, ' data-i18n="settings.preferences">Preferences</h3>');
    content = content.replace(/>Send SMS on payment<\/div>/g, ' data-i18n="settings.sendSMS">Send SMS on payment</div>');
    content = content.replace(/>Auto-send SMS receipt after each payment<\/div>/g, ' data-i18n="settings.sendSMSDesc">Auto-send SMS receipt after each payment</div>');
    content = content.replace(/>Renewal reminders<\/div>/g, ' data-i18n="settings.renewalReminders">Renewal reminders</div>');
    content = content.replace(/>Alert students 3 days before plan expiry<\/div>/g, ' data-i18n="settings.renewalRemindersDesc">Alert students 3 days before plan expiry</div>');
    content = content.replace(/>Attendance notifications<\/div>/g, ' data-i18n="settings.attendanceNotifications">Attendance notifications</div>');
    content = content.replace(/>Notify admin if student absent 3\+ days<\/div>/g, ' data-i18n="settings.attendanceNotificationsDesc">Notify admin if student absent 3+ days</div>');
    content = content.replace(/>Visitor log<\/div>/g, ' data-i18n="settings.visitorLog">Visitor log</div>');
    content = content.replace(/>Require visitor log for every entry<\/div>/g, ' data-i18n="settings.visitorLogDesc">Require visitor log for every entry</div>');
    
    // Fix existing System Language labels if they don't have the tag (but earlier grep showed they do, however some might not)
    // Wait, earlier grep showed <label data-i18n="settings.systemLanguage">System Language</label>. That's correct.
    
    // The student sidebar
    content = content.replace(/<span>Payments &amp; Renewals<\/span>/g, '<span data-i18n="menu.paymentsRenewals">Payments & Renewals</span>');
    content = content.replace(/<span>Payments & Renewals<\/span>/g, '<span data-i18n="menu.paymentsRenewals">Payments & Renewals</span>');

    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}

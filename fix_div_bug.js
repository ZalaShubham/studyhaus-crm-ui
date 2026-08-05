const fs = require('fs');
const files = [
  'e:/INTERNSHIP-JUNTOAUG2026/clone/admin/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/manager/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/employee/dashboard.html',
  'e:/INTERNSHIP-JUNTOAUG2026/clone/index.html'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // The specific bug we want to fix is replacing:
    //             </div>
    //           </div>
    //         </div></div>
    //         <!-- Memberships Page -->
    // With:
    //             </div>
    //           </div>
    //         </div>
    //         <!-- Memberships Page -->
    
    // Replace all instances of `</div></div>\n        <!-- Memberships Page -->`
    // (and similar variants if they exist, to fix the layout nesting)
    content = content.replace(/<\/div><\/div>\s*<!-- Memberships Page -->/g, '</div>\n        <!-- Memberships Page -->');
    content = content.replace(/<\/div><\/div>\s*<!-- Expenses Page -->/g, '</div>\n        <!-- Expenses Page -->');
    content = content.replace(/<\/div><\/div>\s*<!-- Visitors Page -->/g, '</div>\n        <!-- Visitors Page -->');
    
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
  }
});

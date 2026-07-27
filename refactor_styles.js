const fs = require('fs');

function refactorHTML(html) {
    // Buttons
    html = html.replace(/background:#1e3a8a;/g, 'background:var(--primary);');
    
    // Cards
    html = html.replace(/style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:flex-start; box-shadow:0 4px 6px -1px rgba\(0,0,0,0.02\);"/g, 'class="card-theme" style="padding:1.5rem; display:flex; justify-content:space-between; align-items:flex-start;"');
    html = html.replace(/style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgba\(0,0,0,0.02\);"/g, 'class="card-theme" style="padding:1.5rem;"');
    html = html.replace(/style="padding:1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; align-items:center; gap:2rem; box-shadow:0 4px 6px -1px rgba\(0,0,0,0.02\);"/g, 'class="card-theme" style="padding:1.5rem; display:flex; align-items:center; gap:2rem;"');

    // Text colors
    html = html.replace(/color:#0f172a/g, 'color:var(--text-primary)');
    html = html.replace(/color:#64748b/g, 'color:var(--text-muted)');
    html = html.replace(/color:#94a3b8/g, 'color:var(--text-muted)');
    html = html.replace(/color:#475569/g, 'color:var(--text-secondary)');
    
    // Borders
    html = html.replace(/border-bottom:1px solid #e2e8f0/g, 'border-bottom:1px solid var(--border)');
    html = html.replace(/border-top:1px solid #e2e8f0/g, 'border-top:1px solid var(--border)');
    html = html.replace(/border-bottom:1px solid #f1f5f9/g, 'border-bottom:1px solid var(--border)');
    html = html.replace(/border:1px solid #e2e8f0/g, 'border:1px solid var(--border)');

    // Backgrounds
    html = html.replace(/background:#f1f5f9/g, 'background:var(--bg-gray)');
    html = html.replace(/background:#fff/g, 'background:var(--bg-card)');
    html = html.replace(/background: #0284c7/g, 'background: var(--primary)');
    html = html.replace(/color: #1e3a8a/g, 'color: var(--text-primary)');

    // Topbar specific
    html = html.replace(/<div class="topbar-avatar" style="background:#0f172a; color:#fff;">V<\/div>/g, '<div class="topbar-avatar" style="background:var(--primary); color:#fff;">V</div>');

    return html;
}

const files = [
    'index.html',
    'services/paymentAdminUI.js',
    'services/expenseAdminUI.js'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = refactorHTML(content);
    fs.writeFileSync(file, content);
    console.log(`Refactored ${file}`);
});

const fs = require('fs');
const glob = require('node:child_process').execSync('dir /s /b *.html *.js').toString().split('\r\n').filter(f => f && !f.includes('node_modules'));

for (let file of glob) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace hardcoded backgrounds and colors in select inline styles
    content = content.replace(/<select([^>]+)style=\"([^\"]+)\"/g, (match, p1, p2) => {
        let newStyle = p2
            .replace(/background:\s*#fff;?/, 'background: var(--bg-card);')
            .replace(/color:\s*#64748b;?/, 'color: var(--text-primary);')
            .replace(/border:\s*1px solid #e2e8f0;?/, 'border: 1px solid var(--border);')
            .replace(/color:\s*#0f172a;?/, 'color: var(--text-primary);');
        return '<select' + p1 + 'style=\"' + newStyle + '\"';
    });
    
    // Replace label colors
    content = content.replace(/<label([^>]+)style=\"([^\"]+)\"/g, (match, p1, p2) => {
        let newStyle = p2.replace(/color:\s*#0f172a;?/, 'color: var(--text-primary);');
        return '<label' + p1 + 'style=\"' + newStyle + '\"';
    });

    // Replace input styles
    content = content.replace(/<input([^>]+)style=\"([^\"]+)\"/g, (match, p1, p2) => {
         let newStyle = p2
            .replace(/background:\s*#fff;?/, 'background: var(--bg-card);')
            .replace(/color:\s*#64748b;?/, 'color: var(--text-primary);')
            .replace(/border:\s*1px solid #e2e8f0;?/, 'border: 1px solid var(--border);')
            .replace(/color:\s*#0f172a;?/, 'color: var(--text-primary);');
        return '<input' + p1 + 'style=\"' + newStyle + '\"';
    });
    
    // Replace textarea styles
    content = content.replace(/<textarea([^>]+)style=\"([^\"]+)\"/g, (match, p1, p2) => {
         let newStyle = p2
            .replace(/background:\s*#fff;?/, 'background: var(--bg-card);')
            .replace(/color:\s*#64748b;?/, 'color: var(--text-primary);')
            .replace(/border:\s*1px solid #e2e8f0;?/, 'border: 1px solid var(--border);')
            .replace(/color:\s*#0f172a;?/, 'color: var(--text-primary);');
        return '<textarea' + p1 + 'style=\"' + newStyle + '\"';
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
}

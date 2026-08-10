const fs = require('fs');
const glob = require('node:child_process').execSync('dir /s /b *.html *.js').toString().split('\r\n').filter(f => f && !f.includes('node_modules'));

for (let file of glob) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace hardcoded #f8fafc in select, input, textarea inline styles
    content = content.replace(/<(select|input|textarea)([^>]+)style=\"([^\"]+)\"/g, (match, tag, p1, p2) => {
        let newStyle = p2.replace(/background:\s*#f8fafc;?/, 'background: var(--bg-card);');
        return '<' + tag + p1 + 'style=\"' + newStyle + '\"';
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated inline #f8fafc in', file);
    }
}

const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

// Replace the existing :root and body.light-mode logic
const newRoot = `:root {
  --bg-base:       #020817;
  --bg-card:       #0f172a;
  --bg-hover:      #1e293b;
  --bg-gray:       #1e293b;
  --border:        #1e293b;
  --border-bright: #334155;
  --text-primary:  #f8fafc;
  --text-secondary:#cbd5e1;
  --text-muted:    #94a3b8;
  
  --primary:       #0ea5e9;
  --accent-emerald: #10b981;
  --accent-red:     #f43f5e;
  --accent-amber:   #f59e0b;
  --accent-blue:    #3b82f6;

  --sidebar-w: 240px;
}

body.light-mode {
  --bg-base:       #f8fafc;
  --bg-card:       #ffffff;
  --bg-hover:      #f1f5f9;
  --bg-gray:       #f1f5f9;
  --border:        #e2e8f0;
  --border-bright: #cbd5e1;
  --text-primary:  #0f172a;
  --text-secondary:#475569;
  --text-muted:    #94a3b8;
  
  --primary:       #1e3a8a;
}

/* Base utility classes for themes */
.card-theme {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}

.text-theme-primary { color: var(--text-primary); }
.text-theme-secondary { color: var(--text-secondary); }
.text-theme-muted { color: var(--text-muted); }
.border-theme { border-color: var(--border); }
.bg-theme-base { background: var(--bg-base); }
.bg-theme-gray { background: var(--bg-gray); }

/* Table styling for theme */
.table-theme {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
  color: var(--text-secondary);
}
.table-theme th {
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.table-theme td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

/* Badges */
.badge-active { background: rgba(16,185,129,0.1); color: var(--accent-emerald); border: 1px solid rgba(16,185,129,0.2); }
.badge-pending { background: rgba(245,158,11,0.1); color: var(--accent-amber); border: 1px solid rgba(245,158,11,0.2); }
.badge-info { background: rgba(59,130,246,0.1); color: var(--accent-blue); border: 1px solid rgba(59,130,246,0.2); }

/* Specific light mode overrides for old code if necessary */
`;

const rootRegex = /:root\s*\{[\s\S]*?\}[^{]*\/\*\s*={20}\s*LIGHT MODE\s*={20}\s*\*\/[\s\S]*?(?=body\s*\{)/;

if (rootRegex.test(css)) {
    css = css.replace(rootRegex, newRoot);
    fs.writeFileSync('style.css', css);
    console.log("Updated style.css successfully.");
} else {
    console.log("Could not find root block to replace.");
}

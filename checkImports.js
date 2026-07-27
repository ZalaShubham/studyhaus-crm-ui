const fs = require('fs');
const path = require('path');
const folder = 'e:/INTERNSHIP-JUNTOAUG2026/clone/services';
fs.readdirSync(folder).forEach(file => {
  if (!file.endsWith('.js')) return;
  const content = fs.readFileSync(path.join(folder, file), 'utf-8');
  const lines = content.split('\n');
  const imports = lines.filter(l => l.trim().startsWith('import '));
  imports.forEach(imp => {
    const match = imp.match(/from\s+[\"'](.+?)[\"']/);
    if (match) {
      const target = match[1];
      if (target.startsWith('.')) {
        const targetPath = path.join(folder, target);
        if (!fs.existsSync(targetPath)) {
          console.log('Missing import target:', target, 'in', file);
        } else {
            // Check if the specific export exists in the target file
            const exportedSymbols = [];
            const targetContent = fs.readFileSync(targetPath, 'utf-8');
            const targetLines = targetContent.split('\n');
            targetLines.forEach(l => {
                if (l.trim().startsWith('export const ')) {
                    exportedSymbols.push(l.split('export const ')[1].split(' ')[0].split('=')[0]);
                } else if (l.trim().startsWith('export function ')) {
                    exportedSymbols.push(l.split('export function ')[1].split('(')[0]);
                }
            });
            
            const importedSymbolsStr = imp.match(/import\s+\{\s*(.+?)\s*\}/);
            if (importedSymbolsStr) {
                const importedSymbols = importedSymbolsStr[1].split(',').map(s => s.trim());
                importedSymbols.forEach(sym => {
                    if (!exportedSymbols.includes(sym) && !targetContent.includes('export const ' + sym) && !targetContent.includes('export let ' + sym) && !targetContent.includes('export function ' + sym)) {
                        console.log('Missing exported symbol:', sym, 'from', target, 'in', file);
                    }
                });
            }
        }
      }
    }
  });
});
console.log('Import check complete.');

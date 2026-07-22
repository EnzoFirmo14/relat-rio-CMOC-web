import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  // Typography mapping to Design System variables
  { regex: /text-slate-900/g, replace: 'text-text-primary' },
  { regex: /text-slate-800/g, replace: 'text-text-primary' },
  { regex: /text-slate-700/g, replace: 'text-text-secondary' },
  { regex: /text-slate-600/g, replace: 'text-text-secondary' },
  { regex: /text-slate-500/g, replace: 'text-text-tertiary' },
  { regex: /text-slate-450/g, replace: 'text-text-tertiary' },
  { regex: /text-slate-400/g, replace: 'text-text-tertiary' },
  { regex: /text-slate-300/g, replace: 'text-text-secondary' }, // usually used in dark mode as secondary
  
  // Backgrounds mapping
  { regex: /bg-slate-100/g, replace: 'bg-surface-hover' },
  { regex: /bg-slate-200/g, replace: 'bg-surface-hover' },
  { regex: /bg-slate-50/g, replace: 'bg-background' },
  { regex: /bg-slate-800/g, replace: 'bg-surface' }, // often used in dark mode
  { regex: /bg-slate-900/g, replace: 'bg-background' },
  { regex: /bg-slate-700/g, replace: 'bg-surface-hover' },
  
  // Borders
  { regex: /border-slate-200/g, replace: 'border-border' },
  { regex: /border-slate-300/g, replace: 'border-border' },
  { regex: /border-slate-700/g, replace: 'border-border' },
  { regex: /border-slate-800/g, replace: 'border-border' },
  
  // Remove hardcoded dark: classes that conflict with DS tokens
  { regex: /dark:text-slate-\d+/g, replace: '' },
  { regex: /dark:bg-slate-\d+/g, replace: '' },
  { regex: /dark:border-slate-\d+/g, replace: '' },
  { regex: /dark:text-white\b(\/\d+)?/g, replace: '' }, // e.g. dark:text-white or dark:text-white/40
  { regex: /dark:text-cmoc-purple/g, replace: '' },
  { regex: /dark:bg-gray-\d+/g, replace: '' },
  
  // Hardcoded White / Black text
  { regex: /text-white\b(\/\d+)?/g, replace: 'text-[var(--primary-foreground)]' },
  { regex: /text-black\b(\/\d+)?/g, replace: 'text-text-primary' },
  { regex: /bg-white/g, replace: 'bg-surface' },
  
  // CMOC Brand colors to generic DS tokens
  { regex: /text-cmoc-blue/g, replace: 'text-primary' },
  { regex: /bg-cmoc-blue/g, replace: 'bg-primary' },
  { regex: /border-cmoc-blue/g, replace: 'border-primary' },
  { regex: /text-cmoc-purple/g, replace: 'text-primary' },
  { regex: /bg-cmoc-purple/g, replace: 'bg-primary' },
  { regex: /text-cmoc-green/g, replace: 'text-success' },
  { regex: /bg-cmoc-green/g, replace: 'bg-success' },
  { regex: /border-cmoc-green/g, replace: 'border-success' },
  
  // Hardcoded Status Colors
  { regex: /text-red-500/g, replace: 'text-error' },
  { regex: /bg-red-500/g, replace: 'bg-error' },
  { regex: /border-red-500/g, replace: 'border-error' },
  { regex: /text-yellow-500/g, replace: 'text-warning' },
  { regex: /bg-yellow-500/g, replace: 'bg-warning' },
  { regex: /border-yellow-500/g, replace: 'border-warning' },
  { regex: /text-teal-500/g, replace: 'text-info' },
  { regex: /bg-teal-500/g, replace: 'bg-info' },
  { regex: /border-teal-500/g, replace: 'border-info' },
  { regex: /text-green-500/g, replace: 'text-success' },
  { regex: /bg-green-500/g, replace: 'bg-success' },
  { regex: /border-green-500/g, replace: 'border-success' },
  
  // Clean up double spaces caused by removing dark classes
  { regex: / +/g, replace: ' ' },
  { regex: /" /g, replace: '"' },
  { regex: / '/g, replace: "'" }
];

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    replacements.forEach(({ regex, replace }) => {
      content = content.replace(regex, replace);
    });

    // Special fix for text-[var(--primary-foreground)] which might be used where we actually just meant text-surface, but we'll manually fix edge cases.
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});

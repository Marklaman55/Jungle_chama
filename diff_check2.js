const fs = require('fs');
const path = require('path');

const version2Dir = path.join('C:', 'Users', 'HomePC', 'Desktop', 'jungle-chama', 'secon_last_version', 'version_2');
const mainDir = path.join('C:', 'Users', 'HomePC', 'Desktop', 'jungle-chama', 'secon_last_version');

function getMainPath(v2RelPath) {
  const parts = v2RelPath.split('/');
  if (parts[0] === 'src') return path.join(mainDir, 'frontend', 'src', ...parts.slice(1));
  if (parts[0] === 'server.ts') return path.join(mainDir, 'backend', 'src', 'server.ts');
  if (parts[0] === 'tsconfig.json') return path.join(mainDir, 'backend', 'tsconfig.json');
  if (parts[0] === 'package.json') return path.join(mainDir, 'backend', 'package.json');
  if (parts[0] === 'vite.config.ts') return path.join(mainDir, 'frontend', 'vite.config.ts');
  if (['controllers', 'routes', 'models', 'services', 'middleware', 'cron'].includes(parts[0])) {
    return path.join(mainDir, 'backend', 'src', ...parts);
  }
  return null;
}

function findSourceFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') results.push(...findSourceFiles(fullPath));
    else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) results.push(fullPath);
  }
  return results;
}

const v2Files = findSourceFiles(version2Dir);
let output = '';

for (const v2File of v2Files) {
  const relPath = path.relative(version2Dir, v2File);
  if (relPath.includes('delete_chair')) continue;

  const mainFile = getMainPath(relPath);
  if (!mainFile) { output += `NO MAPPING: ${relPath}\n`; continue; }

  if (!fs.existsSync(mainFile)) {
    output += `NEW (no main file): ${relPath}\n`;
    continue;
  }

  const v2Content = fs.readFileSync(v2File, 'utf8');
  const mainContent = fs.readFileSync(mainFile, 'utf8');

  if (v2Content.trim() !== mainContent.trim()) {
    output += `\n=== CHANGED: ${relPath} ===\n`;
    const v2Lines = v2Content.split('\n');
    const mainLines = mainContent.split('\n');

    const v2Only = v2Lines.filter(l => {
      const t = l.trim();
      return t && t !== '{' && t !== '}' && t !== ';' &&
        !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') && !t.startsWith('*/') &&
        !t.startsWith('import') && !t.startsWith('export') && !t.startsWith('from') &&
        !t.startsWith('const ') && !t.startsWith('let ') && !t.startsWith('var ') &&
        !t.startsWith('return') && !t.startsWith('if ') && !t.startsWith('} else') &&
        !t.startsWith('}') && !t.startsWith('{') && !t.startsWith('//') &&
        !/^\s*\/\//.test(l) && !/^\s*\*$/.test(l);
    });
    const mainOnly = mainLines.filter(l => {
      const t = l.trim();
      return t && t !== '{' && t !== '}' && t !== ';' &&
        !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') && !t.startsWith('*/') &&
        !t.startsWith('import') && !t.startsWith('export') && !t.startsWith('from') &&
        !t.startsWith('const ') && !t.startsWith('let ') && !t.startsWith('var ') &&
        !t.startsWith('return') && !t.startsWith('if ') && !t.startsWith('} else') &&
        !t.startsWith('}') && !t.startsWith('{') && !t.startsWith('//') &&
        !/^\s*\/\//.test(l) && !/^\s*\*$/.test(l);
    });

    if (v2Only.length > 0) {
      output += '  V2 ADDITIONS:\n';
      v2Only.slice(0, 20).forEach(l => output += `    + ${l.trim()}\n`);
      if (v2Only.length > 20) output += `    ... (${v2Only.length - 20} more)\n`;
    }
    if (mainOnly.length > 0) {
      output += '  MAIN ONLY:\n';
      mainOnly.slice(0, 20).forEach(l => output += `    - ${l.trim()}\n`);
      if (mainOnly.length > 20) output += `    ... (${mainOnly.length - 20} more)\n`;
    }
  }
}

fs.writeFileSync(path.join(mainDir, 'diff_output2.txt'), output);
console.log('Done! Output length:', output.length);
const fs = require('fs');
const path = require('path');

const version2Dir = path.join('C:', 'Users', 'HomePC', 'Desktop', 'jungle-chama', 'secon_last_version', 'version_2');
const mainDir = path.join('C:', 'Users', 'HomePC', 'Desktop', 'jungle-chama', 'secon_last_version');

function getMainPath(v2RelPath) {
  const normalized = v2RelPath.replace(/\\/g, '/');
  const parts = normalized.split('/');
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

function getUniqueLines(content) {
  return content.split('\n').filter(l => {
    const t = l.trim();
    return t && t !== '{' && t !== '}' && t !== ';' &&
      !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') && !t.startsWith('*/') &&
      !t.startsWith('import ') && !t.startsWith('export ') && !t.startsWith('from ') &&
      !t.startsWith('const ') && !t.startsWith('let ') && !t.startsWith('var ') &&
      !t.startsWith('return') && !t.startsWith('if ') && !t.startsWith('} else') &&
      !t.startsWith('}') && !t.startsWith('{') &&
      !/^\s*\/\//.test(l) && !/^\s*\*$/.test(l) &&
      !/^\s*\/\*/.test(l) && !/^\s*\*\//.test(l) &&
      !/^export default/.test(l) && !/^export \{/.test(l);
  });
}

const v2Files = findSourceFiles(version2Dir);
let output = '';

for (const v2File of v2Files) {
  const relPath = path.relative(version2Dir, v2File).replace(/\\/g, '/');
  if (relPath.includes('delete_chair')) continue;

  const mainFile = getMainPath(relPath);
  if (!mainFile) { output += `NO MAPPING: ${relPath}\n`; continue; }

  if (!fs.existsSync(mainFile)) {
    output += `MISSING in main: ${relPath} -> ${mainFile}\n`;
    continue;
  }

  const v2Content = fs.readFileSync(v2File, 'utf8');
  const mainContent = fs.readFileSync(mainFile, 'utf8');

  if (v2Content.trim() !== mainContent.trim()) {
    const v2Only = getUniqueLines(v2Content).filter(l => !mainContent.includes(l));
    const mainOnly = getUniqueLines(mainContent).filter(l => !v2Content.includes(l));

    if (v2Only.length > 0 || mainOnly.length > 0) {
      output += `\n=== CHANGED: ${relPath} ===\n`;
      if (v2Only.length > 0) {
        output += `  V2 ADDITIONS (${v2Only.length}):\n`;
        v2Only.slice(0, 15).forEach(l => output += `    + ${l}\n`);
        if (v2Only.length > 15) output += `    ... and ${v2Only.length - 15} more\n`;
      }
      if (mainOnly.length > 0) {
        output += `  MAIN ONLY (${mainOnly.length}):\n`;
        mainOnly.slice(0, 15).forEach(l => output += `    - ${l}\n`);
        if (mainOnly.length > 15) output += `    ... and ${mainOnly.length - 15} more\n`;
      }
    }
  }
}

fs.writeFileSync(path.join(mainDir, 'diff_v2_vs_main.txt'), output);
console.log('Done! Output length:', output.length);
import os, re

pages_dir = r"C:\Users\HomePC\Desktop\jungle-chama\secon_last_version\frontend\src\pages"

for fname in os.listdir(pages_dir):
    if not fname.endswith('.tsx'):
        continue
    fpath = os.path.join(pages_dir, fname)
    with open(fpath, 'r') as f:
        content = f.read()

    original = content

    # Replace raw fetch('/api/...') with apiFetch('/api/...')
    # Pattern 1: await fetch('/api/...', { headers })
    content = re.sub(
        r"await fetch\(\s*'(/api/[^\']+)'\s*,\s*\{",
        r"await apiFetch(\1, {",
        content
    )
    # Pattern 2: await fetch('/api/...')
    content = re.sub(
        r"await fetch\(\s*'(/api/[^\']+?)'\s*\)",
        r"await apiFetch(\1)",
        content
    )
    # Pattern 3: fetch('/api/...').then (no await)
    content = re.sub(
        r"fetch\(\s*'(/api/[^\']+?)'\s*\)",
        r"apiFetch(\1)",
        content
    )
    # Pattern 4: fetch('/api/...', {
    content = re.sub(
        r"fetch\(\s*'(/api/[^\']+)'\s*,\s*\{",
        r"apiFetch(\1, {",
        content
    )

    # Add import if fetch('/api/') is still present but apiFetch is not imported
    if '/api/' in content and 'apiFetch' not in content:
        # Find a good place to add import - after last existing import
        lines = content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_idx = i + 1
        lines.insert(insert_idx, "import { apiFetch } from '../lib/api';")
        content = '\n'.join(lines)

    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        print(f'Updated: {fname}')
    else:
        print(f'No changes: {fname}')

print("Done!")
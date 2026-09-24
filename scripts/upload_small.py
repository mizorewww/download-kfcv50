#!/usr/bin/env python3
"""Upload packages supported by Wrangler's 300 MiB per-object limit."""
import json
import mimetypes
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHATGPT = Path.home() / 'Downloads/chatgpt-installers'
LIMIT = 300 * 1024 * 1024
manifest = json.loads((ROOT / 'site/data/packages.json').read_text())
failures = []
for package in manifest['packages']:
    if package.get('external') or package['bytes'] > LIMIT:
        continue
    source = (CHATGPT if package['product'] == 'chatgpt' else ROOT / 'packages/flclash') / package['filename']
    key = f"kfcv50-downloads/{package['product']}/{package['filename']}"
    content_type = mimetypes.guess_type(source.name)[0] or 'application/octet-stream'
    command = ['wrangler', 'r2', 'object', 'put', key, '--file', str(source), '--content-type', content_type,
               '--content-disposition', f'attachment; filename="{source.name}"', '--remote', '--force']
    print(f'Uploading {source.name} ({package["bytes"]} bytes)', flush=True)
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode:
        failures.append(source.name)
        print(result.stderr[-700:] or result.stdout[-700:], flush=True)
    else:
        print('  done', flush=True)
print(f'Upload failures: {failures}', flush=True)
raise SystemExit(bool(failures))

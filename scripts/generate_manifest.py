#!/usr/bin/env python3
"""Generate the public package listing from staged files. Run after downloads finish."""
import hashlib
import json
from datetime import date
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CHATGPT = Path.home() / 'Downloads/chatgpt-installers'
FLCLASH = ROOT / 'packages/flclash'
BASE = 'https://files.kfcv50.today'

CHATGPT_PACKAGES = [
    ('ChatGPT-mac-arm64.dmg', 'macOS · Apple Silicon', 'macOS', '26.917.71314 · 完整安装包 · Apple Silicon / arm64', '完整包', False),
    ('ChatGPT-windows-x64.msix', 'Windows · x64', 'Windows', '26.917.8451.0 · 完整离线包 · Intel / AMD 64 位', '完整包', False),
    ('ChatGPT-android-1.2026.258-universal.apkm', 'Android · 原始分包', 'Android', '原始 APKM · 需 APKMirror Installer 或 SAI 安装', '原始签名', False),
    ('ChatGPT-android-1.2026.258-universal.apk', 'Android · 通用单 APK', 'Android', '由原始分包转换并以调试证书重新签名 · Android 12L+', '非官方重签', True),
]
CHATGPT_SOURCES = {
    'ChatGPT-mac-arm64.dmg': ('OpenAI CDN', 'https://persistent.oaistatic.com/codex-app-prod/ChatGPT.dmg'),
    'ChatGPT-windows-x64.msix': ('OpenAI CDN', 'https://persistent.oaistatic.com/codex-app-prod/ChatGPT-x64.msix'),
    'ChatGPT-android-1.2026.258-universal.apkm': ('APKMirror', 'https://www.apkmirror.com/apk/openai/chatgpt/'),
    'ChatGPT-android-1.2026.258-universal.apk': ('转换说明', 'https://github.com/mizorewww/download-kfcv50#kfcv50-下载中心'),
}

def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(8 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def item(path, product, platform, title, subtitle, badge='', warning=False, source=None):
    return dict(product=product, platform=platform, title=title, subtitle=subtitle,
                badge=badge, warning=warning, filename=path.name, bytes=path.stat().st_size,
                sha256=sha256(path), url=f'{BASE}/{product}/{quote(path.name)}',
                sourceLabel=source[0] if source else '', sourceUrl=source[1] if source else '')

packages = []
for filename, title, platform, subtitle, badge, warning in CHATGPT_PACKAGES:
    path = CHATGPT / filename
    if not path.is_file():
        raise SystemExit(f'Missing ChatGPT package: {path}')
    packages.append(item(path, 'chatgpt', platform, title, subtitle, badge, warning, CHATGPT_SOURCES[filename]))
packages.append(dict(product='chatgpt', platform='iOS', title='iPhone / iPad', subtitle='通过 App Store 获取官方版本', badge='App Store', warning=False, filename='', bytes=0, sha256='', url='https://apps.apple.com/app/chatgpt/id6448311069', external=True))

if not (FLCLASH / 'SHA256SUMS').exists():
    raise SystemExit('Download the FlClash release and SHA256SUMS first')
checksums = {}
for line in (FLCLASH / 'SHA256SUMS').read_text().splitlines():
    parts = line.split(maxsplit=1)
    if len(parts) == 2:
        checksums[parts[1].removeprefix('./').lstrip('*')] = parts[0]
for path in sorted(FLCLASH.glob('FlClash-*')):
    name = path.name
    if name not in checksums:
        raise SystemExit(f'No upstream checksum for {name}')
    digest = sha256(path)
    if checksums[name].lower() != digest:
        raise SystemExit(f'Upstream SHA-256 mismatch: {name}')
    bits = name.split('-')
    platform_key = {'macos': 'macOS', 'windows': 'Windows', 'android': 'Android', 'linux': 'Linux'}[bits[2]]
    arch = bits[3].split('.')[0]
    if bits[2] == 'android':
        arch = '-'.join(bits[3:]).removesuffix('.apk')
    format_label = '安装程序' if name.endswith('setup.exe') else path.suffix.lstrip('.').upper()
    title = f'{platform_key} · {arch} · {format_label}'
    subtitle = f'FlClash {bits[1]} · 官方 GitHub Release'
    badge = '推荐' if name.endswith(('macos-arm64.dmg', 'windows-amd64-setup.exe', 'android-arm64-v8a.apk', 'linux-amd64.AppImage')) else ''
    source = ('GitHub 官方发布', f'https://github.com/chen08209/FlClash/releases/download/v0.8.98/{quote(name)}')
    packages.append(item(path, 'flclash', platform_key, title, subtitle, badge, source=source))

manifest = dict(updated=date.today().isoformat(), packages=packages)
output = ROOT / 'site/data/packages.json'
output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'Wrote {len(packages)} entries to {output}')

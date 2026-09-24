const icons = { macOS: 'apple', Windows: 'windows', Android: 'android', Linux: 'linux', iOS: 'apple' };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size = bytes => bytes ? `${(bytes / 1048576).toFixed(bytes >= 104857600 ? 0 : 1)} MiB` : '';

async function detectDevice() {
  const ua = navigator.userAgent || '';
  const platformHint = navigator.userAgentData?.platform || '';
  let architecture = '';
  try { architecture = (await navigator.userAgentData?.getHighEntropyValues?.(['architecture']))?.architecture?.toLowerCase() || ''; } catch {}
  const ipad = /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const platform = ipad ? 'iOS' : /Android/i.test(ua + platformHint) ? 'Android' : /Windows/i.test(ua + platformHint) ? 'Windows' : /Macintosh|Mac OS X|macOS/i.test(ua + platformHint) ? 'macOS' : /Linux/i.test(ua + platformHint) ? 'Linux' : 'unknown';
  const arch = /arm|aarch/i.test(architecture) ? 'arm64' : /x86|amd64|x64/i.test(architecture) ? 'amd64' : /arm64|aarch64/i.test(ua) ? 'arm64' : /x86_64|amd64|x64|Win64/i.test(ua) ? 'amd64' : 'unknown';
  return { platform, arch };
}

function choosePackage(packages, product, device) {
  const relevant = packages.filter(pkg => pkg.product === product);
  const find = name => relevant.find(pkg => pkg.filename === name);
  const fl = (part) => relevant.find(pkg => pkg.filename.includes(part));
  if (product === 'chatgpt') {
    if (device.platform === 'iOS') return relevant.find(pkg => pkg.platform === 'iOS');
    if (device.platform === 'Android') return find('ChatGPT-android-1.2026.258-universal.apk');
    if (device.platform === 'Windows' && device.arch !== 'arm64') return find('ChatGPT-windows-x64.msix');
    if (device.platform === 'macOS' && device.arch !== 'amd64') return find('ChatGPT-mac-arm64.dmg');
    return null;
  }
  if (device.platform === 'Android') return fl(device.arch === 'amd64' ? 'android-x86_64.apk' : device.arch === 'arm32' ? 'android-armeabi-v7a.apk' : 'android-arm64-v8a.apk');
  if (device.platform === 'macOS') return fl(device.arch === 'amd64' ? 'macos-amd64.dmg' : 'macos-arm64.dmg');
  if (device.platform === 'Windows') return fl(device.arch === 'arm64' ? 'windows-arm64-setup.exe' : 'windows-amd64-setup.exe');
  if (device.platform === 'Linux') return fl(device.arch === 'arm64' ? 'linux-arm64.AppImage' : 'linux-amd64.AppImage');
  return null;
}

function packageRow(pkg) {
  const info = pkg.external ? '' : `<details class="file-details"><summary>文件信息</summary><div>${escapeHtml(pkg.filename)}</div><code>SHA-256 ${escapeHtml(pkg.sha256)}</code>${pkg.sourceUrl ? `<a class="source-link" href="${escapeHtml(pkg.sourceUrl)}" target="_blank" rel="noopener noreferrer">来源：${escapeHtml(pkg.sourceLabel)} ↗</a>` : ''}</details>`;
  return `<article class="package"><span class="system-logo"><img src="/icons/${icons[pkg.platform]}.svg" alt="${escapeHtml(pkg.platform)}"></span><div class="package-main"><h3>${escapeHtml(pkg.title)}</h3><p>${escapeHtml(pkg.subtitle)}</p>${info}</div><div class="package-action"><span class="size">${size(pkg.bytes)}</span><a class="download" href="${escapeHtml(pkg.url)}" ${pkg.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>${pkg.external ? '前往' : '下载'}</a></div></article>`;
}

function renderProduct(packages, product, device) {
  const container = document.querySelector(`#${product}-list`);
  const relevant = packages.filter(pkg => pkg.product === product);
  const selected = choosePackage(packages, product, device);
  const deviceText = device.platform === 'unknown' ? '未识别系统' : `${device.platform}${device.arch === 'unknown' ? ' · 架构未识别' : ` · ${device.arch}`}`;
  const primary = selected ? packageRow(selected) : `<div class="no-match">${device.platform === 'unknown' ? '未识别当前系统，请从其他版本中选择。' : `当前设备暂无对应的 ${product === 'chatgpt' ? 'ChatGPT' : 'FlClash'} 安装包，请查看其他版本。`}</div>`;
  const alternatives = relevant.filter(pkg => pkg !== selected);
  container.innerHTML = `<p class="recognition">当前识别：${escapeHtml(deviceText)}${device.arch === 'unknown' && device.platform !== 'iOS' ? '；已按常见架构推荐' : ''}</p><div class="package-list">${primary}</div><details class="alternatives"><summary>其他版本 (${alternatives.length})</summary><div class="package-list">${alternatives.map(packageRow).join('')}</div></details>`;
}

Promise.all([fetch('/data/packages.json').then(r => { if (!r.ok) throw new Error('Failed to load packages'); return r.json(); }), detectDevice()]).then(([data, device]) => {
  for (const product of ['chatgpt','flclash']) renderProduct(data.packages, product, device);
}).catch(() => {
  for (const product of ['chatgpt','flclash']) document.querySelector(`#${product}-list`).textContent = '下载列表暂时无法加载，请稍后重试。';
});

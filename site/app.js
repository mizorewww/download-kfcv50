const icons = { macOS: 'apple', Windows: 'windows', Android: 'android', Linux: 'linux', iOS: 'apple' };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size = bytes => bytes ? `${(bytes / 1048576).toFixed(bytes >= 104857600 ? 0 : 1)} MiB` : '';
function renderPackage(pkg) {
  const details = pkg.external ? '' : `<details class="file-details"><summary>文件信息</summary><div>${escapeHtml(pkg.filename)}</div><code>SHA-256 ${escapeHtml(pkg.sha256)}</code>${pkg.sourceUrl ? `<a class="source-link" href="${escapeHtml(pkg.sourceUrl)}" target="_blank" rel="noopener noreferrer">来源：${escapeHtml(pkg.sourceLabel)} ↗</a>` : ''}</details>`;
  return `<article class="package"><span class="system-logo"><img src="/icons/${icons[pkg.platform]}.svg" alt="${escapeHtml(pkg.platform)}"></span><div class="package-main"><h3>${escapeHtml(pkg.title)}</h3><p>${escapeHtml(pkg.subtitle)}</p>${details}</div><div class="package-action"><span class="size">${size(pkg.bytes)}</span><a class="download" href="${escapeHtml(pkg.url)}" ${pkg.external ? 'target="_blank" rel="noopener noreferrer"' : 'download'}>${pkg.external ? '前往' : '下载'}</a></div></article>`;
}
fetch('/data/packages.json').then(r => { if (!r.ok) throw new Error('Failed to load packages'); return r.json(); }).then(data => {
  for (const product of ['chatgpt','flclash']) document.querySelector(`#${product}-list`).innerHTML = data.packages.filter(pkg => pkg.product === product).map(renderPackage).join('');
}).catch(() => {
  for (const product of ['chatgpt','flclash']) document.querySelector(`#${product}-list`).textContent = '下载列表暂时无法加载，请稍后重试。';
});

const state = { product: 'chatgpt', platform: 'all', query: '' };
const icons = { macOS: '⌘', Windows: '⊞', Android: '◉', Linux: '>_', iOS: '◈' };
const list = document.querySelector('#package-list');
let packages = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function humanSize(bytes) {
  if (!bytes) return '应用商店';
  return `${(bytes / 1048576).toFixed(bytes >= 104857600 ? 0 : 1)} MiB`;
}
function card(pkg) {
  const external = pkg.external;
  const badge = pkg.badge ? `<span class="badge ${pkg.warning ? 'warning' : ''}">${escapeHtml(pkg.badge)}</span>` : '';
  const filename = external ? '' : `<p class="package-filename">${escapeHtml(pkg.filename)}${pkg.sourceUrl ? ` <span aria-hidden="true">·</span> <a class="source-link" href="${escapeHtml(pkg.sourceUrl)}" target="_blank" rel="noopener noreferrer">来源：${escapeHtml(pkg.sourceLabel)} ↗</a>` : ''}</p>`;
  const hash = pkg.sha256 ? `<div class="hash-row"><span>SHA-256</span><code>${escapeHtml(pkg.sha256)}</code><button class="copy-button" type="button" data-copy="${escapeHtml(pkg.sha256)}" aria-label="复制 ${escapeHtml(pkg.title)} 的 SHA-256">复制</button></div>` : '';
  return `<article class="package-card" data-platform="${escapeHtml(pkg.platform)}"><div class="platform-icon" aria-hidden="true">${icons[pkg.platform] || '↓'}</div><div class="package-info"><div class="package-title"><h3>${escapeHtml(pkg.title)}</h3>${badge}</div><p class="package-subtitle">${escapeHtml(pkg.subtitle)}</p>${filename}</div><div class="package-actions"><span class="package-size">${humanSize(pkg.bytes)}</span><a class="download-button ${external ? 'external' : ''}" href="${escapeHtml(pkg.url)}" ${external ? 'target="_blank" rel="noopener noreferrer"' : 'download'} aria-label="${external ? '前往' : '下载'} ${escapeHtml(pkg.title)}">${external ? '前往获取' : '立即下载'} <span aria-hidden="true">${external ? '↗' : '↓'}</span></a></div>${hash}</article>`;
}
function render() {
  const selected = packages.filter(pkg => pkg.product === state.product);
  const query = state.query.trim().toLowerCase();
  const shown = selected.filter(pkg => (state.platform === 'all' || pkg.platform === state.platform) && (!query || [pkg.title, pkg.subtitle, pkg.filename, pkg.platform].join(' ').toLowerCase().includes(query)));
  list.innerHTML = shown.length ? shown.map(card).join('') : '<div class="empty-state">没有匹配的安装包。试试切换平台或清除搜索词。</div>';
  document.querySelector('#file-count').textContent = `${shown.length} 个可选项目`;
  document.querySelectorAll('.filter').forEach(button => {
    const active = button.dataset.platform === state.platform;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.product-tab').forEach(button => {
    const active = button.dataset.product === state.product;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
}
fetch('/data/packages.json').then(response => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}).then(data => {
  packages = data.packages;
  document.querySelector('#chatgpt-count').textContent = packages.filter(pkg => pkg.product === 'chatgpt').length;
  document.querySelector('#flclash-count').textContent = packages.filter(pkg => pkg.product === 'flclash').length;
  document.querySelector('#updated').textContent = `更新于 ${data.updated.replaceAll('-', '.')}`;
  render();
}).catch(() => { list.innerHTML = '<div class="empty-state">安装包列表暂时无法加载，请稍后重试。</div>'; });

document.querySelectorAll('.product-tab').forEach(button => button.addEventListener('click', () => { state.product = button.dataset.product; state.platform = 'all'; render(); }));
document.querySelector('.product-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const buttons = [...document.querySelectorAll('.product-tab')];
  const next = buttons[(buttons.findIndex(button => button.dataset.product === state.product) + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
  next.click(); next.focus();
});
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { state.platform = button.dataset.platform; render(); }));
document.querySelector('#search').addEventListener('input', event => { state.query = event.target.value; render(); });
list.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = '已复制'; setTimeout(() => { button.textContent = '复制'; }, 1800); }
  catch { button.textContent = '复制失败'; }
});

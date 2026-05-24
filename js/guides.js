async function loadGuides() {
  const data = await loadJSON('data/guides.json');
  if (!data) return [];
  return data;
}

function getCategoryLabel(cat) {
  const map = {
    beginner: '新手教程',
    hero: '英雄攻略',
    role: '位置教学',
    patch: '版本解读'
  };
  return map[cat] || cat;
}

function getCategoryIcon(cat) {
  const map = {
    beginner: '📖',
    hero: '⚔️',
    role: '🎯',
    patch: '📋'
  };
  return map[cat] || '📄';
}

function renderGuideList(guides, container) {
  container.innerHTML = guides.map(guide => `
    <a class="guide-card" href="guide-detail.html?id=${guide.id}">
      <div class="guide-card-content">
        <div style="margin-bottom:6px">
          <span class="tag">${getCategoryIcon(guide.category)} ${getCategoryLabel(guide.category)}</span>
          <span class="text-muted" style="font-size:0.75rem;margin-left:8px">${guide.date}</span>
        </div>
        <h3>${guide.title}</h3>
        <p>${guide.summary}</p>
        <div>
          ${guide.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </a>
  `).join('');
}

function filterGuides(guides, filter) {
  if (filter === 'all') return guides;
  return guides.filter(g => g.category === filter);
}

async function initGuideList() {
  const list = document.getElementById('guide-list');
  const filterBar = document.getElementById('guide-filters');
  if (!list) return;

  const guides = await loadGuides();
  if (!guides || guides.length === 0) {
    list.innerHTML = '<p class="loading">加载失败</p>';
    return;
  }

  // Check URL for initial filter
  const urlFilter = getUrlParam('filter');
  if (urlFilter && filterBar) {
    const filtered = filterGuides(guides, urlFilter);
    renderGuideList(filtered, list);
    filterBar.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === urlFilter);
    });
  } else {
    renderGuideList(guides, list);
  }

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const filtered = filterGuides(guides, filter);
      renderGuideList(filtered, list);
    });
  }
}

async function initGuideDetail() {
  const container = document.getElementById('guide-detail');
  if (!container) return;

  const guideId = getUrlParam('id');
  if (!guideId) {
    container.innerHTML = '<p class="text-center text-muted">未指定攻略</p>';
    return;
  }

  const guides = await loadGuides();
  const guide = guides.find(g => g.id === guideId);
  if (!guide) {
    container.innerHTML = '<p class="text-center text-muted">攻略未找到</p>';
    return;
  }

  document.title = `${guide.title} - DOTA 2 攻略站`;

  const contentHtml = markdownToHtml(guide.content);

  container.innerHTML = `
    <article class="guide-article">
      <div class="guide-header">
        <div class="guide-meta">
          <span class="tag">${getCategoryIcon(guide.category)} ${getCategoryLabel(guide.category)}</span>
          <span class="text-muted">${guide.date}</span>
          <span class="text-muted">作者：${guide.author}</span>
        </div>
        <h1>${guide.title}</h1>
        <p class="guide-summary">${guide.summary}</p>
        <div class="guide-tags">
          ${guide.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="guide-content">
        ${contentHtml}
      </div>
      <div class="guide-footer">
        <a href="guides.html" class="btn btn-secondary">← 返回攻略列表</a>
      </div>
    </article>
  `;
}

function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
  html = `<p>${html}</p>`;

  // handle tables
  html = html.replace(/<p>\|(.+)\|<br>\|[-\s|]+\|<br>([\s\S]*?)<\/p>/g, (match, header, body) => {
    const headers = header.split('|').map(h => `<th>${h.trim()}</th>`).join('');
    const rows = body.split('<br>').filter(r => r.trim()).map(row => {
      const cells = row.replace(/^\||\|$/g, '').split('|').map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  return html;
}

async function initLatestGuides() {
  const container = document.getElementById('latest-guides');
  if (!container) return;

  const guides = await loadGuides();
  if (!guides) return;

  const latest = guides.slice(0, 3);
  renderGuideList(latest, container);
}

document.addEventListener('DOMContentLoaded', () => {
  initGuideList();
  initGuideDetail();
  initLatestGuides();
});

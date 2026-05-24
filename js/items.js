async function loadItems() {
  const data = await loadJSON('data/items.json');
  if (!data) return [];
  return data;
}

function getCategoryName(cat) {
  const map = {
    consumable: '消耗品',
    basic: '基础',
    mid: '中级',
    advanced: '高级',
    luxury: '奢侈品'
  };
  return map[cat] || cat;
}

function renderItemGrid(items, container) {
  container.innerHTML = items.map(item => `
    <a class="item-card" href="item-detail.html?id=${item.id}">
      <div class="item-card-icon">
        <img src="${getItemImage(item.id)}" alt="${item.name}"
             onerror="this.parentElement.textContent='📦'">
      </div>
      <div class="item-card-info">
        <div class="item-card-name">${item.name}</div>
        <div class="item-card-cost">💰 ${item.cost}</div>
        <div class="item-card-category">
          <span class="tag category-${item.category}">${getCategoryName(item.category)}</span>
        </div>
      </div>
    </a>
  `).join('');
}

function filterItems(items, filter) {
  if (filter === 'all') return items;
  return items.filter(i => i.category === filter);
}

async function initItemList() {
  const grid = document.getElementById('item-grid');
  const filterBar = document.getElementById('item-filters');
  if (!grid) return;

  const items = await loadItems();
  if (!items || items.length === 0) {
    grid.innerHTML = '<p class="loading">加载失败</p>';
    return;
  }

  renderItemGrid(items, grid);

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const filtered = filterItems(items, filter);
      renderItemGrid(filtered, grid);
    });
  }
}

async function initItemDetail() {
  const container = document.getElementById('item-detail');
  if (!container) return;

  const itemId = getUrlParam('id');
  if (!itemId) {
    container.innerHTML = '<p class="text-center text-muted">未指定物品</p>';
    return;
  }

  const items = await loadItems();
  const heroes = await loadJSON('data/heroes.json') || [];

  const item = items.find(i => i.id === itemId);
  if (!item) {
    container.innerHTML = '<p class="text-center text-muted">物品未找到</p>';
    return;
  }

  document.title = `${item.name} - DOTA 2 攻略站`;

  const statsHtml = Object.keys(item.stats).length > 0
    ? `<div class="item-stats">
        <h3>属性加成</h3>
        ${Object.keys(item.stats).map(s => `<div class="item-stat-row">${s}</div>`).join('')}
      </div>`
    : '';

  const effectsHtml = (item.active || item.passive)
    ? `<div class="item-effects">
        <h2>效果</h2>
        ${item.active ? `<div class="effect-block"><h4>主动</h4><p>${item.active}</p></div>` : ''}
        ${item.passive ? `<div class="effect-block"><h4>被动</h4><p>${item.passive}</p></div>` : ''}
      </div>`
    : '';

  const recipeHtml = item.components.length > 0
    ? `<div class="recipe-tree">
        <h2>合成路线</h2>
        <div class="recipe-components">
          ${item.components.map((comp, i) => `
            ${i > 0 ? '<span class="recipe-plus">+</span>' : ''}
            <div class="recipe-component">
              <img src="${getItemImage(comp)}" alt="${comp}"
                   onerror="this.style.display='none'">
              <span>${comp.replace(/_/g, ' ')}</span>
            </div>
          `).join('')}
          <span class="recipe-arrow">→</span>
          <div class="recipe-component" style="border-color:var(--accent-gold)">
            <img src="${getItemImage(item.id)}" alt="${item.name}"
                 onerror="this.style.display='none'">
            <span>${item.name}</span>
          </div>
        </div>
      </div>`
    : '';

  const recommendedHeroes = heroes.filter(h => item.recommended_heroes.includes(h.id));
  const heroesHtml = recommendedHeroes.length > 0
    ? `<div class="item-heroes">
        <h2>推荐英雄</h2>
        <div class="item-heroes-list">
          ${recommendedHeroes.map(h => `
            <a class="item-hero-chip" href="hero-detail.html?id=${h.id}">
              <img src="${getHeroImage(h.id)}" alt="${h.name}"
                   onerror="this.style.display='none'">
              <span>${h.name}</span>
            </a>
          `).join('')}
        </div>
      </div>`
    : '';

  container.innerHTML = `
    <aside class="item-sidebar">
      <div class="item-portrait">
        <div class="item-portrait-icon">
          <img src="${getItemImage(item.id)}" alt="${item.name}"
               onerror="this.parentElement.textContent='📦'">
        </div>
        <h1>${item.name}</h1>
        <div class="item-name-en">${item.name_en}</div>
        <div class="item-cost">💰 ${item.cost} 金币</div>
        <div style="margin-top:10px">
          <span class="tag category-${item.category}">${getCategoryName(item.category)}</span>
        </div>
      </div>
      ${statsHtml}
    </aside>
    <div class="item-main">
      <div class="item-effects" style="margin-bottom:24px">
        <h2>描述</h2>
        <p style="color:var(--text-secondary);font-size:0.9rem">${item.description}</p>
      </div>
      ${effectsHtml}
      ${recipeHtml}
      ${heroesHtml}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initItemList();
  initItemDetail();
});

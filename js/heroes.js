async function loadHeroes() {
  const data = await loadJSON('data/heroes.json');
  if (!data) return;
  return data;
}

function renderHeroGrid(heroes, container) {
  container.innerHTML = heroes.map(hero => `
    <a class="hero-card" href="hero-detail.html?id=${hero.id}">
      <span class="tier-badge ${getTierClass(hero.tier)}">${hero.tier}</span>
      <img class="hero-card-avatar" src="${getHeroImage(hero.id)}" alt="${hero.name}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%231f2b45%22 width=%2280%22 height=%2280%22/><text x=%2240%22 y=%2245%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>${hero.name[0]}</text></svg>'">
      <div class="hero-card-name">${hero.name}</div>
      <div class="hero-card-name-en">${hero.name_en}</div>
      <div class="hero-card-meta">
        <span class="attr-badge ${getAttrClass(hero.attribute)}">${getAttrName(hero.attribute)}</span>
        ${hero.roles.slice(0, 2).map(r => `<span class="tag">${r}</span>`).join('')}
      </div>
    </a>
  `).join('');
}

function filterHeroes(heroes, filter) {
  if (filter === 'all') return heroes;
  if (['str', 'agi', 'int', 'uni'].includes(filter)) {
    return heroes.filter(h => h.attribute === filter);
  }
  return heroes.filter(h =>
    h.roles.some(r => r.includes(filter)) || h.positions.includes(parseInt(filter))
  );
}

async function initHeroList() {
  const grid = document.getElementById('hero-grid');
  const filterBar = document.getElementById('hero-filters');
  if (!grid) return;

  const heroes = await loadHeroes();
  if (!heroes) {
    grid.innerHTML = '<p class="loading">加载失败</p>';
    return;
  }

  renderHeroGrid(heroes, grid);

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const filtered = filterHeroes(heroes, filter);
      renderHeroGrid(filtered, grid);
    });
  }
}

async function initHeroDetail() {
  const container = document.getElementById('hero-detail');
  if (!container) return;

  const heroId = getUrlParam('id');
  if (!heroId) {
    container.innerHTML = '<p class="text-center text-muted">未指定英雄</p>';
    return;
  }

  const heroes = await loadHeroes();
  if (!heroes) return;

  const hero = heroes.find(h => h.id === heroId);
  if (!hero) {
    container.innerHTML = '<p class="text-center text-muted">英雄未找到</p>';
    return;
  }

  document.title = `${hero.name} - DOTA 2 攻略站`;

  container.innerHTML = `
    <aside class="hero-sidebar">
      <div class="hero-portrait">
        <img src="${getHeroImage(hero.id)}" alt="${hero.name}"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 140 140%22><rect fill=%22%231f2b45%22 width=%22140%22 height=%22140%22 rx=%2270%22/><text x=%2270%22 y=%2280%22 text-anchor=%22middle%22 fill=%22%23d4a843%22 font-size=%2240%22>${hero.name[0]}</text></svg>'">
        <h1>${hero.name}</h1>
        <div class="hero-name-en">${hero.name_en}</div>
        <span class="attr-badge ${getAttrClass(hero.attribute)}">${getAttrName(hero.attribute)}</span>
        <span class="tier-badge ${getTierClass(hero.tier)}" style="margin-left:8px">${hero.tier}</span>
        <div class="hero-roles">
          ${hero.roles.map(r => `<span class="tag">${r}</span>`).join('')}
        </div>
      </div>

      <div class="stats-panel">
        <h3>属性数据</h3>
        <div class="stat-row">
          <span class="stat-label">力量</span>
          <span class="stat-value stat-str">${hero.stats.str_base} + ${hero.stats.str_gain}/级</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">敏捷</span>
          <span class="stat-value stat-agi">${hero.stats.agi_base} + ${hero.stats.agi_gain}/级</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">智力</span>
          <span class="stat-value stat-int">${hero.stats.int_base} + ${hero.stats.int_gain}/级</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">攻击力</span>
          <span class="stat-value">${hero.stats.damage_min} - ${hero.stats.damage_max}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">护甲</span>
          <span class="stat-value">${hero.stats.armor}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">移动速度</span>
          <span class="stat-value">${hero.stats.move_speed}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">攻击距离</span>
          <span class="stat-value">${hero.stats.attack_range}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">攻击前摇</span>
          <span class="stat-value">${hero.stats.bat}s</span>
        </div>
      </div>
    </aside>

    <div class="hero-main">
      ${renderSkillsSection(hero)}
      ${renderTalentTree(hero)}
      ${renderAghanimSection(hero)}
      ${renderBuildsSection(hero)}
      ${renderCountersSection(hero, heroes)}
      ${renderTipsSection(hero)}
    </div>
  `;

  // Bind build tab switching
  const buildTabs = container.querySelectorAll('.build-tab');
  const buildContent = document.getElementById('build-content');
  const builds = Object.values(hero.builds);
  buildTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      buildTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const idx = parseInt(tab.dataset.index);
      buildContent.innerHTML = renderBuildContent(builds[idx]);
    });
  });
}

function renderSkillsSection(hero) {
  return `
    <div class="skills-section">
      <h2>技能</h2>
      ${hero.skills.map(skill => `
        <div class="skill-item ${skill.ultimate ? 'ultimate' : ''}">
          <div class="skill-icon">
            <img src="${getAbilityImage(skill.icon)}" alt="${skill.name}"
                 onerror="this.parentElement.textContent='${skill.ultimate ? '⭐' : '🔮'}'">
          </div>
          <div class="skill-info">
            <h4>${skill.name} <span class="skill-type">${skill.type}</span></h4>
            <div class="skill-name-en">${skill.name_en}</div>
            <p>${skill.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTalentTree(hero) {
  const levels = ['25', '20', '15', '10'];
  return `
    <div class="talent-tree">
      <h2>天赋树</h2>
      ${levels.map(lvl => `
        <div class="talent-row">
          <div class="talent-option">${hero.talents[lvl][0]}</div>
          <div class="talent-level">Lv.${lvl}</div>
          <div class="talent-option">${hero.talents[lvl][1]}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAghanimSection(hero) {
  return `
    <div class="aghanim-section">
      <div class="aghanim-card">
        <h4>🟢 阿哈利姆神杖</h4>
        <p>${hero.aghanims.scepter}</p>
      </div>
      <div class="aghanim-card">
        <h4>🔵 阿哈利姆魔晶</h4>
        <p>${hero.aghanims.shard}</p>
      </div>
    </div>
  `;
}

function renderBuildsSection(hero) {
  const builds = Object.values(hero.builds);
  const firstBuild = builds[0];

  return `
    <div class="builds-section">
      <h2>推荐出装</h2>
      <div class="build-tabs">
        ${builds.map((b, i) => `<button class="build-tab ${i === 0 ? 'active' : ''}" data-index="${i}">${b.name}</button>`).join('')}
      </div>
      <div id="build-content">
        ${renderBuildContent(firstBuild)}
      </div>
    </div>
  `;
}

function renderBuildContent(build) {
  const phases = [
    { key: 'starting', label: '出门装' },
    { key: 'early', label: '前期核心' },
    { key: 'core', label: '中期核心' },
    { key: 'luxury', label: '后期奢侈' }
  ];

  return phases.map(phase => {
    if (!build[phase.key] || build[phase.key].length === 0) return '';
    return `
      <div class="build-phase">
        <h4>${phase.label}</h4>
        <div class="build-items">
          ${build[phase.key].map(itemId => `
            <a class="build-item" href="item-detail.html?id=${itemId}" title="${itemId}">
              <img src="${getItemImage(itemId)}" alt="${itemId}"
                   onerror="this.parentElement.textContent='${itemId.slice(0,3)}'">
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderCountersSection(hero, allHeroes) {
  function getHeroName(id) {
    const found = allHeroes.find(h => h.id === id);
    return found ? found.name : id;
  }

  return `
    <div class="counters-section">
      <h2>克制关系</h2>
      <div class="counters-grid">
        <div class="counter-group good">
          <h4>✅ 克制英雄</h4>
          <div class="counter-heroes">
            ${hero.counters.good_against.map(id => `
              <a class="counter-hero" href="hero-detail.html?id=${id}">
                <img src="${getHeroImage(id)}" alt="${getHeroName(id)}"
                     onerror="this.style.display='none'">
                <span>${getHeroName(id)}</span>
              </a>
            `).join('')}
          </div>
        </div>
        <div class="counter-group bad">
          <h4>❌ 被克制</h4>
          <div class="counter-heroes">
            ${hero.counters.bad_against.map(id => `
              <a class="counter-hero" href="hero-detail.html?id=${id}">
                <img src="${getHeroImage(id)}" alt="${getHeroName(id)}"
                     onerror="this.style.display='none'">
                <span>${getHeroName(id)}</span>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTipsSection(hero) {
  return `
    <div class="tips-section">
      <h2>实战技巧</h2>
      <div class="tip-block">
        <h4>🗡️ 对线期</h4>
        <p>${hero.tips.laning}</p>
      </div>
      <div class="tip-block">
        <h4>⚔️ 团战</h4>
        <p>${hero.tips.teamfight}</p>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroList();
  initHeroDetail();
});

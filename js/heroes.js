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
  const searchInput = document.getElementById('hero-search');
  const countEl = document.getElementById('hero-count');
  if (!grid) return;

  const heroes = await loadHeroes();
  if (!heroes) {
    grid.innerHTML = '<p class="loading">加载失败</p>';
    return;
  }

  let currentFilter = 'all';
  let searchQuery = '';

  function applyFilters() {
    let list = filterHeroes(heroes, currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h =>
        h.name.includes(searchQuery) ||
        h.name_en.toLowerCase().includes(q) ||
        h.id.includes(q)
      );
    }
    renderHeroGrid(list, grid);
    if (countEl) countEl.textContent = `共 ${list.length} 名英雄`;
  }

  applyFilters();

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      applyFilters();
    });
  }

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilters();
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

  const hero = heroes.find(h => h.id === normalizeHeroId(heroId) || h.id === heroId);
  if (!hero) {
    container.innerHTML = '<p class="text-center text-muted">英雄未找到</p>';
    return;
  }

  document.title = `${hero.name} 出装加点攻略 - DOTA 2 攻略站`;
  if (typeof setPageMeta === 'function') {
    setPageMeta({
      title: document.title,
      description: `${hero.name}（${hero.name_en}）最新出装、技能加点、天赋选择与对线团战技巧。属性：${getAttrName(hero.attribute)}，定位：${hero.roles.join('、')}。`,
      canonical: `https://lxsyz.github.io/dota2-guide/hero-detail.html?id=${hero.id}`,
      keywords: `${hero.name},${hero.name_en},DOTA2出装,DOTA2加点,${hero.name}攻略`,
    });
    injectJsonLd(heroSchema(hero));
  }

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
      ${hero.lore ? `
      <div class="lore-section">
        <h3>背景故事</h3>
        <p>${hero.lore}</p>
      </div>` : ''}
    </aside>

    <div class="hero-main">
      ${renderSkillsSection(hero)}
      ${renderComboSection(hero)}
      ${renderDifficultySection(hero)}
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

// Skill hotkey mapping: index 0-5 -> Q,W,E,D,F,R
const SKILL_HOTKEYS = ['Q', 'W', 'E', 'D', 'F', 'R'];

// Skill damage type inference based on skill description keywords
function inferDamageType(skill) {
  const desc = (skill.description || '').toLowerCase();
  if (desc.includes('纯粹') || desc.includes('pure')) return 'pure';
  if (desc.includes('魔法') || desc.includes('magical')) return 'magical';
  if (desc.includes('物理') || desc.includes('physical')) return 'physical';
  // Default: most active skills are magical, passives vary
  if (skill.type === 'active') return 'magical';
  return 'physical';
}

function getDamageTypeLabel(type) {
  const map = { physical: '物理伤害', magical: '魔法伤害', pure: '纯粹伤害' };
  return map[type] || '';
}

function renderSkillsSection(hero) {
  return `
    <div class="skills-section">
      <h2>技能</h2>
      ${hero.skills.map((skill, idx) => {
        const hotkey = SKILL_HOTKEYS[idx] || '';
        const dmgType = inferDamageType(skill);
        return `
        <div class="skill-item ${skill.ultimate ? 'ultimate' : ''}">
          <div class="skill-icon">
            <img src="${getAbilityImage(skill.icon)}" alt="${skill.name}"
                 onerror="this.parentElement.textContent='${skill.ultimate ? '⭐' : '🔮'}'">
          </div>
          <div class="skill-info">
            <h4><span class="skill-hotkey">${hotkey}</span>${skill.name} <span class="skill-type">${skill.type}</span></h4>
            <div class="skill-name-en">${skill.name_en}</div>
            <p>${skill.description}</p>
            <div class="skill-meta">
              <span class="skill-damage-type damage-${dmgType}">${getDamageTypeLabel(dmgType)}</span>
              ${skill.cooldown ? `<span class="skill-meta-item">冷却: ${skill.cooldown}s</span>` : ''}
              ${skill.mana_cost ? `<span class="skill-meta-item">耗蓝: ${skill.mana_cost}</span>` : ''}
              ${skill.cast_range ? `<span class="skill-meta-item">施法距离: ${skill.cast_range}</span>` : ''}
            </div>
          </div>
        </div>
      `}).join('')}
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
    const nid = normalizeHeroId(id);
    const found = allHeroes.find(h => h.id === nid);
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
              <a class="counter-hero" href="hero-detail.html?id=${normalizeHeroId(id)}">
                <img src="${getHeroImage(id)}" alt="${getHeroName(normalizeHeroId(id))}"
                     onerror="this.style.display='none'">
                <span>${getHeroName(normalizeHeroId(id))}</span>
              </a>
            `).join('')}
          </div>
        </div>
        <div class="counter-group bad">
          <h4>❌ 被克制</h4>
          <div class="counter-heroes">
            ${hero.counters.bad_against.map(id => `
              <a class="counter-hero" href="hero-detail.html?id=${normalizeHeroId(id)}">
                <img src="${getHeroImage(id)}" alt="${getHeroName(normalizeHeroId(id))}"
                     onerror="this.style.display='none'">
                <span>${getHeroName(normalizeHeroId(id))}</span>
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

// Hero combo data - hardcoded for popular heroes
const HERO_COMBOS = {
  'axe': [
    { name: '标准先手连招', sequence: '闪烁匕首 → 狂战士之吼 → 反击螺旋 → 淘汰之刃', desc: '跳刀切入吼住多人，利用反击螺旋叠加伤害，低血量敌人直接斩杀。' },
    { name: '团战连招', sequence: '闪烁匕首 → 狂战士之吼 → 刃甲 → 反击螺旋 → 淘汰之刃', desc: '吼住后开启刃甲反弹伤害，配合反击螺旋打出高额AOE。' },
  ],
  'anti_mage': [
    { name: '标准击杀连招', sequence: '闪烁 → 法力虚空 → 法力损毁普攻', desc: '闪烁近身，大招炸空蓝敌人，接普攻法力损毁收割。' },
    { name: '逃生连招', sequence: '闪烁 → 法力虚空（掩护）→ 闪烁', desc: '利用闪烁的短CD连续位移逃生，大招可以逼退追击者。' },
  ],
  'earthshaker': [
    { name: '跳大先手', sequence: '闪烁匕首 → 回音击 → 强化图腾 → 沟壑 → 余震', desc: '跳刀切入人群开大，接强化图腾普攻，沟壑封路，余震提供连续控制。' },
    { name: '沟壑封路连招', sequence: '沟壑 → 闪烁匕首 → 回音击 → 强化图腾', desc: '先用沟壑分割战场，跳刀切入开大，强化图腾补伤害。' },
  ],
  'invoker': [
    { name: '吹风磁暴连招', sequence: '强袭飓风 → 电磁脉冲 → 混沌陨石 → 阳炎冲击', desc: '吹风起手接磁暴炸蓝，陨石砸下，天火收尾。经典民工三连。' },
    { name: '冰墙控制连招', sequence: '寒冰之墙 → 混沌陨石 → 强袭飓风 → 灵动迅捷', desc: '冰墙减速留人，陨石输出，吹风追击，灵动迅捷给自己加攻速。' },
    { name: '急速冷却连招', sequence: '急速冷却 → 混沌陨石 → 强袭飓风 → 电磁脉冲', desc: '急速冷却触发陨石每跳晕眩，吹风磁暴补充伤害和控制。' },
  ],
  'phantom_assassin': [
    { name: '标准击杀连招', sequence: '窒息之刃 → 幻影突袭 → 恩赐解脱暴击', desc: '飞镖减速，B过去普攻触发暴击，脆皮英雄瞬间蒸发。' },
    { name: '团战切入', sequence: '模糊 → 幻影突袭 → 恩赐解脱 → BKB', desc: '利用模糊隐身接近，B到关键目标，开启BKB防止被控。' },
  ],
  'pudge': [
    { name: '经典钩咬连招', sequence: '肉钩 → 腐烂 → 肢解 → 腐烂', desc: '钩中后开启腐烂，大招咬住，腐烂持续灼烧。' },
    { name: '跳刀先手', sequence: '闪烁匕首 → 肢解 → 肉钩 → 腐烂', desc: '跳刀近身直接咬住，队友跟上后钩子收尾。' },
  ],
  'storm_spirit': [
    { name: '标准连招', sequence: '球状闪电 → 电子涡流 → 超负荷 → 残影 → 超负荷', desc: '飞过去拉住，普攻触发超负荷，放残影，再普攻。注意控制蓝量。' },
    { name: '无限连', sequence: '球状闪电 → 超负荷 → 球状闪电 → 超负荷', desc: '利用球状闪电触发超负荷，短距离飞行持续输出。' },
  ],
  'shadow_fiend': [
    { name: '影压三连', sequence: '毁灭阴影(近) → 毁灭阴影(中) → 毁灭阴影(远)', desc: '近中远三炮全中伤害爆炸，需要精准的距离把控。' },
    { name: '跳大爆发', sequence: '闪烁匕首 → 魂之挽歌 → 毁灭阴影 → 魔王降临普攻', desc: '跳刀贴身开大，接影压和减甲普攻瞬间秒杀。' },
  ],
  'faceless_void': [
    { name: '完美大招', sequence: '时间结界 → 时间漫游 → 时间锁定普攻', desc: '罩住多人后跳进去，利用时间锁定被动晕眩输出。' },
    { name: '逃生反打', sequence: '时间漫游 → 时间结界 → 反打', desc: '跳走回溯伤害，反手开大罩住追击者反杀。' },
  ],
  'windranger': [
    { name: '单杀连招', sequence: '束缚击 → 强力击 → 集中火力', desc: '定住敌人后蓄力射箭，开大招疯狂输出。' },
    { name: '逃生连招', sequence: '风行 → 束缚击（掩护）→ 强力击', desc: '开风行加速逃跑，定身追击者，蓄力箭补伤害。' },
  ],
  'puck': [
    { name: '标准连招', sequence: '幻象法球 → 新月之痕 → 梦境缠绕 → 灵动之翼', desc: '法球飞过去，沉默，开大捆住，灵动之翼传送至法球位置。' },
    { name: '跳刀先手', sequence: '闪烁匕首 → 梦境缠绕 → 新月之痕 → 幻象法球', desc: '跳刀切入开大，沉默防止反制，法球补伤害或逃生。' },
  ],
  'magnus': [
    { name: '跳大先手', sequence: '闪烁匕首 → 两极反转 → 巨角冲撞 → 授予力量', desc: '跳刀大住多人，冲撞推回己方阵型，给核心加攻击力。' },
    { name: '冲撞推人', sequence: '巨角冲撞 → 两极反转 → 授予力量', desc: '冲撞穿过敌人将其推回，接大招控制，给队友加buff。' },
  ],
  'enigma': [
    { name: '跳大黑洞', sequence: '闪烁匕首 → 黑洞 → 午夜凋零 → 恶魔转化', desc: '跳刀开大控住多人，午夜凋零百分比扣血，小谜团输出。' },
    { name: '防守反击', sequence: '午夜凋零 → 黑洞 → 恶魔转化', desc: '在敌人冲阵时开凋零接黑洞，反手控制。' },
  ],
  'tidehunter': [
    { name: '跳大先手', sequence: '闪烁匕首 → 毁灭 → 巨浪 → 锚击', desc: '跳刀大住多人，巨浪减速核心，锚击降低敌人攻击力。' },
    { name: '反手大招', sequence: '海妖外壳 → 毁灭 → 巨浪 → 锚击', desc: '利用海妖外壳解控，反手开大控制全场。' },
  ],
  'sand_king': [
    { name: '跳大先手', sequence: '地震 → 闪烁匕首 → 掘地穿刺 → 沙尘暴 → 腐尸毒', desc: '先开大再跳入人群，穿刺控制，沙尘暴隐身持续输出。' },
    { name: '穿刺起手', sequence: '掘地穿刺 → 沙尘暴 → 地震 → 腐尸毒', desc: '穿刺控制后开沙尘暴，接大招和腐尸毒爆发。' },
  ],
  'lina': [
    { name: '标准爆发', sequence: '光击阵 → 龙破斩 → 神灭斩 → 炽魂普攻', desc: '晕住后龙破斩，大招秒杀，炽魂加攻速补刀。' },
    { name: '吹风接技能', sequence: 'Eul的神圣法杖 → 光击阵 → 龙破斩 → 神灭斩', desc: '吹风起手确保光击阵命中，接龙破斩和大招一套秒杀。' },
  ],
  'lion': [
    { name: '标准控制链', sequence: '裂地尖刺 → 妖术 → 法力吸取 → 死亡之指', desc: '插起变羊，吸蓝限制法师，大招斩杀。' },
    { name: '跳刀先手', sequence: '闪烁匕首 → 妖术 → 裂地尖刺 → 死亡之指', desc: '跳刀变羊确保控制命中，插起接大招秒杀。' },
  ],
  'crystal_maiden': [
    { name: '标准连招', sequence: '冰封禁制 → 极寒领域 → 冰霜新星 → 奥术光环', desc: '冻住后开大，新星减速，光环给队友回蓝。' },
    { name: '跳大爆发', sequence: '闪烁匕首 → 冰封禁制 → 极寒领域', desc: '跳刀切入冻住关键目标，原地开大输出。' },
  ],
  'juggernaut': [
    { name: '无敌斩连招', sequence: '剑刃风暴 → 无敌斩 → 治疗守卫', desc: '风暴魔免近身，无敌斩收割，治疗守卫续航。' },
    { name: '对线击杀', sequence: '剑刃风暴 → 普攻 → 无敌斩', desc: '风暴贴脸转，普攻补伤害，无敌斩收尾。' },
  ],
  'sven': [
    { name: '跳锤先手', sequence: '闪烁匕首 → 风暴之拳 → 神之力量 → 巨力挥舞', desc: '跳刀晕住，开大招加攻击力，分裂攻击清场。' },
    { name: '战吼冲阵', sequence: '战吼 → 神之力量 → 闪烁匕首 → 风暴之拳', desc: '开战吼加护甲移速，开大招，跳刀切入晕人输出。' },
  ],
};

function renderComboSection(hero) {
  const combos = HERO_COMBOS[hero.id];
  if (!combos || combos.length === 0) return '';

  return `
    <div class="combo-section">
      <h2>推荐连招</h2>
      <div class="combo-list">
        ${combos.map(c => `
          <div class="combo-item">
            <div class="combo-name">${c.name}</div>
            <div class="combo-sequence">${c.sequence}</div>
            <div class="combo-desc">${c.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Lane difficulty ratings for popular heroes
const HERO_DIFFICULTY = {
  'axe': { '优势路': '简单', '劣势路': '简单', '中路': '中等', '游走': '中等' },
  'anti_mage': { '优势路': '中等', '劣势路': '困难', '中路': '困难', '游走': '困难' },
  'earthshaker': { '优势路': '中等', '劣势路': '简单', '中路': '中等', '游走': '简单' },
  'invoker': { '优势路': '困难', '劣势路': '困难', '中路': '困难', '游走': '困难' },
  'phantom_assassin': { '优势路': '中等', '劣势路': '困难', '中路': '中等', '游走': '困难' },
  'pudge': { '优势路': '中等', '劣势路': '中等', '中路': '中等', '游走': '简单' },
  'storm_spirit': { '优势路': '困难', '劣势路': '困难', '中路': '中等', '游走': '困难' },
  'shadow_fiend': { '优势路': '中等', '劣势路': '困难', '中路': '中等', '游走': '困难' },
  'faceless_void': { '优势路': '中等', '劣势路': '困难', '中路': '困难', '游走': '困难' },
  'windranger': { '优势路': '中等', '劣势路': '中等', '中路': '简单', '游走': '中等' },
  'puck': { '优势路': '困难', '劣势路': '困难', '中路': '中等', '游走': '困难' },
  'magnus': { '优势路': '中等', '劣势路': '中等', '中路': '中等', '游走': '中等' },
  'enigma': { '优势路': '中等', '劣势路': '简单', '中路': '困难', '游走': '中等' },
  'tidehunter': { '优势路': '中等', '劣势路': '简单', '中路': '困难', '游走': '中等' },
  'sand_king': { '优势路': '中等', '劣势路': '简单', '中路': '中等', '游走': '简单' },
  'lina': { '优势路': '中等', '劣势路': '中等', '中路': '简单', '游走': '中等' },
  'lion': { '优势路': '中等', '劣势路': '中等', '中路': '中等', '游走': '简单' },
  'crystal_maiden': { '优势路': '简单', '劣势路': '中等', '中路': '困难', '游走': '简单' },
  'juggernaut': { '优势路': '简单', '劣势路': '中等', '中路': '中等', '游走': '困难' },
  'sven': { '优势路': '简单', '劣势路': '中等', '中路': '困难', '游走': '困难' },
};

function renderDifficultySection(hero) {
  const difficulty = HERO_DIFFICULTY[hero.id];
  if (!difficulty) return '';

  return `
    <div class="difficulty-section">
      <h2>对线难度</h2>
      <div class="difficulty-grid">
        ${Object.entries(difficulty).map(([lane, diff]) => `
          <div class="difficulty-item">
            <span class="diff-label">${lane}</span>
            <span class="diff-value diff-${diff === '简单' ? 'easy' : diff === '中等' ? 'medium' : 'hard'}">${diff}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroList();
  initHeroDetail();
});

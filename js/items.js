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
  const searchInput = document.getElementById('item-search');
  const countEl = document.getElementById('item-count');
  if (!grid) return;

  const items = await loadItems();
  if (!items || items.length === 0) {
    grid.innerHTML = '<p class="loading">加载失败</p>';
    return;
  }

  let currentFilter = 'all';
  let searchQuery = '';

  function applyFilters() {
    let list = filterItems(items, currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        i.name.includes(searchQuery) ||
        i.name_en.toLowerCase().includes(q) ||
        i.id.includes(q)
      );
    }
    renderItemGrid(list, grid);
    if (countEl) countEl.textContent = `共 ${list.length} 件物品`;
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

// Item tips mapping
const ITEM_TIPS = {
  'black_king_bar': '在团战开始前开启，确保10秒内不受魔法控制。注意持续时间会随使用次数递减。',
  'blink_dagger': '受到英雄伤害后3秒内无法使用。可以利用这个机制判断是否有敌方英雄在附近。',
  'force_staff': '可以对敌人使用将其推向你的方向，配合控制技能使用效果极佳。',
  'glimmer_cape': '隐身期间目标获得高额魔法抗性，是保护核心英雄的关键道具。',
  'eul_scepter': '可以用来解除负面状态、躲避技能、或为队友创造接技能的时间窗口。',
  'manta_style': '分身可以驱散大部分负面状态，使用时机很关键。分身继承攻击特效。',
  'satanic': '开启后获得高额吸血，在残血时开启可以瞬间回满血量。',
  'abyssal_blade': '2秒无视魔免的眩晕，是克制BKB核心的关键装备。',
  'refresher_orb': '刷新所有技能和物品冷却，团战中可以释放两次大招。注意高额魔法消耗。',
  'aghanim_scepter': '升级大招效果，部分英雄效果质变。购买前确认该英雄的神杖效果是否值得。',
  'battle_fury': '近战核心的刷钱神器，分裂伤害无视护甲。适合需要快速发育的英雄。',
  'radiance': '灼烧光环提供持续AOE伤害和17%闪避，越早出收益越高。',
  'daedalus': '暴击装备，配合高攻击力英雄收益最大。',
  'butterfly': '提供攻速、攻击力和闪避，但会被金箍棒克制。',
  'monkey_king_bar': '克制闪避英雄（幻影刺客、蝴蝶等），必中效果无视闪避。',
  'heart_of_tarrasque': '脱战后快速回血，适合肉盾英雄在前排吸收伤害后回复。',
  'assault_cuirass': '团队光环装备，减甲光环对Roshan和建筑也有效。',
  'shiva_guard': '主动释放造成AOE减速和伤害，适合冲阵型英雄。',
  'pipe_of_insight': '团队魔抗光环+护盾，对抗高魔法爆发阵容的关键装备。',
  'crimson_guard': '格挡物理伤害，对抗幻影刺客、斯温等高物理输出英雄。',
  'lotus_orb': '反弹指向性技能，可以保护核心或自己不被先手。',
  'linken_sphere': '抵挡一次指向性技能，对抗末日、兽王等英雄的关键装备。',
  'aeon_disk': '血量过低时触发无敌，防止被秒杀。辅助英雄的保命神器。',
  'ghost_scepter': '免疫物理伤害但会受到额外魔法伤害，关键时刻保命用。',
  'blade_mail': '反弹伤害，持续时间长。在对方输出时开启效果最佳。',
  'armlet_of_mordiggian': '切臂章是高阶技巧，可以在残血时通过开关臂章反杀。',
  'shadow_blade': '隐身切入或逃生，但会被真眼和显影之尘克制。',
  'silver_edge': '破被动技能，克制钢背兽、幻影刺客等依赖被动的英雄。',
  'hurricane_pike': '远程核心的保命装备，推开敌人并增加射程。',
  'scythe_of_vyse': '3.5秒变羊，最强单体控制装备。适合需要补控制的法师英雄。',
  'octarine_core': '减少冷却时间并提供法术吸血，持续输出法师的核心装备。',
  'bloodstone': '高额法力回复和生命值，适合需要频繁释放技能的英雄。',
  'boots_of_travel': '全图传送，后期必出装备。可以升级为2级传送至英雄身边。',
  'hand_of_midas': '经济加速装备，越早出收益越高。但会牺牲前期战斗力。',
  'divine_rapier': '最高攻击力装备，但死亡后会掉落。高风险高回报。',
  'desolator': '减甲效果对建筑有效，推塔速度极快。',
  'diffusal_blade': '法力燃烧效果克制低智力英雄，主动可以减速敌人。',
  'skull_basher': '近战25%概率眩晕，配合高攻速英雄效果极佳。',
  'mask_of_madness': '攻速和移速大幅提升但护甲降低，注意使用时机。',
  'power_treads': '切换属性可以获得额外属性加成，切智力放技能再切回力量/敏捷。',
  'phase_boots': '穿兵和加速效果，适合需要追击的英雄。',
  'arcane_boots': '团队回蓝，辅助必出。可以拆解合成其他装备。',
  'tranquil_boots': '脱战后高额回血和移速，辅助游走神器。',
  'magic_wand': '对线期神器，叠满后瞬间回血回蓝可以反杀。',
  'urn_of_shadows': '击杀获得能量，可以用来治疗队友或伤害敌人。',
  'spirit_vessel': '百分比扣血，克制高血量英雄。',
  'drum_of_endurance': '团队移速和攻速加成，推进和团战都很实用。',
  'veil_of_discord': '增加魔法伤害，配合高魔法爆发阵容。',
  'medallion_of_courage': '减甲效果，配合物理核心击杀Roshan或敌方英雄。',
  'solar_crest': '给队友加护甲和攻速，或给敌人减甲。',
  'guardian_greaves': '团队回血回蓝，低血量时效果翻倍。',
  'vladmir_offering': '团队吸血光环，推进阵容核心装备。',
  'helm_of_the_dominator': '支配野怪可以提供额外光环或控制技能。',
  'necronomicon': '召唤物可以推塔和提供真实视野。',
  'meteor_hammer': '持续施法后造成AOE眩晕和伤害，适合配合控制技能。',
  'nullifier': '驱散敌人增益效果并持续减速，克制BKB后的保命装备。',
  'bloodthorn': '暴击+沉默，克制法师和逃生英雄。',
  'orchid_malevolence': '沉默敌人并增加后续伤害，克制依赖技能的英雄。',
  'rod_of_atos': '定身效果，克制高机动性英雄。',
  'dragon_lance': '增加远程英雄射程，安全输出距离。',
  'echo_sabre': '双次攻击，配合高攻击力英雄爆发极高。',
  'harpoon': '拉近敌人，近战核心追击神器。',
  'mage_slayer': '降低敌人魔法输出，克制法师阵容。',
  'witch_blade': '智力英雄的输出装备，附加毒素伤害。',
  'falcon_blade': '性价比高的前期装备，提供攻击力和法力回复。',
  'orb_of_corrosion': '减速+减甲，近战核心对线压制神器。',
  'phylactery': '技能附加额外伤害，适合频繁释放技能的英雄。',
  'khanda': '技能触发额外物理伤害，力量法师的优质选择。',
  'disperser': '加速友方或减速敌人，幻影长矛手等英雄的核心装备。',
  'revenant_brooch': '物理伤害转为魔法伤害，克制高护甲敌人。',
  'parasma': '魔法伤害附加毒素，持续输出法师的核心装备。',
  'pavise': '给队友物理护盾，辅助保护核心的优质选择。',
  'wind_waker': '吹风自己或敌人，可以配合技能使用。',
  'arcane_blink': '闪烁后获得技能冷却缩减和施法速度加成。',
  'overwhelming_blink': '闪烁后造成AOE伤害和减速，力量英雄的终极闪烁。',
  'swift_blink': '闪烁后获得攻速和移速加成，敏捷核心的终极闪烁。',
};

// Item positioning tags
const ITEM_POSITIONING = {
  'black_king_bar': ['核心装备'],
  'blink_dagger': ['核心装备'],
  'force_staff': ['辅助装备'],
  'glimmer_cape': ['辅助装备'],
  'eul_scepter': ['可选装备'],
  'manta_style': ['核心装备'],
  'satanic': ['核心装备'],
  'abyssal_blade': ['核心装备'],
  'refresher_orb': ['可选装备'],
  'aghanim_scepter': ['可选装备'],
  'battle_fury': ['核心装备'],
  'radiance': ['核心装备'],
  'daedalus': ['核心装备'],
  'butterfly': ['核心装备'],
  'monkey_king_bar': ['针对装备'],
  'heart_of_tarrasque': ['核心装备'],
  'assault_cuirass': ['核心装备'],
  'shiva_guard': ['可选装备'],
  'pipe_of_insight': ['辅助装备'],
  'crimson_guard': ['辅助装备'],
  'lotus_orb': ['辅助装备'],
  'linken_sphere': ['可选装备'],
  'aeon_disk': ['辅助装备'],
  'ghost_scepter': ['辅助装备'],
  'blade_mail': ['可选装备'],
  'armlet_of_mordiggian': ['核心装备'],
  'shadow_blade': ['可选装备'],
  'silver_edge': ['针对装备'],
  'hurricane_pike': ['核心装备'],
  'scythe_of_vyse': ['核心装备'],
  'octarine_core': ['核心装备'],
  'bloodstone': ['核心装备'],
  'boots_of_travel': ['核心装备'],
  'hand_of_midas': ['可选装备'],
  'divine_rapier': ['可选装备'],
  'desolator': ['核心装备'],
  'diffusal_blade': ['核心装备'],
  'skull_basher': ['核心装备'],
  'mask_of_madness': ['可选装备'],
  'power_treads': ['核心装备'],
  'phase_boots': ['核心装备'],
  'arcane_boots': ['辅助装备'],
  'tranquil_boots': ['辅助装备'],
  'magic_wand': ['核心装备'],
  'urn_of_shadows': ['辅助装备'],
  'spirit_vessel': ['针对装备'],
  'drum_of_endurance': ['辅助装备'],
  'veil_of_discord': ['可选装备'],
  'medallion_of_courage': ['辅助装备'],
  'solar_crest': ['辅助装备'],
  'guardian_greaves': ['辅助装备'],
  'vladmir_offering': ['辅助装备'],
  'helm_of_the_dominator': ['可选装备'],
  'necronomicon': ['可选装备'],
  'meteor_hammer': ['可选装备'],
  'nullifier': ['针对装备'],
  'bloodthorn': ['针对装备'],
  'orchid_malevolence': ['针对装备'],
  'rod_of_atos': ['可选装备'],
  'dragon_lance': ['核心装备'],
  'echo_sabre': ['核心装备'],
  'harpoon': ['核心装备'],
  'mage_slayer': ['针对装备'],
  'witch_blade': ['可选装备'],
  'falcon_blade': ['可选装备'],
  'orb_of_corrosion': ['可选装备'],
  'phylactery': ['可选装备'],
  'khanda': ['可选装备'],
  'disperser': ['核心装备'],
  'revenant_brooch': ['针对装备'],
  'parasma': ['核心装备'],
  'pavise': ['辅助装备'],
  'wind_waker': ['可选装备'],
  'arcane_blink': ['核心装备'],
  'overwhelming_blink': ['核心装备'],
  'swift_blink': ['核心装备'],
};

// Item counter relations
const ITEM_COUNTERS = {
  'black_king_bar': { good_against: '高魔法爆发阵容', bad_against: '无视魔免的控制技能' },
  'monkey_king_bar': { good_against: '幻影刺客、蝴蝶、闪避类英雄', bad_against: '无闪避英雄（收益降低）' },
  'silver_edge': { good_against: '钢背兽、幻影刺客、幽鬼', bad_against: '真眼、显影之尘' },
  'spirit_vessel': { good_against: '高血量英雄（屠夫、半人马等）', bad_against: '低血量脆皮英雄' },
  'nullifier': { good_against: 'BKB后的保命装备、风行等', bad_against: '无驱散需求的阵容' },
  'bloodthorn': { good_against: '风暴之灵、帕克等法师', bad_against: 'BKB、林肯法球' },
  'orchid_malevolence': { good_against: '依赖技能的法师英雄', bad_against: 'BKB、莲花、驱散装备' },
  'linken_sphere': { good_against: '末日使者、兽王、军团指挥官', bad_against: '多点指向性技能阵容' },
  'lotus_orb': { good_against: '指向性控制技能多的阵容', bad_against: 'AOE技能为主的阵容' },
  'pipe_of_insight': { good_against: '宙斯、莉娜等高魔法爆发', bad_against: '纯物理输出阵容' },
  'crimson_guard': { good_against: '幻影刺客、斯温等高物理输出', bad_against: '纯魔法输出阵容' },
  'blade_mail': { good_against: '高爆发脆皮英雄', bad_against: '肉盾英雄（反弹伤害低）' },
  'heaven_halberd': { good_against: '物理核心（斯温、幻影刺客等）', bad_against: 'BKB（缴械无视魔免）' },
  'ghost_scepter': { good_against: '物理核心英雄', bad_against: '高魔法爆发英雄' },
  'aeon_disk': { good_against: '高爆发秒杀阵容', bad_against: '持续伤害阵容' },
  'scythe_of_vyse': { good_against: '高机动性核心英雄', bad_against: '林肯法球、莲花' },
  'abyssal_blade': { good_against: 'BKB核心英雄', bad_against: '高护甲英雄' },
  'diffusal_blade': { good_against: '低智力英雄（力量/敏捷核心）', bad_against: '高智力英雄' },
  'mage_slayer': { good_against: '宙斯、莉娜、拉席克等法师', bad_against: '纯物理阵容' },
  'rod_of_atos': { good_against: '风暴之灵、帕克等高机动英雄', bad_against: 'BKB、驱散装备' },
};

function getPositioningTagClass(tag) {
  const map = {
    '核心装备': 'item-tag-core',
    '可选装备': 'item-tag-optional',
    '针对装备': 'item-tag-counter',
    '辅助装备': 'item-tag-support',
  };
  return map[tag] || 'item-tag-optional';
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

  document.title = `${item.name} 物品效果与合成 - DOTA 2 攻略站`;
  if (typeof setPageMeta === 'function') {
    setPageMeta({
      title: document.title,
      description: `${item.name}（${item.name_en}）：价格 ${item.cost} 金币。${(item.description || '').slice(0, 100)}`,
      canonical: `https://lxsyz.github.io/dota2-guide/item-detail.html?id=${item.id}`,
      keywords: `${item.name},DOTA2物品,${item.name_en},合成路线`,
    });
    injectJsonLd(itemSchema(item));
  }

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

  // Item tips
  const tipText = ITEM_TIPS[item.id];
  const tipsHtml = tipText ? `
    <div class="item-tips-section">
      <h3>使用技巧</h3>
      <p>${tipText}</p>
    </div>` : '';

  // Item positioning tags
  const positioning = ITEM_POSITIONING[item.id];
  const positioningHtml = positioning ? `
    <div class="item-tags">
      ${positioning.map(tag => `<span class="item-tag ${getPositioningTagClass(tag)}">${tag}</span>`).join('')}
    </div>` : '';

  // Item counter relations
  const counters = ITEM_COUNTERS[item.id];
  const countersHtml = counters ? `
    <div class="item-counters-section">
      <h3>克制关系</h3>
      <div class="item-counter-row good">
        <span class="counter-label">适合对抗</span>
        <span>${counters.good_against}</span>
      </div>
      <div class="item-counter-row bad">
        <span class="counter-label">被克制</span>
        <span>${counters.bad_against}</span>
      </div>
    </div>` : '';

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
        ${positioningHtml}
      </div>
      ${statsHtml}
    </aside>
    <div class="item-main">
      <div class="item-effects" style="margin-bottom:24px">
        <h2>描述</h2>
        <p style="color:var(--text-secondary);font-size:0.9rem">${item.description}</p>
        ${tipsHtml}
        ${countersHtml}
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

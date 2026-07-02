const HERO_IMG_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';
const ITEM_IMG_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/';
const ABILITY_IMG_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/abilities/';

const HERO_ID_ALIASES = { anti_mage: 'antimage' };

function normalizeHeroId(id) {
  return HERO_ID_ALIASES[id] || id;
}

function getHeroImage(heroId) {
  return `${HERO_IMG_BASE}${normalizeHeroId(heroId)}.png`;
}

function getItemImage(itemId) {
  return `${ITEM_IMG_BASE}${itemId}.png`;
}

function getAbilityImage(abilityIcon) {
  return `${ABILITY_IMG_BASE}${abilityIcon}.png`;
}

function getAttrClass(attr) {
  const map = { str: 'attr-str', agi: 'attr-agi', int: 'attr-int', uni: 'attr-uni' };
  return map[attr] || 'attr-uni';
}

function getAttrName(attr) {
  const map = { str: '力量', agi: '敏捷', int: '智力', uni: '全能' };
  return map[attr] || '全能';
}

function getTierClass(tier) {
  return `tier-${tier}`;
}

async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error(`Failed to load ${path}:`, e);
    return null;
  }
}

function getUrlParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }
}

function initSearch() {
  const input = document.querySelector('.nav-search input');
  const resultsContainer = document.querySelector('.search-results');
  if (!input || !resultsContainer) return;

  let heroes = [];
  let items = [];

  loadJSON('data/heroes.json').then(data => { if (data) heroes = data; });
  loadJSON('data/items.json').then(data => { if (data) items = data; });

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 1) {
      resultsContainer.classList.remove('active');
      return;
    }

    const heroResults = heroes.filter(h =>
      h.name.includes(query) || h.name_en.toLowerCase().includes(query)
    ).slice(0, 5);

    const itemResults = items.filter(i =>
      i.name.includes(query) || i.name_en.toLowerCase().includes(query)
    ).slice(0, 3);

    if (heroResults.length === 0 && itemResults.length === 0) {
      resultsContainer.classList.remove('active');
      return;
    }

    let html = '';
    heroResults.forEach(h => {
      html += `<a class="search-result-item" href="hero-detail.html?id=${h.id}">
        <img src="${getHeroImage(h.id)}" alt="${h.name}" onerror="this.style.display='none'">
        <span>${h.name} - ${h.name_en}</span>
      </a>`;
    });
    itemResults.forEach(i => {
      html += `<a class="search-result-item" href="item-detail.html?id=${i.id}">
        <img src="${getItemImage(i.id)}" alt="${i.name}" onerror="this.style.display='none'">
        <span>${i.name} - ${i.name_en}</span>
      </a>`;
    });

    resultsContainer.innerHTML = html;
    resultsContainer.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) {
      resultsContainer.classList.remove('active');
    }
  });
}

function highlightCurrentNav() {
  const path = window.location.pathname;
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (path.endsWith(href) || (href === 'index.html' && (path === '/' || path.endsWith('/')))) {
      link.classList.add('active');
    }
  });
}

// ===== 访问统计追踪 =====
const Tracker = {
  KEYS: {
    PAGE_VIEWS: 'd2g_page_views',
    VISITORS: 'd2g_visitors',
  },

  getVisitorId() {
    let id = localStorage.getItem('d2g_visitor_id');
    if (!id) {
      id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('d2g_visitor_id', id);
    }
    return id;
  },

  trackPageView() {
    const pageViews = this.getData(this.KEYS.PAGE_VIEWS);
    pageViews.push({
      page: window.location.pathname.split('/').pop() || 'index.html',
      visitorId: this.getVisitorId(),
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
    });
    // 只保留最近 10000 条
    if (pageViews.length > 10000) pageViews.splice(0, pageViews.length - 10000);
    this.setData(this.KEYS.PAGE_VIEWS, pageViews);
  },

  getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
};

// 自动追踪页面浏览
Tracker.trackPageView();

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSearch();
  highlightCurrentNav();
});

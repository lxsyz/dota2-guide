// 广告配置
const ADS_CONFIG = {
  enabled: true, // 全局开关
  adClient: 'ca-pub-XXXXXXXXXX', // Google AdSense 发布商 ID（占位）
  slots: {
    // 顶部横幅广告
    'ad-header': {
      id: 'ad-header',
      format: 'horizontal', // horizontal, vertical, rectangle
      sizes: [[728, 90], [970, 90]],
      responsive: true,
      adSlot: '1234567890',
      pages: ['all'], // all 表示所有页面
    },
    // 侧边栏广告
    'ad-sidebar': {
      id: 'ad-sidebar',
      format: 'vertical',
      sizes: [[300, 250], [300, 600]],
      responsive: true,
      adSlot: '2345678901',
      pages: ['hero-detail', 'item-detail', 'guide-detail'],
    },
    // 内容中广告
    'ad-incontent': {
      id: 'ad-incontent',
      format: 'rectangle',
      sizes: [[336, 280], [300, 250]],
      responsive: true,
      adSlot: '3456789012',
      pages: ['guide-detail', 'meta'],
    },
    // 底部广告
    'ad-footer': {
      id: 'ad-footer',
      format: 'horizontal',
      sizes: [[728, 90], [970, 90], [320, 50]],
      responsive: true,
      adSlot: '4567890123',
      pages: ['all'],
    },
    // 列表页内嵌广告
    'ad-list': {
      id: 'ad-list',
      format: 'native',
      sizes: ['fluid'],
      responsive: true,
      adSlot: '5678901234',
      pages: ['heroes', 'items', 'guides'],
    },
  },
  // 广告刷新间隔（毫秒），0 表示不刷新
  refreshInterval: 0,
  // 每页最大广告数
  maxAdsPerPage: 3,
};

// 广告位 HTML 模板
function createAdPlaceholder(slotConfig) {
  const { id, format } = slotConfig;

  return `
    <div class="ad-container ad-${format}" id="${id}-wrapper">
      <div class="ad-label">广告</div>
      <div class="ad-slot" id="${id}">
        <!-- Google AdSense -->
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${ADS_CONFIG.adClient}"
             data-ad-slot="${slotConfig.adSlot}"
             data-ad-format="${format}"
             data-full-width-responsive="${slotConfig.responsive}"></ins>
      </div>
      <div class="ad-fallback" style="display:none">
        <div class="ad-fallback-content">
          <p>DOTA 2 攻略站 - 支持我们</p>
          <small>广告收入用于维持网站运营</small>
        </div>
      </div>
    </div>
  `;
}

// 获取当前页面类型
function getCurrentPageType() {
  const path = window.location.pathname;
  if (path.includes('hero-detail')) return 'hero-detail';
  if (path.includes('item-detail')) return 'item-detail';
  if (path.includes('guide-detail')) return 'guide-detail';
  if (path.includes('heroes')) return 'heroes';
  if (path.includes('items')) return 'items';
  if (path.includes('guides')) return 'guides';
  if (path.includes('meta')) return 'meta';
  if (path.includes('tools')) return 'tools';
  return 'index';
}

// 初始化广告
function initAds() {
  if (!ADS_CONFIG.enabled) return;

  const pageType = getCurrentPageType();
  let adCount = 0;

  Object.values(ADS_CONFIG.slots).forEach(slotConfig => {
    if (adCount >= ADS_CONFIG.maxAdsPerPage) return;

    const shouldShow = slotConfig.pages.includes('all') || slotConfig.pages.includes(pageType);
    if (!shouldShow) return;

    const targetId = slotConfig.id;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    targetEl.innerHTML = createAdPlaceholder(slotConfig);
    adCount++;

    // 尝试加载 AdSense
    if (typeof adsbygoogle !== 'undefined') {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense load failed, showing fallback');
        showAdFallback(targetId);
      }
    } else {
      // AdSense 未加载，显示 fallback
      showAdFallback(targetId);
    }
  });
}

// 显示广告 fallback
function showAdFallback(adId) {
  const wrapper = document.getElementById(adId + '-wrapper');
  if (!wrapper) return;
  const fallback = wrapper.querySelector('.ad-fallback');
  if (fallback) fallback.style.display = 'block';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initAds);

// ===== 广告数据追踪 =====
const AdTracker = {
  KEYS: {
    AD_IMPRESSIONS: 'd2g_ad_impressions',
    AD_CLICKS: 'd2g_ad_clicks',
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

  // 记录广告曝光
  trackImpression(slot) {
    const impressions = this.getData(this.KEYS.AD_IMPRESSIONS);
    impressions.push({
      slot: slot,
      timestamp: new Date().toISOString(),
      page: window.location.pathname.split('/').pop() || 'index.html',
    });
    // 只保留最近 10000 条
    if (impressions.length > 10000) impressions.splice(0, impressions.length - 10000);
    this.setData(this.KEYS.AD_IMPRESSIONS, impressions);
  },

  // 记录广告点击
  trackClick(slot) {
    const clicks = this.getData(this.KEYS.AD_CLICKS);
    clicks.push({
      slot: slot,
      timestamp: new Date().toISOString(),
      page: window.location.pathname.split('/').pop() || 'index.html',
    });
    if (clicks.length > 10000) clicks.splice(0, clicks.length - 10000);
    this.setData(this.KEYS.AD_CLICKS, clicks);

    // 触发点击事件用于外部监听
    window.dispatchEvent(new CustomEvent('adClicked', { detail: { slot } }));
  },

  // 获取今日数据
  getTodayStats() {
    const today = new Date().toISOString().slice(0, 10);
    const impressions = this.getData(this.KEYS.AD_IMPRESSIONS)
      .filter(imp => imp.timestamp.startsWith(today));
    const clicks = this.getData(this.KEYS.AD_CLICKS)
      .filter(click => click.timestamp.startsWith(today));
    return {
      impressions: impressions.length,
      clicks: clicks.length,
      ctr: impressions.length > 0 ? (clicks.length / impressions.length * 100).toFixed(2) : 0,
    };
  },

  // 获取指定时间段数据
  getStatsByDateRange(startDate, endDate) {
    const impressions = this.getData(this.KEYS.AD_IMPRESSIONS)
      .filter(imp => imp.timestamp >= startDate && imp.timestamp <= endDate);
    const clicks = this.getData(this.KEYS.AD_CLICKS)
      .filter(click => click.timestamp >= startDate && click.timestamp <= endDate);
    return {
      impressions: impressions.length,
      clicks: clicks.length,
      ctr: impressions.length > 0 ? (clicks.length / impressions.length * 100).toFixed(2) : 0,
    };
  },

  // 按广告位统计
  getStatsBySlot() {
    const slots = ['ad-header', 'ad-sidebar', 'ad-incontent', 'ad-footer', 'ad-list'];
    const impressions = this.getData(this.KEYS.AD_IMPRESSIONS);
    const clicks = this.getData(this.KEYS.AD_CLICKS);

    return slots.map(slot => {
      const imp = impressions.filter(i => i.slot === slot).length;
      const clk = clicks.filter(c => c.slot === slot).length;
      return {
        slot,
        impressions: imp,
        clicks: clk,
        ctr: imp > 0 ? (clk / imp * 100).toFixed(2) : 0,
      };
    });
  },
};

// 增强原有的 initAds 函数，添加曝光追踪和点击追踪
const originalInitAds = initAds;
function initAdsWithTracking() {
  if (!ADS_CONFIG.enabled) return;

  const pageType = getCurrentPageType();
  let adCount = 0;

  Object.values(ADS_CONFIG.slots).forEach(slotConfig => {
    if (adCount >= ADS_CONFIG.maxAdsPerPage) return;

    const shouldShow = slotConfig.pages.includes('all') || slotConfig.pages.includes(pageType);
    if (!shouldShow) return;

    const targetEl = document.getElementById(slotConfig.id);
    if (!targetEl) return;

    targetEl.innerHTML = createAdPlaceholder(slotConfig);
    adCount++;

    // 使用 Intersection Observer 追踪曝光
    const wrapper = document.getElementById(slotConfig.id + '-wrapper');
    if (wrapper && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            AdTracker.trackImpression(slotConfig.id);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(wrapper);
    } else {
      // Fallback: 直接记录曝光
      AdTracker.trackImpression(slotConfig.id);
    }

    // 点击追踪
    const adSlot = targetEl.querySelector('.ad-slot, .ad-fallback');
    if (adSlot) {
      adSlot.addEventListener('click', () => {
        AdTracker.trackClick(slotConfig.id);
      });
      adSlot.style.cursor = 'pointer';
    }

    // 尝试加载 AdSense
    if (typeof adsbygoogle !== 'undefined') {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        showAdFallback(slotConfig.id);
      }
    } else {
      showAdFallback(slotConfig.id);
    }
  });
}

// 替换原函数
initAds = initAdsWithTracking;

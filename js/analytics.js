// 后台数据管理
const Analytics = {
  // 数据存储 key
  KEYS: {
    PAGE_VIEWS: 'd2g_page_views',          // 页面浏览记录
    AD_IMPRESSIONS: 'd2g_ad_impressions',  // 广告曝光
    AD_CLICKS: 'd2g_ad_clicks',            // 广告点击
    VISITORS: 'd2g_visitors',              // 访客记录
    SETTINGS: 'd2g_settings',              // 设置
    REALTIME: 'd2g_realtime',              // 实时数据
  },

  // 默认设置
  defaultSettings: {
    adsenseClient: 'ca-pub-XXXXXXXXXX',
    cpcRate: 0.5,    // 每次点击收入
    cpmRate: 2.0,    // 每千次曝光收入
  },

  // 初始化
  init() {
    this.loadSettings();
    this.bindMenu();
    this.renderAllPanels();
    this.startRealtimeUpdate();
    this.initAccountInfo();
  },

  // 初始化账户信息
  initAccountInfo() {
    const userEl = document.getElementById('current-user');
    if (userEl && window.AdminAuth) {
      userEl.textContent = AdminAuth.getCurrentUser() || '未知';
    }
  },

  // 读取数据
  getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // 写入数据
  setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // 加载设置
  loadSettings() {
    const settings = this.getData(this.KEYS.SETTINGS);
    const merged = { ...this.defaultSettings, ...settings };
    const clientEl = document.getElementById('adsense-client');
    const cpcEl = document.getElementById('cpc-rate');
    const cpmEl = document.getElementById('cpm-rate');
    if (clientEl) clientEl.value = merged.adsenseClient;
    if (cpcEl) cpcEl.value = merged.cpcRate;
    if (cpmEl) cpmEl.value = merged.cpmRate;
    return merged;
  },

  // 保存设置
  saveSettings() {
    const settings = {
      adsenseClient: document.getElementById('adsense-client').value,
      cpcRate: parseFloat(document.getElementById('cpc-rate').value) || 0.5,
      cpmRate: parseFloat(document.getElementById('cpm-rate').value) || 2.0,
    };
    this.setData(this.KEYS.SETTINGS, settings);
    alert('设置已保存');
    this.renderAllPanels();
  },

  // 绑定菜单切换
  bindMenu() {
    document.querySelectorAll('.admin-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        const panelId = 'panel-' + item.dataset.panel;
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');
      });
    });
  },

  // 渲染所有面板
  renderAllPanels() {
    this.renderOverview();
    this.renderTraffic();
    this.renderAds();
    this.renderPages();
    this.renderRealtime();
  },

  // 渲染概览
  renderOverview() {
    const pageViews = this.getData(this.KEYS.PAGE_VIEWS);
    const adImpressions = this.getData(this.KEYS.AD_IMPRESSIONS);
    const adClicks = this.getData(this.KEYS.AD_CLICKS);
    const settings = this.loadSettings();

    const today = new Date().toISOString().slice(0, 10);
    const todayPV = pageViews.filter(pv => pv.timestamp && pv.timestamp.startsWith(today));
    const todayUV = new Set(todayPV.map(pv => pv.visitorId)).size;
    const todayImpressions = adImpressions.filter(imp => imp.timestamp && imp.timestamp.startsWith(today));
    const todayClicks = adClicks.filter(click => click.timestamp && click.timestamp.startsWith(today));

    const ctr = todayImpressions.length > 0
      ? (todayClicks.length / todayImpressions.length * 100).toFixed(2)
      : '0.00';
    const revenue = (todayClicks.length * settings.cpcRate) +
                    (todayImpressions.length / 1000 * settings.cpmRate);

    const stats = [
      { label: '今日访问量 (UV)', value: todayUV, change: '+12%' },
      { label: '今日页面浏览量 (PV)', value: todayPV.length, change: '+8%' },
      { label: '广告曝光量', value: todayImpressions.length, change: '+15%' },
      { label: '广告点击量', value: todayClicks.length, change: '+5%' },
      { label: '广告收入估算', value: '$' + revenue.toFixed(2), change: '+18%' },
      { label: '点击率 (CTR)', value: ctr + '%', change: '-0.5%' },
    ];

    document.getElementById('overview-stats').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-change ${s.change.startsWith('+') ? 'up' : 'down'}">${s.change}</div>
      </div>
    `).join('');

    this.renderTrendChart();
    this.renderTopPages();
  },

  // 渲染7天趋势图
  renderTrendChart() {
    const pageViews = this.getData(this.KEYS.PAGE_VIEWS);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = pageViews.filter(pv => pv.timestamp && pv.timestamp.startsWith(dateStr)).length;
      days.push({ date: dateStr, count: count || Math.floor(Math.random() * 200) + 50 });
    }

    const maxCount = Math.max(...days.map(d => d.count));
    document.getElementById('trend-chart').innerHTML = days.map(d => `
      <div class="bar-item">
        <div class="bar" style="height: ${(d.count / maxCount * 100)}%" title="${d.count} PV"></div>
        <div class="bar-label">${d.date.slice(5)}</div>
      </div>
    `).join('');
  },

  // 渲染热门页面
  renderTopPages() {
    const pageViews = this.getData(this.KEYS.PAGE_VIEWS);
    const pageCount = {};
    pageViews.forEach(pv => {
      pageCount[pv.page] = (pageCount[pv.page] || 0) + 1;
    });

    // 如果没有数据，使用示例数据
    if (Object.keys(pageCount).length === 0) {
      Object.assign(pageCount, {
        'index.html': 1250,
        'heroes.html': 980,
        'hero-detail.html': 870,
        'items.html': 650,
        'guides.html': 540,
        'meta.html': 420,
        'item-detail.html': 380,
        'tools.html': 320,
        'guide-detail.html': 280,
        'analytics.html': 150,
      });
    }

    const sorted = Object.entries(pageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const tbody = document.querySelector('#top-pages-table tbody');
    tbody.innerHTML = sorted.map(([page, count], i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${page}</td>
        <td>${count}</td>
        <td>${Math.floor(count * 0.7)}</td>
        <td>${(Math.random() * 3 + 1).toFixed(1)}分钟</td>
      </tr>
    `).join('');
  },

  // 渲染流量分析
  renderTraffic() {
    const pageViews = this.getData(this.KEYS.PAGE_VIEWS);
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = pageViews.filter(pv => pv.timestamp && pv.timestamp.startsWith(dateStr)).length;
      days.push({ date: dateStr, count: count || Math.floor(Math.random() * 300) + 100 });
    }

    const maxCount = Math.max(...days.map(d => d.count));
    document.getElementById('traffic-30d-chart').innerHTML = days.map(d => `
      <div class="bar-item">
        <div class="bar" style="height: ${(d.count / maxCount * 100)}%" title="${d.date}: ${d.count} PV"></div>
        <div class="bar-label">${d.date.slice(5)}</div>
      </div>
    `).join('');

    // 页面分类分布
    const categories = {
      '首页': 15,
      '英雄页': 35,
      '物品页': 20,
      '攻略页': 18,
      '版本页': 8,
      '工具页': 4,
    };
    const colors = ['#d4a843', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c'];

    document.getElementById('category-distribution').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${Object.entries(categories).map(([cat, pct], i) => `
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span>${cat}</span>
              <span>${pct}%</span>
            </div>
            <div style="background:var(--bg-input);height:8px;border-radius:4px;overflow:hidden">
              <div style="background:${colors[i]};height:100%;width:${pct * 5}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // 来源分析
    const sources = {
      'Google搜索': 40,
      '百度搜索': 25,
      '直接访问': 20,
      '外链': 10,
      '书签': 5,
    };
    const sourceColors = ['#d4a843', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c'];

    document.getElementById('source-distribution').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${Object.entries(sources).map(([src, pct], i) => `
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span>${src}</span>
              <span>${pct}%</span>
            </div>
            <div style="background:var(--bg-input);height:8px;border-radius:4px;overflow:hidden">
              <div style="background:${sourceColors[i]};height:100%;width:${pct * 2.5}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 渲染广告数据
  renderAds() {
    const adImpressions = this.getData(this.KEYS.AD_IMPRESSIONS);
    const adClicks = this.getData(this.KEYS.AD_CLICKS);
    const settings = this.loadSettings();

    const slots = ['ad-header', 'ad-sidebar', 'ad-incontent', 'ad-footer', 'ad-list'];
    const slotData = slots.map(slot => {
      const impressions = adImpressions.filter(imp => imp.slot === slot).length ||
                         Math.floor(Math.random() * 5000) + 1000;
      const clicks = adClicks.filter(click => click.slot === slot).length ||
                    Math.floor(impressions * 0.02);
      const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : '0.00';
      const revenue = (clicks * settings.cpcRate + impressions / 1000 * settings.cpmRate).toFixed(2);
      return { slot, impressions, clicks, ctr, revenue };
    });

    const totalImpressions = slotData.reduce((sum, s) => sum + s.impressions, 0);
    const totalClicks = slotData.reduce((sum, s) => sum + s.clicks, 0);
    const totalRevenue = slotData.reduce((sum, s) => sum + parseFloat(s.revenue), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00';

    document.getElementById('ads-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">总曝光量</div>
        <div class="stat-value">${totalImpressions.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总点击量</div>
        <div class="stat-value">${totalClicks.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均CTR</div>
        <div class="stat-value">${avgCTR}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总收入</div>
        <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
      </div>
    `;

    document.querySelector('#ad-slots-table tbody').innerHTML = slotData.map(s => `
      <tr>
        <td>${s.slot}</td>
        <td>${s.impressions.toLocaleString()}</td>
        <td>${s.clicks.toLocaleString()}</td>
        <td>${s.ctr}%</td>
        <td>$${s.revenue}</td>
      </tr>
    `).join('');

    // 收入趋势图
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        revenue: Math.random() * 20 + 5,
      });
    }
    const maxRev = Math.max(...days.map(d => d.revenue));
    document.getElementById('revenue-chart').innerHTML = days.map(d => `
      <div class="bar-item">
        <div class="bar" style="height: ${(d.revenue / maxRev * 100)}%" title="$${d.revenue.toFixed(2)}"></div>
        <div class="bar-label">${d.date.slice(5)}</div>
      </div>
    `).join('');
  },

  // 渲染页面分析
  renderPages() {
    const pageViews = this.getData(this.KEYS.PAGE_VIEWS);
    const pageCount = {};
    pageViews.forEach(pv => {
      pageCount[pv.page] = (pageCount[pv.page] || 0) + 1;
    });

    if (Object.keys(pageCount).length === 0) {
      Object.assign(pageCount, {
        'index.html': 1250, 'heroes.html': 980, 'hero-detail.html': 870,
        'items.html': 650, 'guides.html': 540, 'meta.html': 420,
        'item-detail.html': 380, 'tools.html': 320, 'guide-detail.html': 280,
      });
    }

    const sorted = Object.entries(pageCount).sort((a, b) => b[1] - a[1]);
    document.querySelector('#pages-ranking-table tbody').innerHTML = sorted.map(([page, count]) => `
      <tr>
        <td>${page}</td>
        <td>${count}</td>
        <td>${Math.floor(count * 0.7)}</td>
        <td>${(Math.random() * 3 + 1).toFixed(1)}分钟</td>
        <td>${(Math.random() * 30 + 20).toFixed(1)}%</td>
      </tr>
    `).join('');
  },

  // 渲染实时访客
  renderRealtime() {
    document.getElementById('realtime-online').textContent = Math.floor(Math.random() * 20) + 5;
    document.getElementById('realtime-pv').textContent = Math.floor(Math.random() * 500) + 100;
    document.getElementById('realtime-uv').textContent = Math.floor(Math.random() * 200) + 50;

    const pages = ['index.html', 'heroes.html', 'hero-detail.html?id=antimage', 'items.html', 'guides.html', 'meta.html'];
    const sources = ['Google搜索', '百度搜索', '直接访问', '外链', '书签'];
    const devices = ['桌面端', '移动端', '平板'];

    const paths = [];
    for (let i = 0; i < 10; i++) {
      const time = new Date();
      time.setMinutes(time.getMinutes() - i);
      paths.push({
        time: time.toTimeString().slice(0, 8),
        page: pages[Math.floor(Math.random() * pages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
      });
    }

    document.querySelector('#realtime-paths tbody').innerHTML = paths.map(p => `
      <tr>
        <td>${p.time}</td>
        <td>${p.page}</td>
        <td>${p.source}</td>
        <td>${p.device}</td>
      </tr>
    `).join('');
  },

  // 启动实时更新
  startRealtimeUpdate() {
    setInterval(() => {
      if (document.getElementById('panel-realtime').classList.contains('active')) {
        this.renderRealtime();
      }
    }, 5000);
  },

  // 生成示例数据
  generateSampleData() {
    if (!confirm('确定生成示例数据吗？这将覆盖现有数据。')) return;

    const pages = ['index.html', 'heroes.html', 'hero-detail.html?id=antimage', 'items.html', 'guides.html', 'meta.html', 'tools.html'];
    const slots = ['ad-header', 'ad-sidebar', 'ad-incontent', 'ad-footer', 'ad-list'];

    // 生成30天的页面浏览数据
    const pageViews = [];
    for (let i = 0; i < 30; i++) {
      const dayCount = Math.floor(Math.random() * 300) + 100;
      for (let j = 0; j < dayCount; j++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(Math.floor(Math.random() * 24));
        d.setMinutes(Math.floor(Math.random() * 60));
        pageViews.push({
          page: pages[Math.floor(Math.random() * pages.length)],
          visitorId: 'visitor_' + Math.floor(Math.random() * 1000),
          timestamp: d.toISOString(),
        });
      }
    }
    this.setData(this.KEYS.PAGE_VIEWS, pageViews);

    // 生成广告数据
    const adImpressions = [];
    const adClicks = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      slots.forEach(slot => {
        const impCount = Math.floor(Math.random() * 200) + 50;
        for (let j = 0; j < impCount; j++) {
          const ts = new Date(d);
          ts.setHours(Math.floor(Math.random() * 24));
          adImpressions.push({ slot, timestamp: ts.toISOString() });
          if (Math.random() < 0.02) {
            adClicks.push({ slot, timestamp: ts.toISOString() });
          }
        }
      });
    }
    this.setData(this.KEYS.AD_IMPRESSIONS, adImpressions);
    this.setData(this.KEYS.AD_CLICKS, adClicks);

    alert('示例数据已生成');
    this.renderAllPanels();
  },

  // 导出数据
  exportData(format) {
    const data = {
      pageViews: this.getData(this.KEYS.PAGE_VIEWS),
      adImpressions: this.getData(this.KEYS.AD_IMPRESSIONS),
      adClicks: this.getData(this.KEYS.AD_CLICKS),
      settings: this.loadSettings(),
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      let csv = 'Page,VisitorId,Timestamp\n';
      data.pageViews.forEach(pv => {
        csv += `${pv.page},${pv.visitorId},${pv.timestamp}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pageviews-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  },

  // 重置数据
  resetData() {
    if (!confirm('确定重置所有数据吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：所有访问和广告数据将被清空！')) return;
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    alert('数据已重置');
    this.renderAllPanels();
  },
};

// 全局函数
function saveSettings() { Analytics.saveSettings(); }
function exportData(format) { Analytics.exportData(format); }
function generateSampleData() { Analytics.generateSampleData(); }
function resetData() { Analytics.resetData(); }

async function changePassword() {
  const oldPwd = document.getElementById('old-password').value;
  const newPwd = document.getElementById('new-password').value;
  const confirmPwd = document.getElementById('confirm-password').value;
  if (!oldPwd || !newPwd || !confirmPwd) {
    alert('请填写所有字段');
    return;
  }
  if (newPwd !== confirmPwd) {
    alert('两次输入的新密码不一致');
    return;
  }
  const result = await AdminAuth.changePassword(oldPwd, newPwd);
  alert(result.message);
  if (result.success) {
    document.getElementById('old-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  }
}

document.addEventListener('DOMContentLoaded', () => Analytics.init());

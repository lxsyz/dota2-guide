# DOTA 2 攻略站

一个纯前端的 DOTA 2 中文攻略网站，使用 HTML5 + CSS3 + 原生 JavaScript 构建，无任何框架依赖。

## 功能模块

- **首页** - 版本强势英雄速览、最新攻略、快速导航
- **英雄图鉴** - 全英雄列表，支持按属性/位置筛选，详情页包含技能、天赋、出装、克制关系
- **物品百科** - 全物品列表，支持按分类筛选，详情页包含属性、效果、合成路线
- **攻略中心** - 新手教程、英雄攻略、位置教学、版本解读
- **版本动态** - Tier List、版本趋势分析、更新记录
- **实用工具** - DPS 计算器、EHP 计算器、英雄对比器

## 技术栈

- HTML5 语义化标签
- CSS3 (Grid/Flexbox 布局, CSS 变量, 响应式设计)
- 原生 JavaScript (ES6+, Fetch API, async/await)
- JSON 数据文件驱动渲染

## 本地运行

```bash
cd dota2-guide
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080` 即可。

## 目录结构

```
dota2-guide/
├── index.html          # 首页
├── heroes.html         # 英雄列表页
├── hero-detail.html    # 英雄详情页
├── items.html          # 物品列表页
├── item-detail.html    # 物品详情页
├── guides.html         # 攻略列表页
├── guide-detail.html   # 攻略详情页
├── meta.html           # 版本动态页
├── tools.html          # 实用工具页
├── css/
│   ├── style.css       # 全局样式 + 暗色主题
│   ├── heroes.css      # 英雄相关样式
│   └── items.css       # 物品相关样式
├── js/
│   ├── app.js          # 全局逻辑（导航、搜索）
│   ├── heroes.js       # 英雄数据加载与渲染
│   ├── items.js        # 物品数据加载与渲染
│   └── guides.js       # 攻略相关逻辑
├── data/
│   ├── heroes.json     # 英雄数据（12个英雄）
│   ├── items.json      # 物品数据（20个物品）
│   └── guides.json     # 攻略索引（8篇攻略）
└── images/             # 图片资源目录
```

## 扩展说明

- 英雄/物品图片使用 Steam CDN 远程加载，离线时显示 fallback
- 添加新英雄：在 `data/heroes.json` 中按现有格式追加即可
- 添加新物品：在 `data/items.json` 中追加
- 添加新攻略：在 `data/guides.json` 中追加，content 字段支持 Markdown

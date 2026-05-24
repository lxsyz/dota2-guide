const SITE_BASE = 'https://lxsyz.github.io/dota2-guide';

function setPageMeta({ title, description, canonical, keywords }) {
  if (title) document.title = title;
  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }
  if (keywords) {
    let meta = document.querySelector('meta[name="keywords"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'keywords';
      document.head.appendChild(meta);
    }
    meta.content = keywords;
  }
  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
  }
}

function injectJsonLd(data) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function heroSchema(hero) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${hero.name} 出装加点攻略 - DOTA 2`,
    description: `${hero.name}（${hero.name_en}）技能、天赋、出装与实战技巧。${hero.tips?.laning || ''}`.slice(0, 160),
    inLanguage: 'zh-CN',
    author: { '@type': 'Organization', name: 'DOTA 2 攻略站' },
    about: {
      '@type': 'Thing',
      name: hero.name,
      alternateName: hero.name_en,
    },
    mainEntityOfPage: `${SITE_BASE}/hero-detail.html?id=${hero.id}`,
  };
}

function itemSchema(item) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description || `${item.name} - ${item.name_en}`,
    offers: {
      '@type': 'Offer',
      price: item.cost,
      priceCurrency: 'GOLD',
    },
  };
}

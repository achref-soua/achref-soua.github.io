const paths = {
  site: 'data/site.json?v=20260621-7',
  resume: 'data/resume.json?v=20260621-7',
  projects: 'data/projects.json?v=20260621-7',
  i18nFr: 'data/i18n.fr.json?v=20260621-7'
};

const state = {
  site: null,
  resume: null,
  projects: [],
  displayProjects: null,
  i18n: null,
  activeProjectFilter: 'All',
  lang: localStorage.getItem('lang') || 'en'
};

const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function setText(selector, value, root = document) {
  const element = typeof selector === 'string' ? select(selector, root) : selector;
  if (element) element.textContent = value || '';
}

function setMeta(name, value, attribute = 'name') {
  if (!value) return;
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createTagRow(items = []) {
  const row = createElement('div', 'tag-row');
  items.forEach((item) => row.append(createElement('span', 'tag', item)));
  return row;
}

function addReveal(element) {
  element.setAttribute('data-reveal', '');
  return element;
}

function updateMeta(site, resume) {
  const meta = site.meta || {};
  const profile = resume.profile || {};
  const absoluteImage = meta.image?.startsWith('http') ? meta.image : `${meta.url || ''}/${meta.image || ''}`.replace(/([^:]\/)\/+/g, '$1');

  document.title = meta.title || `${profile.name} - ${profile.role}`;
  setMeta('description', meta.description);
  setMeta('keywords', (meta.keywords || []).join(', '));
  setMeta('author', profile.name);
  setMeta('og:title', meta.title, 'property');
  setMeta('og:description', meta.description, 'property');
  setMeta('og:url', meta.url, 'property');
  setMeta('og:image', absoluteImage, 'property');
  setMeta('twitter:title', meta.title);
  setMeta('twitter:description', meta.description);
  setMeta('twitter:image', absoluteImage);
}

function renderNavigation(site) {
  const nav = select('[data-nav]');
  if (!nav) return;
  nav.replaceChildren();

  (site.navigation || []).forEach((item) => {
    const link = createElement('a', '', item.label);
    link.href = item.href;
    nav.append(link);
  });
}

function renderHero(site, resume) {
  const profile = resume.profile || {};
  const hero = site.hero || {};

  setText('[data-profile-initials]', profile.initials);
  setText('[data-profile-name]', profile.name);
  setText('[data-profile-name-main]', profile.name);
  setText('[data-footer-name]', profile.name);
  setText('[data-profile-role]', profile.role);
  setText('[data-profile-status]', profile.status);
  setText('[data-profile-location]', profile.location);
  setText('[data-hero-eyebrow]', hero.eyebrow);
  setText('[data-hero-subheadline]', hero.subheadline || profile.intro);
  setText('[data-summary]', profile.summary);

  const image = select('[data-profile-image]');
  if (image && profile.image) {
    image.src = profile.image;
    image.alt = profile.imageAlt || `Portrait of ${profile.name}`;
  }

  const primary = select('[data-primary-action]');
  if (primary && hero.primaryAction) {
    primary.textContent = hero.primaryAction.label;
    primary.href = hero.primaryAction.href;
  }

  const secondary = select('[data-secondary-action]');
  if (secondary && hero.secondaryAction) {
    secondary.textContent = hero.secondaryAction.label;
    secondary.href = hero.secondaryAction.href;
  }
}

function renderSectionCopy(site) {
  const sections = site.sections || {};
  Object.entries(sections).forEach(([key, section]) => {
    setText(`[data-${key}-title]`, section.title);
    setText(`[data-${key}-intro]`, section.intro);
    setText(`[data-section-label="${key}"]`, section.label || key);
  });

  const contact = site.contact || {};
  setText('[data-contact-eyebrow]', contact.eyebrow);
  setText('[data-contact-title]', contact.title);
  setText('[data-contact-intro]', contact.intro);
}

function renderMetrics(resume) {
  const container = select('[data-metrics]');
  if (!container) return;
  container.replaceChildren();

  (resume.metrics || []).forEach((metric) => {
    const article = addReveal(createElement('article', 'metric'));
    const value = createElement('strong', '', metric.value);
    value.setAttribute('data-count', '');
    article.append(value);
    article.append(createElement('span', '', metric.label));
    container.append(article);
  });
}

function renderFocusAreas(resume) {
  const container = select('[data-focus]');
  if (!container) return;
  container.replaceChildren();

  (resume.focusAreas || []).forEach((area) => {
    const article = addReveal(createElement('article', 'focus-card'));
    article.append(createElement('h3', '', area.title));
    article.append(createElement('p', '', area.description));
    container.append(article);
  });
}

function renderExperience(resume) {
  const track = select('[data-experience]');
  const rail = select('[data-xp-rail]');
  const section = select('[data-xp-section]');
  if (!track) return;

  track.replaceChildren();
  if (rail) rail.replaceChildren();

  // Oldest → latest so scrolling moves forward through time.
  const items = (resume.experience || []).slice().reverse();
  const total = items.length;
  if (section) section.style.setProperty('--xp-count', String(Math.max(total, 1)));

  const isPresent = (range) => /present|présent|now|aujourd|en cours/i.test(String(range));

  items.forEach((experience, index) => {
    const year = (String(experience.range).match(/\d{4}/) || [''])[0];
    const tickLabel = isPresent(experience.range)
      ? (state.lang === 'fr' ? 'Auj.' : 'Now')
      : (year || experience.range);

    const panel = createElement('article', 'xp-panel');
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-roledescription', 'slide');
    panel.setAttribute('aria-label', `${index + 1} of ${total} — ${experience.role}, ${experience.company}`);

    const ghost = createElement('span', 'xp-ghost', year || '');
    ghost.setAttribute('aria-hidden', 'true');
    panel.append(ghost);

    const inner = createElement('div', 'xp-panel-inner');

    const top = createElement('div', 'xp-panel-top');
    top.append(createElement('span', 'xp-index', `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`));
    top.append(createElement('span', 'xp-range', experience.range));
    inner.append(top);

    inner.append(createElement('h3', 'xp-role', experience.role));
    inner.append(createElement('div', 'xp-company item-meta', `${experience.company} · ${experience.location}`));
    inner.append(createElement('p', 'xp-summary', experience.summary));

    if (experience.highlights?.length) {
      const list = createElement('ul', 'clean-list xp-highlights');
      experience.highlights.forEach((highlight) => list.append(createElement('li', '', highlight)));
      inner.append(list);
    }

    if (experience.tools?.length) inner.append(createTagRow(experience.tools));

    panel.append(inner);
    track.append(panel);

    if (rail) {
      const tick = createElement('button', 'xp-tick');
      tick.type = 'button';
      tick.dataset.index = String(index);
      tick.setAttribute('aria-label', `Show ${experience.company} (${experience.range})`);
      tick.append(createElement('span', 'xp-tick-dot'));
      tick.append(createElement('span', 'xp-tick-label', tickLabel));
      rail.append(tick);
    }
  });
}

let xpController = null;

function initTimelineScroll() {
  if (xpController) {
    xpController();
    xpController = null;
  }

  const section = select('[data-xp-section]');
  const scroll = select('[data-xp-scroll]');
  const viewport = select('[data-xp-viewport]');
  const track = select('[data-experience]');
  const rail = select('[data-xp-rail]');
  const hint = select('[data-xp-hint]');
  if (!section || !scroll || !viewport || !track) return;

  const panels = selectAll('.xp-panel', track);
  const ticks = selectAll('.xp-tick', rail);
  const count = panels.length;
  if (!count) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 768px)').matches;
  const mode = reduceMotion ? 'stacked' : desktop ? 'pinned' : 'carousel';

  section.classList.remove('is-pinned', 'is-carousel', 'is-stacked');
  section.classList.add(`is-${mode}`);
  track.style.transform = '';
  panels.forEach((panel) => panel.style.removeProperty('--xp-d'));

  const setActive = (active) => {
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === active));
    ticks.forEach((tick, i) => {
      tick.classList.toggle('is-active', i <= active);
      tick.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
  };

  const cleanups = [];
  const on = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  };

  if (mode === 'pinned') {
    let frame = 0;
    let hinted = false;

    const goTo = (index) => {
      const start = window.scrollY + scroll.getBoundingClientRect().top;
      window.scrollTo({ top: start + index * window.innerHeight, behavior: 'smooth' });
    };

    const render = () => {
      frame = 0;
      const rect = scroll.getBoundingClientRect();
      const distance = scroll.offsetHeight - window.innerHeight;
      const progress = distance <= 0 ? 0 : Math.min(Math.max(-rect.top / distance, 0), 1);
      const span = Math.max(count - 1, 1);
      const position = progress * span;

      track.style.transform = `translate3d(${-position * track.clientWidth}px, 0, 0)`;
      panels.forEach((panel, i) => {
        panel.style.setProperty('--xp-d', Math.min(Math.abs(i - position), 1).toFixed(3));
      });
      if (rail) rail.style.setProperty('--xp-fill', `${(count > 1 ? progress : 1) * 100}%`);
      setActive(Math.round(position));

      if (!hinted && hint && progress > 0.02) {
        hint.classList.add('is-hidden');
        hinted = true;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    on(window, 'scroll', onScroll, { passive: true });
    on(window, 'resize', onScroll);
    ticks.forEach((tick) => on(tick, 'click', () => goTo(Number(tick.dataset.index))));
    on(window, 'keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const rect = scroll.getBoundingClientRect();
      if (rect.top > 1 || rect.bottom < window.innerHeight) return;
      event.preventDefault();
      const distance = scroll.offsetHeight - window.innerHeight;
      const progress = distance <= 0 ? 0 : Math.min(Math.max(-rect.top / distance, 0), 1);
      const current = Math.round(progress * Math.max(count - 1, 1));
      goTo(Math.min(Math.max(current + (event.key === 'ArrowRight' ? 1 : -1), 0), count - 1));
    });

    cleanups.push(() => {
      if (frame) cancelAnimationFrame(frame);
      track.style.transform = '';
    });
    render();
  } else if (mode === 'carousel') {
    const sync = () => {
      const center = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      panels.forEach((panel, i) => {
        const rect = panel.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActive(best);
    };
    on(viewport, 'scroll', sync, { passive: true });
    ticks.forEach((tick) => on(tick, 'click', () => {
      panels[Number(tick.dataset.index)].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }));
    sync();
  } else {
    setActive(count - 1);
  }

  xpController = () => cleanups.forEach((fn) => fn());
}

function animateCount(element) {
  const text = element.dataset.countText || element.textContent;
  element.dataset.countText = text;

  const match = text.match(/^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return;

  const [, prefix, rawNumber, suffix] = match;
  const numberText = rawNumber.replace(/,/g, '');
  const target = parseFloat(numberText);
  const decimals = (numberText.split('.')[1] || '').length;

  // Tiny values (e.g. "1st", "3+") read better instantly than as a count-up.
  if (!Number.isFinite(target) || target < 5) {
    element.textContent = text;
    return;
  }

  const format = (value) => prefix + value.toLocaleString('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) + suffix;

  const duration = 1100;
  const start = performance.now();
  const step = (now) => {
    const ratio = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - ratio, 3);
    element.textContent = format(target * eased);
    if (ratio < 1) requestAnimationFrame(step);
    else element.textContent = text;
  };

  element.textContent = format(0);
  requestAnimationFrame(step);
}

function initCountUp(root = document) {
  const elements = selectAll('[data-count]', root).filter((element) => !element.dataset.counted);
  if (!elements.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => { element.dataset.counted = '1'; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      entry.target.dataset.counted = '1';
      animateCount(entry.target);
    });
  }, { threshold: 0.6 });

  elements.forEach((element) => observer.observe(element));
}

function getProjectFilters(projects) {
  return ['All', ...new Set(projects.map((project) => project.category).filter(Boolean))];
}

function renderProjectFilters() {
  const container = select('[data-project-filters]');
  if (!container) return;
  container.replaceChildren();

  const source = state.displayProjects || state.projects;
  getProjectFilters(source).forEach((filter) => {
    const button = createElement('button', 'filter-button', filter);
    button.type = 'button';
    button.setAttribute('aria-pressed', filter === state.activeProjectFilter ? 'true' : 'false');
    button.addEventListener('click', () => {
      state.activeProjectFilter = filter;
      renderProjectFilters();
      renderProjects();
      observeRevealItems();
      constellationApi?.applyFilter();
    });
    container.append(button);
  });
}

function renderProjects() {
  const container = select('[data-projects]');
  if (!container) return;
  container.replaceChildren();

  const source = state.displayProjects || state.projects;
  const projects = state.activeProjectFilter === 'All'
    ? source
    : source.filter((project) => project.category === state.activeProjectFilter);

  projects.forEach((project) => {
    const article = addReveal(createElement('article', 'project-card'));
    if (project.featured) article.classList.add('is-featured');
    const header = document.createElement('header');
    if (project.featured) header.append(createElement('span', 'project-badge', 'Featured'));
    header.append(createElement('div', 'project-meta', `${project.category} · ${project.range}`));
    header.append(createElement('h3', '', project.title));

    article.append(header);
    article.append(createElement('p', '', project.summary));

    if (project.highlights?.length) {
      const list = createElement('ul', 'clean-list');
      project.highlights.forEach((highlight) => list.append(createElement('li', '', highlight)));
      article.append(list);
    }

    if (project.stack?.length) article.append(createTagRow(project.stack));
    if (project.impact) article.append(createElement('p', 'impact-line', project.impact));

    if (project.link && project.link !== '#') {
      const link = createElement('a', 'project-link', project.linkLabel || 'Open project');
      link.href = project.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      article.append(link);
    }

    container.append(article);
  });
}

let constellationApi = null;

function initConstellation() {
  if (constellationApi) {
    constellationApi.destroy();
    constellationApi = null;
  }

  const section = select('[data-projects-section]');
  const stage = select('[data-constellation-stage]');
  const canvas = select('[data-constellation-canvas]');
  const nodesLayer = select('[data-constellation-nodes]');
  const detail = select('[data-constellation-detail]');
  const hint = select('[data-constellation-hint]');
  if (!section || !stage || !canvas || !nodesLayer) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = window.matchMedia('(min-width: 860px)').matches;
  const graphMode = wide && canHover && !reduceMotion;

  section.classList.toggle('is-graph', graphMode);
  section.classList.toggle('is-grid', !graphMode);

  if (!graphMode) {
    nodesLayer.replaceChildren();
    detail?.classList.remove('is-visible');
    return;
  }

  const projects = state.displayProjects || state.projects || [];
  if (!projects.length) return;

  // ── Model: center → category hubs → project nodes ─────────────
  const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))];
  const nodes = [];
  const edges = [];
  const byId = new Map();

  const center = { id: '__center', type: 'center', label: state.resume?.profile?.initials || 'AS', z: 0, nx: 0, ny: 0, phase: 0 };
  nodes.push(center);

  categories.forEach((cat, i) => {
    const ang = -Math.PI / 2 + i * ((Math.PI * 2) / categories.length);
    const catNode = {
      id: 'cat:' + cat, type: 'category', label: cat, cat, z: 0.5, phase: i * 1.3,
      nx: Math.cos(ang) * 0.4, ny: Math.sin(ang) * 0.38
    };
    nodes.push(catNode);
    edges.push({ a: center, b: catNode, curve: i % 2 ? 1 : -1, alpha: 0.001, target: 0.5, hot: false });

    const members = projects.filter((p) => p.category === cat);
    members.forEach((proj, j) => {
      const spread = Math.PI * 0.66;
      const t = members.length === 1 ? 0 : (j / (members.length - 1) - 0.5);
      const pang = ang + t * spread;
      const reach = 0.24 * (1 + (j % 2) * 0.28);
      const node = {
        id: 'proj:' + proj.title, type: 'project', proj, cat, z: 0.9, featured: !!proj.featured,
        phase: i * 1.3 + j * 0.9 + 0.5,
        nx: catNode.nx + Math.cos(pang) * reach, ny: catNode.ny + Math.sin(pang) * reach
      };
      nodes.push(node);
      edges.push({ a: catNode, b: node, curve: (i + j) % 2 ? 1 : -1, alpha: 0.001, target: 0.5, hot: false });
    });
  });

  nodes.forEach((n) => byId.set(n.id, n));

  const neighbors = new Map();
  const link = (x, y) => {
    if (!neighbors.has(x)) neighbors.set(x, new Set());
    neighbors.get(x).add(y);
  };
  edges.forEach((e) => { link(e.a.id, e.b.id); link(e.b.id, e.a.id); });

  // ── Interaction state + detail card ───────────────────────────
  const cleanups = [];
  const on = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  };

  let hoverId = null;
  let pinId = null;

  const showDetail = (proj) => {
    if (!detail) return null;
    detail.replaceChildren();
    detail.append(createElement('div', 'cst-detail-meta', `${proj.category} · ${proj.range}`));
    detail.append(createElement('h3', 'cst-detail-title', proj.title));
    detail.append(createElement('p', 'cst-detail-summary', proj.summary));
    if (proj.stack?.length) detail.append(createTagRow(proj.stack.slice(0, 6)));
    if (proj.impact) detail.append(createElement('p', 'impact-line', proj.impact));
    let detailLink = null;
    if (proj.link && proj.link !== '#') {
      detailLink = createElement('a', 'project-link cst-detail-link', proj.linkLabel || 'Open project');
      detailLink.href = proj.link;
      detailLink.target = '_blank';
      detailLink.rel = 'noopener noreferrer';
      detail.append(detailLink);
    }
    detail.classList.add('is-visible');
    hint?.classList.add('is-hidden');
    return detailLink;
  };

  const showPrompt = () => {
    if (!detail) return;
    detail.replaceChildren();
    detail.append(createElement('div', 'cst-detail-meta', `${projects.length} projects · ${categories.length} areas`));
    detail.append(createElement('h3', 'cst-detail-title', 'Explore the map'));
    detail.append(createElement('p', 'cst-detail-summary', 'Hover or tap any node to open a project. Click a hub to filter by area. Scroll to set the map in motion.'));
    detail.classList.add('is-visible');
    hint?.classList.remove('is-hidden');
  };

  const filteredOut = (node) => {
    const f = state.activeProjectFilter;
    if (!f || f === 'All') return false;
    if (node.type === 'project' || node.type === 'category') return node.cat !== f;
    return false;
  };

  const computeActive = () => {
    const activeId = hoverId || pinId;
    const near = activeId ? neighbors.get(activeId) : null;
    nodes.forEach((node) => {
      const out = filteredOut(node);
      node.el.classList.toggle('is-dim', out);
      const focused = activeId && (node.id === activeId || (near && near.has(node.id)));
      node.el.classList.toggle('is-active', !!(activeId && node.id === activeId));
      node.el.classList.toggle('is-muted', !!(activeId && !focused && !out));
    });
    edges.forEach((e) => {
      const out = filteredOut(e.a) || filteredOut(e.b);
      const touches = activeId && (e.a.id === activeId || e.b.id === activeId);
      e.hot = !!touches;
      e.target = out ? 0.06 : touches ? 0.9 : activeId ? 0.12 : 0.42;
    });
  };

  const setHover = (node) => {
    hoverId = node.id;
    if (node.type === 'project') showDetail(node.proj);
    computeActive();
  };
  const clearHover = () => {
    hoverId = null;
    const pinned = pinId ? byId.get(pinId) : null;
    if (pinned?.proj) showDetail(pinned.proj);
    else showPrompt();
    computeActive();
  };
  const pinNode = (node) => {
    pinId = node.id;
    const detailLink = showDetail(node.proj);
    computeActive();
    detailLink?.focus({ preventScroll: true });
  };
  const filterByCategory = (cat) => {
    state.activeProjectFilter = state.activeProjectFilter === cat ? 'All' : cat;
    renderProjectFilters();
    renderProjects();
    observeRevealItems();
    computeActive();
  };

  // ── DOM nodes ─────────────────────────────────────────────────
  nodesLayer.replaceChildren();
  nodes.forEach((node) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `cst-node is-${node.type}`;
    if (node.featured) button.classList.add('is-featured');
    node.el = button;

    const dot = createElement('span', 'cst-dot');
    if (node.type === 'center') dot.textContent = node.label;
    button.append(dot);

    if (node.type !== 'center') {
      button.append(createElement('span', 'cst-label', node.label || node.proj?.title || ''));
    }

    if (node.type === 'project') {
      button.setAttribute('aria-label', `${node.proj.title}, ${node.proj.category} project — show details`);
      button.append(createElement('span', 'visually-hidden', `${node.proj.summary} ${node.proj.impact || ''}`));
      on(button, 'pointerenter', () => setHover(node));
      on(button, 'focus', () => setHover(node));
      on(button, 'pointerleave', clearHover);
      on(button, 'blur', clearHover);
      on(button, 'click', () => pinNode(node));
    } else if (node.type === 'category') {
      button.setAttribute('aria-label', `Highlight and filter ${node.label} projects`);
      on(button, 'pointerenter', () => setHover(node));
      on(button, 'focus', () => setHover(node));
      on(button, 'pointerleave', clearHover);
      on(button, 'blur', clearHover);
      on(button, 'click', () => filterByCategory(node.cat));
    } else {
      button.setAttribute('aria-label', 'Achref Soua — reset project filter');
      on(button, 'click', () => filterByCategory('All'));
    }
    nodesLayer.append(button);
  });

  computeActive();
  showPrompt();

  // ── Canvas + animation loop ───────────────────────────────────
  const ctx = canvas.getContext('2d');
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  let running = false;
  let pointerInside = false;
  let calm = 0;
  let lastW = 0;
  let lastH = 0;
  const startTime = performance.now();

  const readColor = (name, fallback) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  const frame = (now) => {
    const t = (now - startTime) / 1000;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (W !== lastW || H !== lastH) {
      lastW = W; lastH = H;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const scaleX = (W / 2) * 0.9;
    const scaleY = (H / 2) * 0.9;

    const rect = stage.getBoundingClientRect();
    const scrollP = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
    // Rotation is driven by scroll position only — the map is still when idle, so nodes stay easy to hover.
    const rotation = (scrollP - 0.5) * 0.62;

    mouse.x += (mouse.tx - mouse.x) * 0.07;
    mouse.y += (mouse.ty - mouse.y) * 0.07;
    // Settle the ambient float while the pointer is on the map, so targets hold still.
    calm += ((pointerInside ? 1 : 0) - calm) * 0.08;
    const floatAmp = 5 * (1 - calm * 0.82);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    nodes.forEach((node) => {
      const rx = node.nx * cos - node.ny * sin;
      const ry = node.nx * sin + node.ny * cos;
      let x = cx + rx * scaleX;
      let y = cy + ry * scaleY;
      x += Math.sin(t * 0.7 + node.phase) * floatAmp * (0.4 + node.z);
      y += Math.cos(t * 0.6 + node.phase) * floatAmp * (0.4 + node.z);
      x += mouse.x * 30 * node.z;
      y += mouse.y * 20 * node.z;
      node.x = x;
      node.y = y;
      node.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    });

    const cBase = readColor('--line-strong', '#bcbcbc');
    const cHot = readColor('--text', '#0b0b0c');
    edges.forEach((e) => {
      e.alpha += (e.target - e.alpha) * 0.12;
      const mx = (e.a.x + e.b.x) / 2;
      const my = (e.a.y + e.b.y) / 2;
      const dx = e.b.x - e.a.x;
      const dy = e.b.y - e.a.y;
      const len = Math.hypot(dx, dy) || 1;
      const amt = e.curve * len * 0.08;
      const ctrlX = mx + (-dy / len) * amt;
      const ctrlY = my + (dx / len) * amt;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, e.b.x, e.b.y);
      ctx.strokeStyle = e.hot ? cHot : cBase;
      ctx.globalAlpha = Math.max(e.alpha, 0);
      ctx.lineWidth = e.hot ? 1.7 : 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(frame);
  };

  const startLoop = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stopLoop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

  on(stage, 'pointerenter', () => { pointerInside = true; });
  on(stage, 'pointermove', (event) => {
    pointerInside = true;
    const rect = stage.getBoundingClientRect();
    mouse.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    mouse.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });
  on(stage, 'pointerleave', () => { pointerInside = false; mouse.tx = 0; mouse.ty = 0; });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? startLoop() : stopLoop()));
  }, { threshold: 0 });
  io.observe(stage);

  constellationApi = {
    applyFilter: computeActive,
    destroy: () => {
      stopLoop();
      io.disconnect();
      cleanups.forEach((fn) => fn());
      nodesLayer.replaceChildren();
    }
  };
}

function renderSkills(resume) {
  const container = select('[data-skills]');
  if (!container) return;
  container.replaceChildren();

  (resume.skills || []).forEach((group) => {
    const article = addReveal(createElement('article', 'skill-card'));
    article.append(createElement('h3', '', group.group));
    article.append(createTagRow(group.items));
    container.append(article);
  });
}

function renderEducation(resume) {
  const container = select('[data-education]');
  if (!container) return;
  container.replaceChildren();

  (resume.education || []).forEach((education) => {
    const article = addReveal(createElement('article', 'compact-card'));
    article.append(createElement('h3', '', education.degree));
    article.append(createElement('p', '', education.institution));
    article.append(createElement('div', 'item-meta', `${education.range} · ${education.location}`));
    container.append(article);
  });
}

function renderPublications(resume) {
  const container = select('[data-publications]');
  if (!container) return;
  container.replaceChildren();

  (resume.publications || []).forEach((publication) => {
    const article = addReveal(createElement('article', 'compact-card'));
    article.append(createElement('h3', '', publication.title));
    article.append(createElement('p', '', publication.authors));
    article.append(createElement('div', 'item-meta', `${publication.venue} · ${publication.year}`));
    container.append(article);
  });
}

function renderContact(resume) {
  const contact = resume.contact || {};
  const emailLink = select('[data-email-link]');
  const socialLinks = select('[data-social-links]');

  if (emailLink && contact.email) {
    emailLink.href = `mailto:${contact.email}`;
    emailLink.textContent = 'Email';
  }

  if (socialLinks) {
    socialLinks.replaceChildren();
    [
      ['GitHub', contact.github, contact.githubAvatar],
      ['LinkedIn', contact.linkedin, null],
      ['Medium', contact.medium, null]
    ].forEach(([label, href, avatar]) => {
      if (!href) return;
      const link = createElement('a', 'social-link', '');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (avatar) {
        const img = document.createElement('img');
        img.src = avatar;
        img.alt = `${label} profile`;
        img.className = 'social-avatar';
        img.width = 30;
        img.height = 30;
        link.append(img);
      }
      link.append(document.createTextNode(label));
      socialLinks.append(link);
    });
  }
}

function renderStructuredData(site, resume) {
  const profile = resume.profile || {};
  const contact = resume.contact || {};
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: site.meta?.url,
    image: `${site.meta?.url || ''}/${profile.image || ''}`.replace(/([^:]\/)\/+/g, '$1'),
    jobTitle: profile.role,
    description: profile.summary,
    email: contact.email,
    sameAs: [contact.github, contact.linkedin].filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.location,
      addressCountry: 'FR'
    },
    knowsAbout: (resume.skills || []).flatMap((group) => group.items).slice(0, 24)
  });
  document.head.append(script);
}

function initTheme() {
  const button = select('[data-theme-toggle]');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = stored ? stored === 'dark' : prefersDark;

  document.documentElement.classList.toggle('dark', shouldUseDark);
  updateThemeButton(button);

  button?.addEventListener('click', () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    updateThemeButton(button);
  });
}

function updateThemeButton(button) {
  if (!button) return;
  const dark = document.documentElement.classList.contains('dark');
  button.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
  button.innerHTML = dark
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"></path></svg>';
}

function initActions(resume) {
  const copyButton = select('[data-copy-email]');
  const email = resume.contact?.email || '';

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      copyButton.textContent = 'Copied';
      window.setTimeout(() => { copyButton.textContent = 'Copy Email'; }, 1600);
    } catch {
      copyButton.textContent = email;
    }
  });
}

function initBackToTop() {
  const button = select('[data-back-to-top]');
  if (!button) return;
  const update = () => button.classList.toggle('is-visible', window.scrollY > 380);
  update();
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function applyLang(site, resume, projects) {
  if (state.lang === 'en' || !state.i18n) {
    return { site, resume, projects: projects || state.projects };
  }
  const fr = state.i18n;
  const siteFr = site.i18n?.fr || {};

  const siteOut = {
    ...site,
    navigation: siteFr.navigation || site.navigation,
    hero: { ...site.hero, ...(siteFr.hero || {}) },
    sections: Object.fromEntries(
      Object.entries(site.sections).map(([key, sec]) => [
        key, { ...sec, ...(siteFr.sections?.[key] || {}) }
      ])
    ),
    contact: { ...site.contact, ...(siteFr.contact || {}) }
  };

  const resumeOut = {
    ...resume,
    profile: { ...resume.profile, ...(fr.profile || {}) },
    metrics: fr.metrics || resume.metrics,
    focusAreas: fr.focusAreas || resume.focusAreas,
    experience: fr.experience || resume.experience,
    education: fr.education || resume.education,
    skills: fr.skills || resume.skills,
    publications: fr.publications || resume.publications
  };

  const source = projects || state.projects;
  const projectsOut = source.map(proj => {
    const frProj = (fr.projects || []).find(p => p.title === proj.title);
    if (!frProj) return proj;
    return {
      ...proj,
      summary: frProj.summary || proj.summary,
      highlights: frProj.highlights || proj.highlights,
      impact: frProj.impact || proj.impact
    };
  });

  return { site: siteOut, resume: resumeOut, projects: projectsOut };
}

function initLangToggle() {
  const button = select('[data-lang-toggle]');
  const label = select('[data-lang-label]');
  if (!button || !label) return;

  const refresh = () => {
    const isFr = state.lang === 'fr';
    label.textContent = isFr ? 'EN' : 'FR';
    button.setAttribute('aria-label', isFr ? 'Switch to English' : 'Passer en français');
  };

  refresh();

  button.addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'fr' : 'en';
    localStorage.setItem('lang', state.lang);
    refresh();
    const { site: s, resume: r, projects: p } = applyLang(state.site, state.resume, state.projects);
    state.displayProjects = p;
    state.activeProjectFilter = 'All';
    renderNavigation(s);
    renderHero(s, r);
    renderSectionCopy(s);
    renderMetrics(r);
    renderFocusAreas(r);
    renderExperience(r);
    initTimelineScroll();
    renderProjectFilters();
    renderProjects();
    initConstellation();
    renderSkills(r);
    renderEducation(r);
    renderPublications(r);
    initScrollFeedback();
    observeRevealItems();
    initCountUp();
  });
}

const GH_USER = 'achref-soua';
const LANG_COLORS = {
  Rust: '#dea584', Python: '#3572A5', TypeScript: '#3178c6',
  JavaScript: '#f1e05a', 'C++': '#f34b7d', Go: '#00ADD8',
  Svelte: '#ff3e00', CSS: '#563d7c', HTML: '#e34c26'
};

async function fetchMediumArticles() {
  const rssUrl = 'https://medium.com/feed/@achref-soua';
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const data = await fetch(apiUrl).then(r => r.json());
  if (data.status !== 'ok') return [];
  return data.items || [];
}

const MEDIUM_URL = 'https://achref-soua.medium.com/';

function renderMediumArticles(articles, container) {
  const headingRow = createElement('div', 'gh-medium-heading');
  const heading = createElement('h3', 'gh-sub-heading', 'Latest on Medium');
  const allLink = createElement('a', 'gh-medium-all', 'View all →');
  allLink.href = MEDIUM_URL;
  allLink.target = '_blank';
  allLink.rel = 'noopener noreferrer';
  headingRow.append(heading, allLink);
  container.append(headingRow);

  if (!articles.length) {
    const placeholder = createElement('p', 'gh-medium-placeholder', 'Articles loading — or visit Medium directly.');
    container.append(placeholder);
    return;
  }

  const grid = createElement('div', 'medium-grid');
  articles.slice(0, 4).forEach(article => {
    const card = addReveal(createElement('article', 'medium-card'));

    const title = createElement('a', 'medium-title', article.title);
    title.href = article.link;
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    card.append(title);

    const date = new Date(article.pubDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
    card.append(createElement('div', 'medium-date', date));

    const cats = (article.categories || []).slice(0, 3);
    if (cats.length) card.append(createTagRow(cats));

    grid.append(card);
  });

  container.append(grid);
}

async function renderGitHubDashboard() {
  const container = select('[data-github-dashboard]');
  if (!container) return;

  try {
    const [user, repos, articles] = await Promise.all([
      fetch(`https://api.github.com/users/${GH_USER}`).then(r => r.json()),
      fetch(`https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=100`).then(r => r.json()),
      fetchMediumArticles().catch(() => [])
    ]);

    if (user.message) throw new Error(user.message);
    if (!Array.isArray(repos)) throw new Error('repos failed');

    const ownRepos = repos.filter(r => !r.fork);
    const totalStars = ownRepos.reduce((n, r) => n + r.stargazers_count, 0);
    const totalForks = ownRepos.reduce((n, r) => n + r.forks_count, 0);

    const statsStrip = createElement('div', 'gh-stats-strip');
    [
      [user.public_repos, 'Repositories'],
      [totalStars, 'Stars'],
      [totalForks, 'Forks'],
      [user.followers, 'Followers']
    ].forEach(([val, lbl]) => {
      const stat = addReveal(createElement('div', 'gh-stat'));
      const value = createElement('strong', '', String(val ?? '—'));
      value.setAttribute('data-count', '');
      stat.append(value);
      stat.append(createElement('span', '', lbl));
      statsStrip.append(stat);
    });

    const top = ownRepos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6);

    const grid = createElement('div', 'gh-repos-grid');
    top.forEach(repo => {
      const card = addReveal(createElement('article', 'gh-repo-card'));

      const header = createElement('div', 'gh-repo-header');
      const name = createElement('a', 'gh-repo-name', repo.name);
      name.href = repo.html_url;
      name.target = '_blank';
      name.rel = 'noopener noreferrer';
      header.append(name);
      if (repo.stargazers_count > 0) {
        header.append(createElement('span', 'gh-repo-stars', `★ ${repo.stargazers_count}`));
      }
      card.append(header);

      if (repo.description) {
        card.append(createElement('p', 'gh-repo-desc', repo.description));
      }

      const meta = createElement('div', 'gh-repo-meta');
      if (repo.language) {
        const lang = createElement('span', 'gh-lang', repo.language);
        lang.style.setProperty('--lang-color', LANG_COLORS[repo.language] || 'var(--muted)');
        meta.append(lang);
      }
      if (repo.forks_count > 0) meta.append(createElement('span', '', `⑂ ${repo.forks_count}`));
      const updated = new Date(repo.updated_at).toLocaleDateString('en', { month: 'short', year: 'numeric' });
      meta.append(createElement('span', '', `Updated ${updated}`));
      card.append(meta);

      grid.append(card);
    });

    container.replaceChildren(statsStrip, grid);
    renderMediumArticles(articles || [], container);
    observeRevealItems();
    initCountUp(container);
  } catch {
    const msg = createElement('p', 'gh-error', 'GitHub stats unavailable — try again later.');
    container.replaceChildren(msg);
    renderMediumArticles([], container);
  }
}

function observeRevealItems() {
  const items = selectAll('[data-reveal]:not(.is-visible)');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  items.forEach((item) => observer.observe(item));
}

function initScrollFeedback() {
  const meter = select('[data-scroll-meter]');
  const header = select('[data-header]');
  const navLinks = selectAll('[data-nav] a');
  const sections = navLinks
    .map((link) => select(link.getAttribute('href')))
    .filter(Boolean);

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max <= 0 ? 0 : (window.scrollY / max) * 100;
    if (meter) meter.style.width = `${progress}%`;
    header?.classList.toggle('is-scrolled', window.scrollY > 12);

    let currentId = sections[0]?.id;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= 140) currentId = section.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

function renderError(error) {
  const main = select('#main');
  if (!main) return;
  const message = createElement('section', 'shell load-error');
  message.innerHTML = `
    <h1>Content could not load.</h1>
    <p>${error.message}. Run the site through a local server so the JSON config files can be fetched.</p>
  `;
  main.prepend(message);
}

async function init() {
  initTheme();
  setText('[data-year]', new Date().getFullYear().toString());

  try {
    const [site, resume, projects, i18nFr] = await Promise.all([
      loadJSON(paths.site),
      loadJSON(paths.resume),
      loadJSON(paths.projects),
      loadJSON(paths.i18nFr).catch(() => null)
    ]);

    state.site = site;
    state.resume = resume;
    state.projects = projects;
    state.i18n = i18nFr;

    const { site: s, resume: r, projects: p } = applyLang(site, resume, projects);
    state.displayProjects = p;

    updateMeta(s, r);
    renderNavigation(s);
    renderHero(s, r);
    renderSectionCopy(s);
    renderMetrics(r);
    renderFocusAreas(r);
    renderExperience(r);
    renderProjectFilters();
    renderProjects();
    renderSkills(r);
    renderEducation(r);
    renderPublications(r);
    renderContact(r);
    renderStructuredData(s, r);
    initActions(r);
    initScrollFeedback();
    initBackToTop();
    initLangToggle();
    observeRevealItems();
    initTimelineScroll();
    initConstellation();
    initCountUp();

    // Re-evaluate scroll-driven scenes when the breakpoint or motion preference changes.
    const remountScenes = () => { initTimelineScroll(); initConstellation(); };
    window.matchMedia('(min-width: 768px)').addEventListener('change', remountScenes);
    window.matchMedia('(min-width: 860px)').addEventListener('change', remountScenes);
    window.matchMedia('(hover: hover)').addEventListener('change', remountScenes);
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', remountScenes);

    renderGitHubDashboard().catch(() => {});
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

init();

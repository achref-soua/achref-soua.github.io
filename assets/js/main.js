const paths = {
  site: 'data/site.json?v=20260621-8',
  resume: 'data/resume.json?v=20260621-8',
  projects: 'data/projects.json?v=20260621-8',
  i18nFr: 'data/i18n.fr.json?v=20260621-8'
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

  // ── Model: an orrery. Each project rides an orbit inside its discipline's sector.
  const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))];
  const ORBITS = [0.4, 0.58, 0.76];
  const sectorCount = Math.max(categories.length, 1);
  const nodes = [];
  const connectors = [];
  const byId = new Map();

  const center = { id: '__center', type: 'center', label: state.resume?.profile?.initials || 'AS', r: 0, ang: 0, orbit: 0 };
  nodes.push(center);

  categories.forEach((cat, i) => {
    const base = -Math.PI / 2 + i * ((Math.PI * 2) / sectorCount);
    const half = (Math.PI / sectorCount) * 0.6;
    nodes.push({ id: 'cat:' + cat, type: 'category', label: cat, cat, r: 0.88, ang: base, orbit: 0.88 });

    const members = projects.filter((p) => p.category === cat);
    members.forEach((proj, j) => {
      const t = members.length === 1 ? 0 : (j / (members.length - 1) - 0.5);
      const orbit = ORBITS[j % ORBITS.length];
      const node = {
        id: 'proj:' + proj.title, type: 'project', proj, cat, featured: !!proj.featured,
        r: orbit, orbit, ang: base + t * 2 * half
      };
      nodes.push(node);
      connectors.push(node);
    });
  });

  nodes.forEach((n) => byId.set(n.id, n));

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
    if (proj.role) detail.append(createElement('div', 'cst-detail-role', proj.role));
    detail.append(createElement('span', 'cst-detail-rule', ''));
    detail.append(createElement('p', 'cst-detail-summary', proj.summary));
    if (proj.stack?.length) detail.append(createTagRow(proj.stack.slice(0, 7)));
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
    detail.classList.remove('is-prompt');
    hint?.classList.add('is-hidden');
    return detailLink;
  };

  const showPrompt = () => {
    if (!detail) return;
    detail.replaceChildren();
    detail.append(createElement('div', 'cst-detail-meta', `${projects.length} projects · ${categories.length} disciplines`));
    detail.append(createElement('h3', 'cst-detail-title', 'The work, mapped'));
    detail.append(createElement('span', 'cst-detail-rule', ''));
    detail.append(createElement('p', 'cst-detail-summary', 'Every point is a project, set on an orbit within its discipline. Hover or focus a point to read it, click a rim label to isolate a discipline, and scroll to turn the dial.'));
    detail.classList.add('is-visible', 'is-prompt');
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
    const activeNode = activeId ? byId.get(activeId) : null;
    nodes.forEach((node) => {
      const out = filteredOut(node);
      const focused = activeNode && (node.id === activeId || node.type === 'center' || (activeNode.cat && node.cat === activeNode.cat));
      node.el.classList.toggle('is-dim', out);
      node.el.classList.toggle('is-active', !!(activeNode && node.id === activeId));
      node.el.classList.toggle('is-muted', !!(activeNode && !focused && !out));
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

  // ── Canvas instrument + animation loop ────────────────────────
  const ctx = canvas.getContext('2d');
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  let running = false;
  let pointerInside = false;
  let lastW = 0;
  let lastH = 0;
  let last = performance.now();
  let tickRot = 0;
  let squareRot = 0;
  let haloPhase = 0;
  let engage = 0;

  const readColor = (name, fallback) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  const radial = (cx, cy, a, r1, r2) => {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  };
  const ring = (cx, cy, radius, color, alpha, width = 1) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
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

    const activeId = hoverId || pinId;
    const activeNode = activeId ? byId.get(activeId) : null;

    // Decorative layers spin continuously; nodes turn with scroll only (so they stay easy to target).
    tickRot += dt * 0.05;
    squareRot -= dt * 0.035;
    haloPhase += dt * 1.9;
    engage += ((activeNode && activeNode.type === 'project' ? 1 : 0) - engage) * 0.12;

    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    const rect = stage.getBoundingClientRect();
    const scrollP = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
    const nodeRot = (scrollP - 0.5) * 0.5;

    const cx = W / 2 + mouse.x * 14;
    const cy = H / 2 + mouse.y * 10;
    const R = Math.min(W, H) * 0.42;

    const cText = readColor('--text', '#0b0b0c');
    const cLine = readColor('--line', '#dedede');
    const cStrong = readColor('--line-strong', '#bcbcbc');
    const cMuted = readColor('--muted', '#696969');

    nodes.forEach((node) => {
      const a = node.ang + nodeRot;
      node.x = cx + Math.cos(a) * node.r * R;
      node.y = cy + Math.sin(a) * node.r * R;
      node.el.style.transform = `translate(${node.x}px, ${node.y}px) translate(-50%, -50%)`;
    });

    // 1) bounding construction circles
    ring(cx, cy, R, cStrong, 0.5, 1);
    ring(cx, cy, R * 0.93, cLine, 0.6, 1);

    // 2) graduated bezel ticks (rotating)
    ctx.strokeStyle = cStrong;
    for (let k = 0; k < 72; k++) {
      const a = tickRot + (k / 72) * Math.PI * 2;
      const major = k % 6 === 0;
      ctx.globalAlpha = major ? 0.6 : 0.28;
      ctx.lineWidth = 1;
      radial(cx, cy, a, R * (major ? 0.93 : 0.955), R);
    }

    // 3) Vitruvian multi-square (ghosted, counter-rotating)
    const sq = (R * 0.84) / Math.SQRT2;
    [-0.16, 0, 0.16].forEach((off, idx) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(squareRot + off);
      ctx.strokeStyle = cText;
      ctx.globalAlpha = idx === 1 ? 0.1 : 0.045;
      ctx.lineWidth = 1;
      ctx.strokeRect(-sq, -sq, sq * 2, sq * 2);
      ctx.restore();
    });

    // 4) orbit guide rings
    ORBITS.forEach((o) => ring(cx, cy, o * R, cLine, 0.5, 1));

    // 5) sector dividers
    ctx.strokeStyle = cLine;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = 1;
    for (let i = 0; i < sectorCount; i++) {
      const a = -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / sectorCount) + nodeRot;
      radial(cx, cy, a, R * 0.16, R * 0.9);
    }

    // 6) radial connectors centre → project
    connectors.forEach((node) => {
      const out = filteredOut(node);
      const focused = activeNode && (node.id === activeId || (activeNode.cat && node.cat === activeNode.cat));
      ctx.strokeStyle = (focused && !out) ? cText : cMuted;
      ctx.globalAlpha = out ? 0.05 : focused ? 0.5 : activeNode ? 0.12 : 0.26;
      ctx.lineWidth = 1;
      const a = node.ang + nodeRot;
      radial(cx, cy, a, R * 0.12, node.r * R);
    });

    // 7) centre hub ring + crosshair
    ring(cx, cy, 30, cText, 0.5, 1);
    ctx.strokeStyle = cText;
    ctx.globalAlpha = 0.4;
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((a) => radial(cx, cy, a, 30, 38));

    // 8) lock-on halo on the focused project (the mechanical "wow")
    if (activeNode && activeNode.type === 'project' && engage > 0.01) {
      const { x, y, orbit } = activeNode;
      ring(cx, cy, orbit * R, cText, 0.45 * engage, 1.3);
      const baseR = 15 + (1 - engage) * 16;
      ctx.strokeStyle = cText;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = engage;
      for (let g = 0; g < 3; g++) {
        const a0 = haloPhase + g * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(x, y, baseR, a0, a0 + Math.PI * 0.42);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7 * engage;
      for (let g = 0; g < 2; g++) {
        const a0 = -haloPhase * 1.3 + g * Math.PI;
        ctx.beginPath();
        ctx.arc(x, y, baseR - 6, a0, a0 + Math.PI * 0.62);
        ctx.stroke();
      }
      ctx.globalAlpha = engage;
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((a) => radial(x, y, a, baseR + 4, baseR + 10));
    }

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

const paths = {
  site: 'data/site.json?v=20260621-2',
  resume: 'data/resume.json?v=20260621-2',
  projects: 'data/projects.json?v=20260621-2'
};

const state = {
  site: null,
  resume: null,
  projects: [],
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
    article.append(createElement('strong', '', metric.value));
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
  const container = select('[data-experience]');
  if (!container) return;
  container.replaceChildren();

  (resume.experience || []).forEach((experience, index) => {
    const article = addReveal(createElement('article', 'timeline-item'));
    article.style.setProperty('--stagger', `${index * 140}ms`);
    const date = createElement('div', 'timeline-date', experience.range);
    const content = createElement('div', 'timeline-content');

    content.append(createElement('h3', '', experience.role));
    content.append(createElement('div', 'item-meta', `${experience.company} - ${experience.location}`));
    content.append(createElement('p', '', experience.summary));

    if (experience.highlights?.length) {
      const list = createElement('ul', 'clean-list');
      experience.highlights.forEach((highlight) => list.append(createElement('li', '', highlight)));
      content.append(list);
    }

    if (experience.tools?.length) content.append(createTagRow(experience.tools));

    article.append(date, content);
    container.append(article);
  });
}

function getProjectFilters(projects) {
  return ['All', ...new Set(projects.map((project) => project.category).filter(Boolean))];
}

function renderProjectFilters() {
  const container = select('[data-project-filters]');
  if (!container) return;
  container.replaceChildren();

  getProjectFilters(state.projects).forEach((filter) => {
    const button = createElement('button', 'filter-button', filter);
    button.type = 'button';
    button.setAttribute('aria-pressed', filter === state.activeProjectFilter ? 'true' : 'false');
    button.addEventListener('click', () => {
      state.activeProjectFilter = filter;
      renderProjectFilters();
      renderProjects();
      observeRevealItems();
    });
    container.append(button);
  });
}

function renderProjects() {
  const container = select('[data-projects]');
  if (!container) return;
  container.replaceChildren();

  const projects = state.activeProjectFilter === 'All'
    ? state.projects
    : state.projects.filter((project) => project.category === state.activeProjectFilter);

  projects.forEach((project) => {
    const article = addReveal(createElement('article', 'project-card'));
    if (project.featured) article.classList.add('is-featured');
    const header = document.createElement('header');
    if (project.featured) header.append(createElement('span', 'project-badge', 'Featured'));
    header.append(createElement('div', 'project-meta', `${project.category} - ${project.range}`));
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
    article.append(createElement('div', 'item-meta', `${education.range} - ${education.location}`));
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
    article.append(createElement('div', 'item-meta', `${publication.venue} - ${publication.year}`));
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

function applyLang(site, resume) {
  if (state.lang === 'en') return { site, resume };
  const fr = site.i18n?.fr;
  if (!fr) return { site, resume };

  const siteOut = {
    ...site,
    navigation: fr.navigation || site.navigation,
    hero: { ...site.hero, ...(fr.hero || {}) },
    sections: Object.fromEntries(
      Object.entries(site.sections).map(([key, sec]) => [
        key, { ...sec, ...(fr.sections?.[key] || {}) }
      ])
    ),
    contact: { ...site.contact, ...(fr.contact || {}) }
  };

  const resumeOut = {
    ...resume,
    profile: { ...resume.profile, ...(fr.profile || {}) }
  };

  return { site: siteOut, resume: resumeOut };
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
    const { site: s, resume: r } = applyLang(state.site, state.resume);
    renderNavigation(s);
    renderHero(s, r);
    renderSectionCopy(s);
    initScrollFeedback();
  });
}

const GH_USER = 'achref-soua';
const LANG_COLORS = {
  Rust: '#dea584', Python: '#3572A5', TypeScript: '#3178c6',
  JavaScript: '#f1e05a', 'C++': '#f34b7d', Go: '#00ADD8',
  Svelte: '#ff3e00', CSS: '#563d7c', HTML: '#e34c26'
};

async function renderGitHubDashboard() {
  const container = select('[data-github-dashboard]');
  if (!container) return;

  try {
    const [user, repos] = await Promise.all([
      fetch(`https://api.github.com/users/${GH_USER}`).then(r => r.json()),
      fetch(`https://api.github.com/users/${GH_USER}/repos?sort=updated&per_page=100`).then(r => r.json())
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
      stat.append(createElement('strong', '', String(val ?? '—')));
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
    observeRevealItems();
  } catch {
    const msg = createElement('p', 'gh-error', 'GitHub stats unavailable — try again later.');
    container.replaceChildren(msg);
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
    const [site, resume, projects] = await Promise.all([
      loadJSON(paths.site),
      loadJSON(paths.resume),
      loadJSON(paths.projects)
    ]);

    state.site = site;
    state.resume = resume;
    state.projects = projects;

    const { site: s, resume: r } = applyLang(site, resume);

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

    renderGitHubDashboard().catch(() => {});
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

init();

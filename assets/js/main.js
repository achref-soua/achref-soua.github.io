/* main.js — Interactive Resume with smooth animations and performance optimization */
const YEAR_EL = document.getElementById('year');
const SUMMARY = document.getElementById('summary');
const EXPERIENCE_LIST = document.getElementById('experience-list');
const PROJECTS_GRID = document.getElementById('projects-grid');
const SKILLS_LIST = document.getElementById('skills-list');
const PUBLICATIONS_LIST = document.getElementById('publications-list');
const PROJECT_FILTER = document.getElementById('project-filter');
const EMAIL_LINK = document.getElementById('email-link');
const COPY_EMAIL_BTN = document.getElementById('copy-email');
const GITHUB_LINK = document.getElementById('github-link');
const LINKEDIN_LINK = document.getElementById('linkedin-link');
const THEME_TOGGLE = document.getElementById('theme-toggle');

/* Year */
YEAR_EL.textContent = new Date().getFullYear();

/* Smooth scroll behavior */
document.documentElement.style.scrollBehavior = 'smooth';

/* Load JSON with caching */
async function loadJSON(path) {
  try {
    const res = await fetch(path, { 
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  } catch (err) {
    console.error('JSON load error:', err);
    throw err;
  }
}

/* Render Experience - optimized with DocumentFragment */
function renderExperience(items) {
  const fragment = document.createDocumentFragment();
  items.forEach((exp, i) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <strong>${exp.role}</strong>
      <div><em>${exp.company}</em> • ${exp.location} • <span class="muted">${exp.range}</span></div>
      <p style="margin-top:0.75rem">${exp.summary}</p>
    `;
    el.style.animationDelay = (i * 0.05) + 's';
    fragment.appendChild(el);
  });
  EXPERIENCE_LIST.appendChild(fragment);
}

/* Render Projects - optimized with DocumentFragment */
function renderProjects(items) {
  const fragment = document.createDocumentFragment();
  const tags = new Set();
  items.forEach(p => p.tags.forEach(t => tags.add(t)));
  
  // Populate filter
  const old = Array.from(PROJECT_FILTER.options).map(o => o.value);
  Array.from(tags).sort().forEach(t => {
    if (!old.includes(t)) PROJECT_FILTER.appendChild(new Option(t, t));
  });

  items.forEach((p, i) => {
    const el = document.createElement('article');
    el.className = 'project';
    el.dataset.tags = p.tags.join(',');
    el.innerHTML = `
      <h4>${p.title}</h4>
      <div class="muted">${p.range} ${p.role ? '• ' + p.role : ''}</div>
      <p>${p.summary}</p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:auto">${p.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>
      ${p.link ? `<div style="margin-top:1rem"><a href="${p.link}" target="_blank" rel="noopener noreferrer">Learn More →</a></div>` : ''}
    `;
    el.style.animationDelay = (i * 0.08) + 's';
    fragment.appendChild(el);
  });
  PROJECTS_GRID.appendChild(fragment);
}

/* Render Skills - optimized with DocumentFragment */
function renderSkills(list) {
  const fragment = document.createDocumentFragment();
  list.forEach((s, i) => {
    const sp = document.createElement('span');
    sp.className = 'chip';
    sp.textContent = s;
    sp.style.animationDelay = (i * 0.03) + 's';
    fragment.appendChild(sp);
  });
  SKILLS_LIST.appendChild(fragment);
}

/* Render Publications - optimized with DocumentFragment */
function renderPublications(list) {
  const fragment = document.createDocumentFragment();
  list.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `<strong>${p.citation}</strong><div class="muted">${p.venue} • ${p.year}</div>`;
    el.style.animationDelay = (i * 0.05) + 's';
    fragment.appendChild(el);
  });
  PUBLICATIONS_LIST.appendChild(fragment);
}

/* Filter Projects */
function applyFilter() {
  const v = PROJECT_FILTER.value;
  Array.from(PROJECTS_GRID.children).forEach((card, idx) => {
    if (v === 'all') {
      setTimeout(() => {
        card.style.display = '';
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        card.style.transform = 'translateY(0)';
      }, idx * 30);
    } else {
      const show = card.dataset.tags.includes(v);
      if (show) {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
          card.style.transform = 'translateY(0)';
        }, idx * 30);
      } else {
        card.style.opacity = '0.2';
        card.style.pointerEvents = 'none';
        card.style.transform = 'translateY(10px)';
      }
    }
  });
}

/* Copy Email */
COPY_EMAIL_BTN.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(EMAIL_LINK.textContent);
    const orig = COPY_EMAIL_BTN.textContent;
    COPY_EMAIL_BTN.textContent = '✓ Copied!';
    setTimeout(() => COPY_EMAIL_BTN.textContent = orig, 2000);
  } catch (e) {
    COPY_EMAIL_BTN.textContent = '✗ Copy failed';
  }
});

/* Phone click to copy */
document.getElementById('phone')?.addEventListener('click', async e => {
  const txt = e.target.textContent;
  try {
    await navigator.clipboard.writeText(txt);
    const orig = e.target.textContent;
    e.target.textContent = '✓ Copied!';
    setTimeout(() => e.target.textContent = orig, 2000);
  } catch (err) {
    console.error('Copy failed', err);
  }
});

/* Theme Toggle */
function initTheme() {
  const isDark = localStorage.getItem('theme') === 'dark' || 
                 (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('theme'));
  if (isDark) {
    document.documentElement.classList.add('dark');
    THEME_TOGGLE.textContent = '☀️';
  } else {
    THEME_TOGGLE.textContent = '🌙';
  }
}

THEME_TOGGLE.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  THEME_TOGGLE.textContent = isDark ? '☀️' : '🌙';
});

/* Scroll animations - Intersection Observer for fade in */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

/* Observe cards for animation on scroll */
function observeCards() {
  const cards = document.querySelectorAll('.card, .project, .item');
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
}

/* Active link highlighting in navigation */
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
}

/* Navbar active link styling */
const style = document.createElement('style');
style.textContent = `
  .nav a.active {
    opacity: 1;
    text-decoration: underline;
    text-underline-offset: 0.5rem;
  }
`;
document.head.appendChild(style);

/* Filter listener */
PROJECT_FILTER.addEventListener('change', applyFilter);

/* Scroll listener */
window.addEventListener('scroll', updateActiveNavLink);

/* Initialize */
initTheme();

(async function init() {
  try {
    const resume = await loadJSON('data/resume.json');
    const projects = await loadJSON('data/projects.json');
    
    SUMMARY.textContent = resume.summary;
    renderExperience(resume.experience);
    renderSkills(resume.skills);
    renderPublications(resume.publications);
    renderProjects(projects);

    EMAIL_LINK.textContent = resume.contact.email;
    EMAIL_LINK.href = 'mailto:' + resume.contact.email;
    GITHUB_LINK.href = resume.contact.github || '#';
    LINKEDIN_LINK.href = resume.contact.linkedin || '#';
    
    /* Observe cards after rendering */
    setTimeout(() => {
      observeCards();
    }, 100);

  } catch (err) {
    console.error('Failed to load resume data:', err);
    SUMMARY.textContent = 'Failed to load resume data. Please refresh the page.';
  }
})();

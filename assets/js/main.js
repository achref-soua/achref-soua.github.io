/* main.js — render resume and provide UI behaviors */
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

YEAR_EL.textContent = new Date().getFullYear();

async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('Failed to load '+path);
  return res.json();
}

function renderExperience(items){
  EXPERIENCE_LIST.innerHTML = '';
  items.forEach(exp => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <strong>${exp.role}</strong> — <em>${exp.company}</em>
      <div class="muted">${exp.location} • ${exp.range}</div>
      <div style="margin-top:8px">${exp.summary}</div>
    `;
    EXPERIENCE_LIST.appendChild(el);
  });
}

function renderProjects(items){
  PROJECTS_GRID.innerHTML = '';
  const tags = new Set();
  items.forEach(p => { p.tags.forEach(t=>tags.add(t)) });
  // populate filter
  const old = Array.from(PROJECT_FILTER.options).map(o=>o.value);
  tags.forEach(t=>{ if(!old.includes(t)) PROJECT_FILTER.appendChild(new Option(t,t)); });

  items.forEach(p => {
    const el = document.createElement('article');
    el.className = 'project';
    el.dataset.tags = p.tags.join(',');
    el.innerHTML = `
      <h4>${p.title}</h4>
      <div class="muted" style="font-size:13px">${p.range} • ${p.role||''}</div>
      <p style="margin:8px 0">${p.summary}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${p.tags.map(t=>`<span class="chip">${t}</span>`).join('')}</div>
      <div style="margin-top:8px"><a href="${p.link||'#'}" target="_blank">Details</a></div>
    `;
    PROJECTS_GRID.appendChild(el);
  });
}

function renderSkills(list){
  SKILLS_LIST.innerHTML = '';
  list.forEach(s => {
    const sp = document.createElement('span');
    sp.className = 'chip';
    sp.textContent = s;
    SKILLS_LIST.appendChild(sp);
  });
}

function renderPublications(list){
  PUBLICATIONS_LIST.innerHTML = '';
  list.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `<strong>${p.citation}</strong><div class="muted">${p.venue} • ${p.year}</div>`;
    PUBLICATIONS_LIST.appendChild(el);
  })
}

function applyFilter(){
  const v = PROJECT_FILTER.value;
  Array.from(PROJECTS_GRID.children).forEach(card=>{
    if(v==='all') card.style.display = '';
    else card.style.display = card.dataset.tags.includes(v) ? '' : 'none';
  })
}

// UI bits
COPY_EMAIL_BTN.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(EMAIL_LINK.textContent);
    COPY_EMAIL_BTN.textContent = 'Copied!';
    setTimeout(()=>COPY_EMAIL_BTN.textContent = 'Copy Email',2000);
  }catch(e){
    COPY_EMAIL_BTN.textContent = 'Copy failed';
  }
});

PROJECT_FILTER.addEventListener('change', applyFilter);

document.getElementById('phone')?.addEventListener('click', e=>{
  const txt = e.target.textContent; navigator.clipboard?.writeText(txt);
});

// theme toggle
document.getElementById('theme-toggle').addEventListener('click', ()=>{
  document.documentElement.classList.toggle('dark');
});

(async function init(){
  try{
    const resume = await loadJSON('data/resume.json');
    const projects = await loadJSON('data/projects.json');
    SUMMARY.textContent = resume.summary;
    renderExperience(resume.experience);
    renderSkills(resume.skills);
    renderPublications(resume.publications);
    renderProjects(projects);

    EMAIL_LINK.textContent = resume.contact.email;
    EMAIL_LINK.href = 'mailto:'+resume.contact.email;
    GITHUB_LINK.href = resume.contact.github || '#';
    LINKEDIN_LINK.href = resume.contact.linkedin || '#';

  }catch(err){
    console.error(err);
    SUMMARY.textContent = 'Failed to load resume data.';
  }
})();

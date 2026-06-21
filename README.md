# Achref SOUA Portfolio

A minimal black-and-white portfolio for **Achref SOUA**, built as a static GitHub Pages site with config-driven content.

The site is intentionally dependency-free: HTML, CSS, JavaScript, and JSON. Run it through a local server because the browser needs to fetch the JSON config files.

## Run Locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Edit Content

Most updates happen in `data/`.

- `data/site.json`: SEO metadata, navigation, hero copy, section headings, contact section text.
- `data/resume.json`: profile, metrics, focus areas, experience, education, skills, publications, contact links.
- `data/projects.json`: project cards, categories, highlights, stack tags, impact lines, links.

### Add Experience

Add an object to `data/resume.json` under `experience`:

```json
{
  "company": "Company",
  "role": "Data Scientist",
  "location": "City, Country",
  "range": "Jan 2026 - Present",
  "summary": "Short role summary.",
  "highlights": [
    "Specific achievement or responsibility.",
    "Another concrete result."
  ],
  "tools": ["Python", "AWS", "LLMs"]
}
```

### Add Project

Add an object to `data/projects.json`:

```json
{
  "title": "Project Name",
  "category": "LLM Systems",
  "range": "2026",
  "role": "Lead Developer",
  "summary": "What the project does.",
  "highlights": [
    "How it works.",
    "What made it valuable."
  ],
  "stack": ["LangGraph", "FastAPI", "AWS"],
  "impact": "Concrete result or outcome.",
  "link": "#"
}
```

Project filter buttons are generated automatically from each project's `category`.

## Design System

- Monochrome palette with light and dark modes.
- System font stack for a clean, Apple-inspired feel.
- Large editorial hero, restrained borders, and compact repeated cards.
- Scroll-driven horizontal career timeline (pinned, one experience per scroll) with a swipeable carousel on mobile and a stacked fallback for reduced motion.
- Interactive projects constellation: a canvas-drawn knowledge graph (projects orbiting category hubs) that rotates with scroll and tilts toward the cursor; hovering or focusing a node opens its details. Falls back to the card grid on touch and reduced-motion devices.
- Animated count-up metrics, smooth reveal animations, and full reduced-motion support.
- Print-friendly resume view through the print stylesheet.

## Files

```text
.
├── index.html
├── assets/
│   ├── achref_soua_picture.png
│   ├── favicon.svg
│   ├── css/style.css
│   └── js/main.js
├── data/
│   ├── site.json
│   ├── resume.json
│   └── projects.json
├── robots.txt
└── sitemap.xml
```

## Deploy

This repository is ready for GitHub Pages. Push to the GitHub Pages branch configured for the repository, and the static files will serve directly.

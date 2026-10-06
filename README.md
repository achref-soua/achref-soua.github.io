# Achref SOUA Portfolio

A portfolio with bold typography and a warm ink palette for **Achref SOUA**, built as a static GitHub Pages site with config-driven content.

The site is intentionally dependency-free: HTML, CSS, JavaScript, and JSON. Run it through a local server because the browser needs to fetch the JSON config files.

## Run Locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Edit Content

Most updates happen in `data/`.

- `data/site.json`: SEO metadata, navigation, hero copy, section headings, contact section text.
- `data/resume.json`: profile, metrics, focus areas, experience, education, skills, publications, contact links. The experience metric calculates completed years from `profile.experienceStart` (`2023-02`) whenever the page renders, in either language.
- `data/projects.json`: project cards, categories, highlights, stack tags, impact lines, links.
- `data/i18n.fr.json`: French profile and project copy. Match project `title` to the English source and use `displayTitle` for the translated title.

Keep the static metadata and fallback copy in `index.html` in sync with the JSON. Bump the cache version in `index.html` and `assets/js/main.js` after edits.

Portrait display is capped at 300 px on desktop and 280 px on smaller screens. The original image is stored unchanged. Fonts are served locally; their [upstream project](https://github.com/ateliertriay/bricolage) and license are retained in `assets/fonts/`.

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

- Warm cream and rust palette with light and dark modes.
- Self-hosted Bricolage Grotesque variable fonts for bold headings and readable body text.
- Large editorial hero, restrained borders, and compact repeated cards.
- Scroll-driven horizontal career timeline (pinned, one experience per scroll) with a swipeable carousel on mobile and a stacked fallback for reduced motion.
- Animated count-up metrics, smooth reveal animations, and full reduced-motion support.
- Print-friendly resume view through the print stylesheet.

## Files

```text
.
├── index.html
├── assets/
│   ├── achref-soua-portrait.png
│   ├── fonts/ (Bricolage Grotesque, SIL OFL license included)
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


## GitHub and Medium data

The browser loads GitHub statistics and Medium articles independently, with six-second request timeouts. When a live service fails, it uses the public `assets/portfolio-activity.json` snapshot refreshed by the existing daily profile-card job in `achref-soua/achref-soua`. `data/activity.json` is a local backup for a full external-service outage. No API credentials are shipped to the browser. Saved GitHub data shows its update date. Language changes reuse the loaded data.

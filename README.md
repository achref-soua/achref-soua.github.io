# achref-soua.github.io — Personal portfolio / interactive resume

This repository contains a small, professional static website (HTML/CSS/JS) that serves as an interactive resume and portfolio for Achref SOUA.

Contents
- `index.html` — main entry
- `assets/css/style.css` — styles
- `assets/js/main.js` — client-side renderer and UI
- `data/resume.json` — structured resume data
- `data/projects.json` — projects metadata

How to use

1. Customize any content in `data/resume.json` and `data/projects.json`.
2. Preview locally: open `index.html` in a browser or serve with a static server.

Deploy to GitHub Pages (recommended for username.github.io):

1. Create a repository named `achref-soua.github.io` on your GitHub account (if not already created).
2. Commit and push the files to the `main` branch. GitHub Pages will automatically serve the site at `https://achref-soua.github.io/`.

Alternative: use GitHub Actions to build and deploy to `gh-pages` — not necessary for a plain static site.

Assumptions & notes
- I added your current role at PrediSurge (Saint-Étienne) as the active position per your message.
- The site is intentionally minimal (no build step) so it's easy to manage from the repo root.
- Optional improvements: add a downloadable PDF resume, hosted images, analytics, contact form backend, and a CI action to test link validity.

Next steps I can take for you
- Add a `resume.pdf` and link a download button.
- Add an accessible contact form with serverless submission (Netlify Functions / Formspree).
- Improve visual polish, add animations or a theme switch with persisted preference.

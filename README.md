# achref-soua.github.io — Interactive AI Engineer Portfolio

A modern, professional static website (HTML/CSS/JS) serving as an interactive resume and portfolio for **Achref SOUA**, an AI Engineer specializing in LLMs, medical imaging, and embedded systems.

## Features

### Design & UX
- **Modern Aesthetic**: Gradient backgrounds, glassmorphism cards, smooth animations
- **Dark Mode**: Automatic theme detection with persistent user preference
- **Responsive Design**: Mobile-first approach, optimized for all screen sizes
- **Smooth Interactions**: Scroll-based animations, hover effects, active link highlighting
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

### Content & Sections
- **Hero Section**: Professional introduction with profile image, quick actions
- **About**: Dynamic summary loaded from JSON
- **Experience Timeline**: 4 positions including current PrediSurge role
- **Projects & Competitions**: Filterable project cards with tags
- **Technical Skills**: Organized skill chips with hover animations
- **Publications**: Peer-reviewed research papers
- **Contact**: Multiple contact methods with copy-to-clipboard functionality

### Performance & SEO
- **SEO Optimized**: Comprehensive meta tags, Open Graph, Twitter Cards
- **Structured Data**: JSON-LD schema for rich search results
- **Performance**: Optimized DOM rendering with DocumentFragment, CSS preloading
- **Sitemap & Robots**: Auto-discoverable by search engines
- **Fast Load Times**: 17KB CSS, 8.6KB JS, 8.3KB HTML

## File Structure

```
achref-soua.github.io/
├── index.html           # Main page with SEO metadata & critical CSS
├── assets/
│   ├── css/
│   │   └── style.css    # Modern responsive styles (861 lines)
│   ├── js/
│   │   └── main.js      # Interactive features & data rendering
│   └── achref_soua_picture.jpg  # Profile image
├── data/
│   ├── resume.json      # Professional experience & skills
│   └── projects.json    # Kaggle competitions & research projects
├── sitemap.xml          # SEO sitemap
├── robots.txt           # Search engine directives
├── README.md            # This file
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Actions auto-deployment
```

## Quick Start

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/achref-soua/achref-soua.github.io.git
   cd achref-soua.github.io
   ```

2. Open in browser:
   - Simply open `index.html` in any web browser, or
   - Use a local server: `python -m http.server 8000` then visit `http://localhost:8000`

### Deployment to GitHub Pages

The site automatically deploys via GitHub Actions workflow. Every push to `main` branch triggers:
1. Automatic build process
2. Deployment to `gh-pages` branch
3. Live at `https://achref-soua.github.io/`

## ✏️ Customization

### Update Resume Content
Edit `data/resume.json`:
- Name, title, location
- Summary
- Contact information
- Work experience
- Education
- Technical skills
- Publications

### Update Projects
Edit `data/projects.json`:
- Add/remove project cards
- Modify tags for filtering
- Update links and descriptions

### Modify Styles
Edit `assets/css/style.css`:
- Color theme (CSS variables in `:root`)
- Spacing and layouts
- Animations and transitions

### Customize Theme Colors
Change the `:root` variables in `style.css`:
```css
:root {
  --primary: #6366f1;      /* Indigo */
  --secondary: #ec4899;    /* Pink */
  --accent: #8b5cf6;       /* Purple */
  /* ... */
}
```

## Features Highlight

### Interactive Elements
 - Dark/Light mode toggle
 - Smooth scroll navigation
 - Copy email to clipboard
 - Copy phone to clipboard
 - Project filtering by category
 - Hover animations & micro-interactions

### Advanced Features
 - Intersection Observer for scroll animations
 - Active link highlighting based on scroll position
 - Gradient text effects on titles
 - Glassmorphism effects on cards
 - Shimmer animation on header logo
 - Smooth project filtering with staggered transitions

### Performance Optimizations
 - Document Fragment rendering for DOM efficiency
 - Critical CSS inlined for faster first paint
 - Resource preloading for JSON data
 - Optimized image with responsive attributes
 - CSS will-change hints on animated elements

## Browser Support

 - Chrome/Edge: Full support
 - Firefox: Full support
 - Safari: Full support
 - Mobile browsers: Fully responsive

## SEO Features

- Comprehensive meta tags (description, keywords, author)
- Open Graph tags for social sharing
- Twitter Card support
- JSON-LD structured data (Person schema)
- XML sitemap with priority levels
- robots.txt for search engine guidance
- Semantic HTML5 markup

## Performance Metrics

- **CSS**: 17KB (unminified, readable)
- **JavaScript**: 8.6KB (unminified, readable)
- **HTML**: 8.3KB (with inline critical CSS)
- **Total**: ~824KB with image

## Tech Stack

### Frontend
- **HTML5**: Semantic markup, microdata
- **CSS3**: Flexbox, Grid, custom properties, animations
- **Vanilla JavaScript**: No dependencies, ~180 lines

### Data Management
- JSON files for structured content
- Async/await for data loading

### Deployment
- GitHub Pages (automatic)
- GitHub Actions CI/CD

## Assumptions & Notes

- Site is intentionally minimal (no build step) for easy maintenance
- All data is client-side rendered from JSON
- Theme preference is stored in localStorage
- No external dependencies (no jQuery, Bootstrap, etc.)
- Image optimized but not compressed (consider WebP conversion)

## Optional Enhancements

- [ ] Add downloadable resume as PDF
- [ ] Integrate contact form with backend service
- [ ] Add blog section for technical articles
- [ ] Implement analytics (Google Analytics / Plausible)
- [ ] Add testimonials section
- [ ] Compress images to WebP format
- [ ] Add CI workflow for HTML validation
- [ ] Create mobile app version

## Contact

- Email: achrefsoua10@email.com
- GitHub: https://github.com/achref-soua
- LinkedIn: https://www.linkedin.com/in/achrefsoua

## License

This portfolio is open-source and free to use as a template for your own projects.

---

**Built with passion** — HTML, CSS & Vanilla JavaScript. No frameworks, no bloat. Just clean, fast, modern web.


# Agent Guidelines for HTML, CSS & JavaScript Websites

This document outlines best practices and anti-patterns for static, multi-page websites built with **plain HTML, CSS, and JavaScript**. Use it when modifying or extending this codebase.

---

## For AI Agents: Building a New Website

**Read this document before starting.** Follow these guidelines when the user asks you to build a website unless they specify otherwise.

**When working in a Git repository:** Follow the Git Workflow in [README.md](./README.md)—create a feature branch (`<initials>/<website-name>`), build on that branch, then commit and push.

**Before starting the build:** Confirm **fonts** (family names and weights, or self-hosted files), **color palette** (hex values or design tokens), **logo** (formats, dimensions, and variants such as light/dark or horizontal/stacked), and **other assets** (photos, icons, illustrations, video) with whoever owns the brand (client, designer, or developer)—before locking `:root` CSS variables, typography scale, and layout. If those inputs are not available, use clearly marked placeholders (e.g. comments or `TODO` notes in CSS and a short checklist in the README or issue) and list what is still needed so nothing is mistaken for final art direction.

**Suggested build order:**

1. Create the file structure (css/, js/, assets/, includes/ if using a build step)
2. Create shared `main.css` and `main.js`; use them from all pages
3. Build shared components (header, footer, nav) as partials or copy into each page
4. Add pages (index, about, contact, etc.) using the Common Patterns
5. Add GTM placeholder if analytics is needed; leave dataLayer init and container ID for the user to fill
6. Add `404.html` with "Page not found" message and link to home (if the hosting environment supports it)
7. Update README with the site name, description, and run commands
8. If in a Git repo: commit and push per the Git Workflow in README

**If the user's request is unclear:** Ask before assuming. For example: Do they want a build tool (Eleventy, Jekyll) for includes, or plain HTML with shared snippets? Do they have GTM/analytics IDs? What pages or sections do they need? Are **fonts**, **colors**, and **assets** finalized (see **Before starting the build** above)?

**Before delivering:** Confirm DOCTYPE and `lang`, skip-to-content link, focus states, form labels, alt text on images, favicon, and that header/footer are consistent across pages. If any fonts, colors, or assets were placeholders, confirm they are replaced or explicitly documented as temporary. Update README per the "When building the project" note below.

**When fixing an existing site:**

- Audit the site against this document (Best Practices and Anti-Patterns).
- Prioritize: security and accessibility first, then structure (shared CSS/JS, components), then tracking consolidation (remove duplicate GTM/gtag).
- Migrate inline `onclick` and global tracking functions to data attributes and event delegation.
- Fix or remove dead code: when markup changes, remove orphaned DOM queries and listeners instead of leaving only null checks for elements that no longer exist.

---

## Best Practices

### HTML

- **Semantic markup**: Use `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>` for structure. Avoid overusing generic `<div>` when a semantic element fits.
- **Accessibility**: Include `aria-label` on sections, `alt` on images, `aria-expanded` on toggles, and ensure `role` is correct where needed. Dropdowns and menus must support keyboard navigation (Enter/Space to toggle, Escape to close, arrow keys where applicable). Provide visible focus states on interactive elements. Add a skip-to-content link at the top (e.g. `href="#main"`) with `id="main"` on `<main>` for screen readers. Aim for WCAG AA contrast (4.5:1 for text, 3:1 for large text).
- **Document basics**: Use `<!DOCTYPE html>`, `<html lang="en">` (or the page language), and place `<meta charset="utf-8">` and `<meta name="viewport">` at the top of `<head>`.
- **Canonical and social**: Use absolute URLs for `og:image`, `twitter:image`, and `canonical` so crawlers resolve them correctly (use the site's domain or a configurable base URL). Include favicon (`favicon.ico` or `link rel="icon"`) and `apple-touch-icon` when possible.
- **Form behavior**: Associate each input with a `<label>` (use `for`/`id` or wrap). Avoid `action="#"` for forms that submit via JavaScript unless intentional; ensure the submit handler calls `preventDefault()`.
- **Link consistency**: Use consistent URL formats. Use `rel="noopener noreferrer"` on links with `target="_blank"`.

### CSS

- **External styles**: Move shared styles into a single stylesheet and load it via `<link rel="stylesheet" href="...">` to avoid duplication.
- **CSS variables**: Use `:root` variables for colors, spacing, and typography instead of raw values for consistency.
- **Fonts, colors, and assets**: Align `:root` tokens, font imports or `@font-face` rules, and image paths with what the project owner confirmed per **Before starting the build** above. Keep a single source of truth for brand colors and type; if assets are still provisional, mark placeholders clearly and avoid presenting them as final brand decisions.
- **Breakpoints**: Use a consistent set of breakpoints across all pages (e.g. 768px, 1024px). Avoid arbitrary variation.
- **Avoid `!important`**: Use it only when truly necessary. Prefer specificity and structure over overrides.
- **Readability**: Keep CSS readable; minification can be done at build time if needed.

### JavaScript

- **External scripts**: Move shared scripts into a `.js` file and load with `<script src="..."></script>`. Non-trivial or reused script belongs in a file, not a long inline block.
- **Event handling**: Prefer `data-*` attributes with event delegation over inline `onclick` handlers for trackability and maintainability. Register each interaction in one place (e.g. one delegated listener or one init path); avoid duplicating the same handler logic across scripts or load hooks.
- **Scope**: Avoid global functions when possible. Use IIFEs or modules to reduce pollution. Prefer `const` and `let` over `var`.
- **DOM ready**: Query and manipulate the DOM only after `DOMContentLoaded` (or place scripts at end of `<body>`).
- **Analytics**: Use a single pattern for tracking site-wide. Ensure `window.dataLayer` is defined before using `dataLayer.push`. Do not define tracking helpers at the top level of an inline `<script>` block; use an external file, IIFE, or module so tracking does not pollute globals.
- **Defensive checks**: Guard DOM lookups with null checks before calling methods. If the element was removed from the page, remove the related code instead of relying only on guards.
- **Heavy handlers**: Debounce or throttle scroll, resize, and input handlers to avoid blocking the main thread.
- **Form submission**: Validate required fields and any captcha before submitting. Handle fetch errors and show user feedback. For static sites, forms need an endpoint (Formspree, Netlify Forms, or a backend); leave the endpoint/config for the user to add.

### SEO & Google Tag Manager

- **SEO basics**: Use a unique `<title>` and `<meta name="description">` per page. One `<h1>` per page, then `<h2>` for sections, `<h3>` for sub-sections—do not skip levels.
- **JSON-LD**: Add structured data when the site or page clearly fits a schema type—do not add empty or misleading markup. Use **Organization** (and **WebSite** on the home page when the site represents a brand or business) for typical company sites; use **LocalBusiness** (or a more specific subtype) when there is a real address or local discovery matters. Use **Article**, **Product**, **Event**, or **FAQPage** only when the page is genuinely that kind of content and the visible text matches the structured data. Skip JSON-LD on bare placeholders or when the client does not want SEO depth. Prefer one primary type per page; use [Google's Rich Results Test](https://search.google.com/test/rich-results) when adding anything beyond a simple Organization/WebSite block.
- **JSON-LD (how to ship it)**: Keep site-wide JSON-LD in one include, partial, or snippet; each built page should contain that data in an inline `<script type="application/ld+json">` in the HTML—avoid hand-pasting the same JSON into every file. Do not rely on client-side `fetch`/injection alone for schema that must be visible to crawlers. Put page-specific types only on the pages they describe.
- **URL structure**: Use lowercase, hyphen-separated URLs (`/contact-us/`, `/about-our-team/`). Avoid query strings for pages meant to be indexed. Consider `robots.txt` and `sitemap.xml` for crawlers.
- **Internal linking**: Link related pages using descriptive anchor text (not "click here").
- **Alt text**: Write descriptive, concise alt text for images. Avoid generic names like "image1.jpg". Use empty `alt=""` for purely decorative images.
- **GTM placement**: Place the GTM snippet as early in `<head>` as practical, after charset and viewport. Always initialize before GTM loads: `window.dataLayer = window.dataLayer || [];` Do not add a second GTM container or duplicate gtag alongside GTM—see **Single source** below.
- **Tracking**: Push events with `dataLayer.push()`. Avoid mixing GTM with direct gtag/GA scripts on the same page unless intentional. Include the GTM noscript iframe in `<body>`.
- **Single source**: If using GTM, centralize tracking configuration in GTM rather than scattering inline scripts. Do not load both GTM and a separate gtag.js script on the same page—it can cause double tracking.

### Component Reusability

- **HTML**: Extract repeated markup (header, footer, nav, cards, contact blocks) into shared partials or templates. Use a build step that can include the items rather than copy-pasting across pages. Indicate the current page in nav (e.g. `aria-current="page"` or a `.on` / `.active` class).
- **CSS**: Create reusable classes for common patterns (buttons, cards, grids, forms). Use a consistent naming convention (e.g. BEM). Avoid duplicating nearly identical rules with small variations.
- **JavaScript**: Extract repeated logic into reusable functions or modules. Use the same pattern for similar interactions (e.g. one accordion/modal pattern site-wide).

### Performance

- **Images**: Use `loading="lazy"` for below-the-fold images. Set `width` and `height` to avoid layout shift (CLS). Use `srcset` and `sizes` for responsive images when serving multiple resolutions. Prefer WebP or AVIF where supported. Use `fetchpriority="high"` only for critical hero images.
- **Fonts**: Preload key fonts with `<link rel="preload">`. Use `font-display: swap` or `optional` to avoid invisible text (FOIT).
- **CSS/JS**: Defer non-critical CSS; load scripts with `defer` or `async`. Minimize render-blocking resources. Use `preconnect` for critical third-party origins (e.g. fonts, analytics).
- **Caching**: Use consistent file naming; consider cache-busting (e.g. query params or hashed filenames) for updated assets.
- **Build tools**: Use minification (e.g. PostCSS, terser) and inlining of critical above-the-fold CSS when a build step exists.
- **Lazy-load**: Use `loading="lazy"` for iframes. For `<video>`, use `preload="none"` to defer loading when appropriate.
- **Avoid**: Large inline styles/blocks (non-trivial or reused CSS/JS belongs in external files), unnecessary DOM manipulation, synchronous scripts in `<head>`.

### Browser & Device Support

- **Target browsers**: Support the last 2 major versions of Chrome, Safari, Edge, and Firefox. Document minimum versions if the project requires them.
- **Mobile-first**: Design and develop for mobile first; use `min-width` media queries to enhance for larger screens.
- **Feature fallbacks**: Provide fallbacks for modern features when supporting older browsers (e.g. Flexbox fallback for Grid, or `@supports` for progressive enhancement).

### Security

- **External links**: Use `rel="noopener noreferrer"` on links with `target="_blank"` to prevent `window.opener` access.
- **HTTPS**: Use HTTPS for all links and resources. Avoid mixed content.
- **Inline scripts**: Avoid inline JavaScript (`onclick`, `onload`, etc.) to reduce XSS risk; use external scripts and event delegation.
- **Form input**: Sanitize and validate user input before processing or displaying. Never trust client-side validation alone.

### Development Workflow

- **Local/staging**: Use a local development server and optional staging environment before deploying.
- **Naming conventions**: Use consistent, descriptive names for files and images (e.g. `hero-banner.webp`, `contact-form-section.html`). Lowercase, hyphen-separated. Prefer readable words over cryptic abbreviations; short forms like `nav`, `btn`, and `img` are fine when widely understood.
- **Git**: If multiple contributors, define a simple workflow (e.g. main + feature branches, short-lived branches).

### Common Patterns

Reusable patterns for rapid builds. Use consistent structure across pages:

| Pattern              | Usage                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hero block**       | Full-width headline + supporting text + CTA; often above the fold                                                                                |
| **Testimonial card** | Quote, attribution, optional photo; consistent card styling                                                                                      |
| **CTA button**       | Primary (filled) and secondary (outline) variants; consistent sizing                                                                             |
| **Accordion / FAQ**  | Expandable sections; use `<details>`/`<summary>` or ARIA pattern                                                                                 |
| **Contact form**     | Name, email, phone, message; each input with a `<label>`; captcha when needed; inline success/error messages; endpoint for the user to configure |

---

## What NOT to Do (Anti-Patterns)

### HTML

| Avoid                                                                                   | Do instead                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Repeating header, footer, nav in every HTML file                                        | Use shared includes, templates, or a build step                        |
| Relative paths for OG/Twitter images                                                    | Use absolute URLs so social crawlers can resolve them                  |
| Relative paths for preload links                                                        | Use absolute or root-relative URLs so they resolve from any page       |
| Inline layout/presentation (`display`, flex/grid, spacing, `background`, borders, etc.) | Use CSS classes; reserve inline styles for values truly set at runtime |
| Skipping heading levels (h1 to h3)                                                      | Use logical hierarchy: h1 → h2 → h3, no skips                          |
| Generic alt text ("image1.jpg")                                                         | Write descriptive, concise alt text                                    |
| Decorative images with descriptive alt                                                  | Use `alt=""` for purely decorative images                              |
| Non-descriptive link text ("click here")                                                | Use anchor text that describes the destination                         |
| Inputs without associated `<label>`                                                     | Use `for`/`id` or wrap input in label                                  |
| Form `action="#"` with no fallback                                                      | Point to a real endpoint or document that JS handles submission        |
| Missing `cursor: pointer` on clickable elements                                         | Add it for buttons and elements that act like buttons                  |

### CSS

| Avoid                                                                 | Do instead                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| Duplicating large blocks of CSS across pages                          | Use a single shared stylesheet                                  |
| Mixing hardcoded colors with variables                                | Use CSS variables consistently                                  |
| Conflicting media queries with different breakpoints and `!important` | Use one breakpoint system and avoid `!important`                |
| Using a class without defining it                                     | Define the class or remove its use                              |
| Inconsistent class names for the same pattern across pages            | Use the same names site-wide (e.g. .label not .lbl on one page) |
| Inconsistent formatting (minified vs expanded)                        | Choose one style for maintainability                            |

### JavaScript

| Avoid                                                      | Do instead                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Inline `onclick` on many elements                          | Use `data-*` attributes and a single delegated listener                            |
| Global tracking functions on `window`                      | Wrap in an IIFE or module, or use data attributes + delegation                     |
| `dataLayer.push(...)` without ensuring `dataLayer` exists  | Use `window.dataLayer = window.dataLayer \|\| [];` first                           |
| Calling analytics APIs before they're loaded               | Ensure the analytics script loads before invoking it                               |
| Referencing DOM elements by ID without checking            | Check for element existence before use, or remove dead code and orphaned listeners |
| Duplicating the same event logic in multiple places        | One delegated listener or a single init module                                     |
| Top-level tracking functions in an inline `<script>` block | External file, IIFE, or module                                                     |
| Copying the same script into every page                    | Extract to a shared file and include it once                                       |
| Using `alert()` for form success/error feedback            | Use inline messages or toasts for better UX and accessibility                      |

---

## Markdown (.md) Files

**Prefer fewer, consolidated docs over many small ones.**

| Do                                                       | Don't                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Keep 1–3 core .md files (e.g. README, AGENTS)            | Create a new .md for every topic or feature                                          |
| Add to existing docs when new guidance is needed         | Scatter docs across multiple files (CONTRIBUTING.md, STYLE.md, CONVENTIONS.md, etc.) |
| Use a single source of truth for agent/contributor rules | Duplicate rules across README, AGENTS, and other files                                |

Extend existing docs only when necessary. Avoid both documentation sprawl (too many files) and doc bloat (adding content that isn't needed).

**When building the project:** (1) Update the README title and description with the specific site name and purpose once known. (2) Update the README "Running Locally" section with the specific commands used to run the site (e.g. `npm run dev`, `eleventy --serve`, `bundle exec jekyll serve`). Replace generic examples with the actual commands so developers can run the project immediately.

---

## File Structure

A typical structure for a multi-page static site:

```text
/
├── index.html
├── 404.html           # optional; custom error page when the host supports it
├── about/
│   └── index.html
├── contact/
│   └── index.html
├── includes/          # or partials/ for shared header, footer, nav
│   ├── header.html
│   └── footer.html
├── css/
│   └── main.css
├── js/
│   └── main.js
├── assets/
│   ├── images/
│   └── media/
├── reference/         # optional; legacy or prototype source not deployed as-is
├── favicon.ico
├── robots.txt         # optional; for crawler directives
├── sitemap.xml        # optional; for SEO
├── README.md
└── AGENTS.md
```

---

## Quick Reference

Key takeaways: confirm fonts, colors, logo, and assets before locking `:root` and layout · DOCTYPE + lang · semantic HTML · accessibility (aria, alt, focus, skip-link, form labels, contrast) · favicon · `rel="noopener noreferrer"` on `target="_blank"` links · HTTPS · event delegation over onclick · one place for handlers · remove dead DOM code when markup changes · absolute URLs for social · JSON-LD when content fits a schema (includes + inline in HTML, not JS-only) · mobile-first · external CSS/JS · dataLayer before GTM · no duplicate GTM/gtag · lazy-load images · debounce heavy handlers · consistent class names and breakpoints.

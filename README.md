# Priorify AI — static site

Multi-page marketing site for **Priorify AI** (PriorityPath®, MyPriorityPath®, stakeholder intelligence + SEV prioritization). Built with plain HTML, shared `css/main.css`, and `js/main.js`, following [AGENTS.md](./AGENTS.md).

## Project structure

**Deploy the repository root** as the site root: URLs match folders (`contact/index.html` → `/contact/`). Shared header/footer snippets for copy/paste or a future build step live in **`includes/`**; every live page currently **inlines** the full header/footer—change both when you update chrome.

| Location | Purpose |
| -------- | ------- |
| `index.html`, `404.html` | Home and error page |
| `*/index.html` | One directory per path (`faq/`, `our-process/`, …) |
| `shan-g/`, `shandon-m-gubler/` | Partner bio pages |
| `css/main.css` | Single site stylesheet |
| `js/main.js`, `js/analytics.js` | UI + GA4 helpers (`trackCTA`, `trackAI`, `trackFAQ`) |
| `assets/images/` | Logos, favicon, process icons, published team photos |
| `assets/sources/` | Original photo uploads (kebab-case); **not** linked from HTML |
| `includes/` | `header.html`, `footer.html` partials |
| `reference/` | Legacy React prototype (`priorify-ai-site.jsx`) — not deployed |
| `scripts/` | Maintenance: `qa-audit.py`, `patch_nav_groups.py`, `add_nav_titles.py` |
| `docs/ai-integration.md` | LLM/API payloads, form field names, spam/Turnstile behavior |

```text
/
├── index.html, 404.html, robots.txt, sitemap.xml
├── includes/header.html, includes/footer.html
├── css/main.css
├── js/main.js, js/analytics.js
├── assets/images/          # deployed raster/SVG
├── assets/sources/         # optional originals (not routed)
├── reference/priorify-ai-site.jsx
├── contact/, faq/, myprioritypath/, our-process/, our-team/
├── pricing/, research/, why-priorify/
├── shan-g/, shandon-m-gubler/
├── scripts/
├── docs/ai-integration.md
├── README.md, AGENTS.md
└── …
```

**QA:** from the repo root run `python3 scripts/qa-audit.py` (HTML/SEO basics vs AGENTS.md).

## Running locally

From the project root, serve files over HTTP:

```bash
npx --yes serve .
```

Then open the URL shown in the terminal (often `http://localhost:3000`).

Alternatively:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## SEO, social meta, and analytics (GA4 / GTM)

This is implemented **in the HTML and JS**—nothing extra runs at build time. The notes below are for anyone changing tags, GTM, or Search Console.

### SEO (on-page)

- Each page has a **unique** `<title>` and `<meta name="description">`, a **`rel="canonical"`** pointing at `https://priorify.ai/…` (except **`404.html`**, which uses **`meta name="robots" content="noindex"`** and intentionally has **no** canonical).
- **`robots.txt`** and **`sitemap.xml`** live at the site root; sitemap lists main URLs including `/shan-g/` and `/shandon-m-gubler/`.
- **Home** includes JSON-LD **`Organization`** + **`WebSite`**; partner bio pages include **`Person`** schema where applicable.
- Quick automated checks: `python3 scripts/qa-audit.py` (see [AGENTS.md](./AGENTS.md) for full guidelines).

**Google Search Console (operational):** verify the property for your live host, then submit **`https://priorify.ai/sitemap.xml`** (or your production equivalent).

### Social meta (Open Graph / Twitter)

- Pages use **`og:title`**, **`og:description`**, **`og:url`**, **`og:image`**, **`og:type`**, **`og:site_name`** where appropriate, plus **`twitter:card`**, **`twitter:title`**, **`twitter:description`**, **`twitter:image`** on pages that define sharing tags.
- **`og:image`** and **`twitter:image`** use **absolute** `https://priorify.ai/…` URLs so crawlers and apps resolve them correctly.
- Many pages use **`/assets/images/logo-blue.svg`** as the share image. Some platforms prefer a **raster** (e.g. 1200×630 PNG/JPEG); add a dedicated asset and point both tags at it if previews look wrong.
- **`link rel="apple-touch-icon"`** is set (same asset as favicon unless you replace it).

### Google Analytics 4 (GA4) and Google Tag Manager (GTM)

- **GTM container:** `GTM-PLTQ3Q4B` — loaded in `<head>` after `window.dataLayer = window.dataLayer || [];`. The **GTM noscript** iframe is in `<body>` on each page.
- **GA4 measurement ID:** `G-PKGY8GTT1T` — loaded via **`https://www.googletagmanager.com/gtag/js?id=…`**, then **`js/analytics.js`** calls `gtag("config", "G-PKGY8GTT1T", { page_location, page_title })` so pageviews fire from the **gtag** path.

**Important (avoid double counting):** the site uses **both** GTM and **direct gtag** for GA4 by design. In **GTM**, do **not** add a second **Google Analytics: GA4 Configuration** tag for the same property, or pageviews can be **duplicated**. Use GTM for other tags (Ads, pixels, etc.) and keep GA4 pageview/config either only in gtag **or** only in GTM—not both.

**Custom events (via `js/analytics.js`):**

| Helper | GA4 event | Used for |
|--------|-----------|----------|
| `trackCTA(label)` | `cta_click` | `data-track-cta`, nav CTA clicks (`main.js`) |
| `trackAI(action)` | `ai_assist_interaction` | AI demo steps (`main.js`) |
| `trackFAQ(question)` | `faq_open` | FAQ `<details>` open (`main.js`) |

`window.gtag` is assigned in `analytics.js` for the config call; helpers use `gtag("event", …)`.

## Git workflow (when using Git)

Create a feature branch: `<initials>/<website-name>`, build on that branch, then merge per team practice.

## Production placeholders

- **Domain**: Canonical, Open Graph, and JSON-LD URLs should match your live host (e.g. `https://priorify.ai/`).
- **Favicon**: Pages use `/assets/images/favicon-y.svg` — the **same trademark block as `logo-blue.svg`** (stars/figures + **YY** mark + ®), cropped to that region on a white rounded tile (not a generic font “Y”). Regenerate by cropping `logo-blue.svg` if the master logo changes.

### Forms — where submissions go (today vs production)

**Full spec (demos, JSON shapes, honeypots, Turnstile, rate-limit keys):** [docs/ai-integration.md](./docs/ai-integration.md).

**Right now**, both forms on `/contact/` use `action="#"` and **JavaScript** (`js/main.js`) calls `preventDefault()` and shows a thank-you message. **Nothing is emailed or POSTed to a server** until you wire an endpoint.

**To receive submissions by email**, typical options:

| Approach | Where it goes | Format |
|----------|----------------|--------|
| **[Formspree](https://formspree.io/)** (or similar) | Email inbox you configure in Formspree | `POST` as `application/x-www-form-urlencoded` or `multipart/form-data` — field names match your `<input name="...">` (e.g. `name`, `email`, `message`, `company`, etc.). |
| **Netlify Forms** | Netlify dashboard + email notifications | Add `netlify` attributes / deploy on Netlify; fields are the named inputs. |
| **Your API** | Your backend | JSON or form body per your contract. |

Set the form `action` to the provider URL and **remove or adjust** the placeholder handler in `main.js` so the form can submit normally, or use `fetch()` to POST JSON if the API expects JSON.

### Spam protection

Client-side mitigations live in `js/main.js` (not a substitute for server checks):

- **Honeypots** (in `contact/index.html`): hidden fields `company_website` and `hp_business_fax` inside `.contact-form__hp`. If either has text, submit is aborted **silently** (no error shown).
- **Timing**: submit is rejected until at least ~0.9s has passed since the form initialized, and until ~3.2s **or** the user has interacted with a visible field (stops instant bot POSTs).
- **Per-browser quota**: at most **12** successful submissions per form per rolling hour (`sessionStorage` keys `priorify_sg_contact` and `priorify_sg_estimate`).
- **AI demos** (home + MyPriorityPath): at most **24** “Analyze” / “Map My Path” runs per demo per rolling hour per browser (`priorify_ai_demo_org_v1`, `priorify_ai_demo_mp_v1`). When you add a real LLM API, enforce **IP + key rate limits** on the server.

**Cloudflare Turnstile (optional):** set `<meta name="priorify-turnstile-site-key" content="YOUR_SITE_KEY" />` in `contact/index.html`. Widgets mount above each submit button; `main.js` requires a token before showing success. **You must verify** the `cf-turnstile-response` token on your server (or use a provider that does).

**Also use:** Formspree/Netlify bot options, WAF / Bot Fight Mode on your CDN, and **server-side rate limiting** once forms POST to your stack.

### Navbar (suggestions)

The site uses a **two-group** nav: **Choose your path** (Home + MyPriorityPath®) | **Methodology and company** (Why Priorify → FAQ), plus **tooltips** (`title`) on the path links. If it still feels busy: shorten labels, move FAQ + Research into a single “Resources” page, or add a **compact** footer block repeating “Organizations → Home / Individuals → MyPriorityPath®”. Avoid adding a second sticky bar unless usability testing says you need it.

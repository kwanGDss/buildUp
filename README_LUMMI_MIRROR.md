Lummi.ai Homepage Mirror (Playwright)
=====================================

This repo contains a Playwright-based script that can snapshot a public web page (e.g., https://www.lummi.ai/) into a local folder by downloading the rendered HTML and referenced static assets (CSS, JS, images, fonts referenced in CSS) and rewriting paths to work offline.

Important: Legal & Ethical Use
------------------------------
- Only use this for personal, transient testing or debugging.
- Respect the target site's Terms of Service and robots.txt.
- Do not redistribute or deploy mirrored copyrighted content.

Prerequisites
-------------
- Node.js 18+ (for built-in `fetch`).
- Playwright installed.

Install
-------

```
npm i -D playwright
npx playwright install
```

Usage
-----

```
node scripts/mirror-with-playwright.js https://www.lummi.ai/ ./mirror-lummi
```

What it does
------------
- Launches Chromium with Playwright and navigates to the URL.
- Captures the rendered HTML and finds referenced assets:
  - Stylesheets, scripts, images, icons, videos/audio sources, and srcset URLs.
  - Parses CSS files for `url(...)` references (fonts and images) and downloads them.
- Saves everything under `./mirror-lummi` (or your chosen output dir) and rewrites paths in `index.html` to point to local copies.
- Also saves a full-page screenshot at `reference-fullpage.png` for visual reference.

Notes & Limitations
-------------------
- Highly dynamic content (client-side loaded after user interaction, inline data, GraphQL responses) may not be captured.
- Some assets loaded via JS at runtime or protected by CSP may be missed.
- Service workers, analytics, A/B frameworks, and third-party embeds may not work offline.
- For best results, serve the output directory via a static file server (e.g., `npx http-server mirror-lummi`).

Troubleshooting
---------------
- If navigation times out, increase `timeout` or switch `waitUntil` in the script.
- If a cookie banner blocks content, update the script's quick banner-dismiss logic.
- If fonts aren’t rendering, check the CSS `url(...)` rewrites and whether the fonts were downloaded.


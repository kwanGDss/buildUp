/*
  Mirror a website homepage locally using Playwright.

  Usage:
    node scripts/mirror-with-playwright.js https://www.example.com/ ./mirror-out

  Notes:
  - This script is for personal/testing use. Respect the website's ToS and robots.txt.
  - It will fetch HTML via Playwright (post-DOM render) and download referenced assets
    (CSS, JS, images, icons, fonts in CSS) to a local folder, rewriting paths.
  - It is a best-effort snapshot and may not capture all dynamic assets.
*/

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function usageAndExit() {
  console.error('Usage: node scripts/mirror-with-playwright.js <url> [outDir]');
  process.exit(1);
}

const inputUrl = process.argv[2];
const outDir = process.argv[3] || path.join(process.cwd(), 'mirror-out');
if (!inputUrl) usageAndExit();

function ensureDirSync(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFileSyncSafe(filePath, data) {
  ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
}

function stripHashAndQuery(u) {
  try {
    const urlObj = new URL(u);
    urlObj.hash = '';
    urlObj.search = '';
    return urlObj.toString();
  } catch (e) {
    return u.split('#')[0].split('?')[0];
  }
}

function urlToLocalPath(assetUrl, baseUrl, outBase) {
  const resolved = new URL(assetUrl, baseUrl);
  // Keep host structure to avoid collisions across CDNs
  let pathname = resolved.pathname;
  if (pathname.endsWith('/')) pathname += 'index.html';
  // If no extension, try to infer by common types via pathname hints; else keep as-is
  const relPath = path.join(resolved.hostname, decodeURIComponent(pathname));
  return path.join(outBase, 'assets', relPath);
}

function makeRelative(fromFile, toFile) {
  const rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

async function downloadBinary(url, baseUrl) {
  const resolved = new URL(url, baseUrl);
  const res = await fetch(resolved.toString());
  if (!res.ok) throw new Error(`Failed to fetch ${resolved} - ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function downloadText(url, baseUrl) {
  const resolved = new URL(url, baseUrl);
  const res = await fetch(resolved.toString());
  if (!res.ok) throw new Error(`Failed to fetch ${resolved} - ${res.status}`);
  return await res.text();
}

// Parse url(...) references in CSS text
function extractCssUrls(cssText) {
  const urls = new Set();
  const re = /url\(([^)]+)\)/g; // matches url(...) including quotes
  let m;
  while ((m = re.exec(cssText))) {
    let raw = m[1].trim().replace(/^['\"]/,'').replace(/['\"]$/,'');
    if (!raw || raw.startsWith('data:')) continue;
    urls.add(raw);
  }
  return Array.from(urls);
}

function rewriteHtmlAttrs(html, mapping) {
  // mapping: Map<absoluteUrlWithoutQuery, relativePath>
  // We replace occurrences in common attributes via a cautious regexp per URL.
  let result = html;
  for (const [absUrl, relPath] of mapping.entries()) {
    const escaped = absUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const attrPatterns = [
      new RegExp(`(src|href)=\\\"${escaped}\\\"`, 'g'),
      new RegExp(`(src|href)=\\'${escaped}\\'`, 'g'),
      new RegExp(`(src|href)=${escaped}(?=[\s>])`, 'g'),
    ];
    for (const re of attrPatterns) {
      result = result.replace(re, (m, g1) => `${g1}="${relPath}"`);
    }
    // srcset entries: handle simple cases
    const srcsetRe = new RegExp(`(srcset=)([\"\'])((?:[^\2]|\2\2)*?)\2`, 'g');
    result = result.replace(srcsetRe, (full, prefix, quote, content) => {
      const updated = content.split(',').map(part => {
        const segs = part.trim().split(/\s+/);
        if (segs.length === 0) return part;
        const url = segs[0];
        if (stripHashAndQuery(new URL(url, absUrl).toString()) === absUrl) {
          segs[0] = relPath;
          return segs.join(' ');
        }
        return part;
      }).join(', ');
      return `${prefix}${quote}${updated}${quote}`;
    });
  }
  return result;
}

async function main() {
  ensureDirSync(outDir);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36',
    locale: 'en-US',
  });
  const page = await context.newPage();

  console.log(`[nav] ${inputUrl}`);
  await page.goto(inputUrl, { waitUntil: 'networkidle', timeout: 120_000 });

  // Optionally close cookie banners if common selectors appear (best-effort)
  try {
    await page.locator('button:has-text("Accept All")').first().click({ timeout: 3000 });
  } catch {}
  try {
    await page.locator('button:has-text("Accept")').first().click({ timeout: 3000 });
  } catch {}

  // Wait a moment for late assets
  await page.waitForTimeout(1500);

  const baseUrl = page.url();

  const { assets, html } = await page.evaluate(() => {
    const abs = u => new URL(u, location.href).toString();
    const uniq = arr => Array.from(new Set(arr.filter(Boolean)));

    const css = uniq(Array.from(document.querySelectorAll('link[rel~="stylesheet"]'))
      .map(el => el.getAttribute('href'))
      .map(abs));

    const js = uniq(Array.from(document.querySelectorAll('script[src]'))
      .map(el => el.getAttribute('src'))
      .map(abs));

    const imgs = uniq([
      ...Array.from(document.querySelectorAll('img[src]')).map(el => el.getAttribute('src')), 
      ...Array.from(document.querySelectorAll('link[rel~="icon"][href]')).map(el => el.getAttribute('href')),
      ...Array.from(document.querySelectorAll('source[src]')).map(el => el.getAttribute('src')),
      ...Array.from(document.querySelectorAll('video[src]')).map(el => el.getAttribute('src')),
      ...Array.from(document.querySelectorAll('audio[src]')).map(el => el.getAttribute('src')),
    ].map(abs));

    const srcsets = uniq(Array.from(document.querySelectorAll('img[srcset], source[srcset]'))
      .flatMap(el => (el.getAttribute('srcset') || '').split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean))
      .map(abs));

    return {
      assets: {
        css,
        js,
        imgs: uniq([...imgs, ...srcsets]),
      },
      html: document.documentElement.outerHTML,
    };
  });

  // Take a full-page screenshot as a fallback reference
  try {
    const shotPath = path.join(outDir, 'reference-fullpage.png');
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`[saved] ${shotPath}`);
  } catch (e) {
    console.warn('[warn] screenshot failed:', e.message);
  }

  await browser.close();

  // Download assets and build mapping
  const mapping = new Map(); // absUrl(without query/hash) -> relativePath

  async function handleCss(url) {
    const abs = new URL(url, baseUrl).toString();
    const cleaned = stripHashAndQuery(abs);
    const localPath = urlToLocalPath(cleaned, baseUrl, outDir);
    try {
      const cssText = await downloadText(abs, baseUrl);
      // Parse nested urls and download
      const nested = extractCssUrls(cssText);
      let rewritten = cssText;
      for (const nu of nested) {
        try {
          const absNested = new URL(nu, abs).toString();
          const cleanedNested = stripHashAndQuery(absNested);
          const nestedLocal = urlToLocalPath(cleanedNested, baseUrl, outDir);
          // Download nested asset (font/image)
          const bin = await downloadBinary(absNested, baseUrl);
          writeFileSyncSafe(nestedLocal, bin);
          const relFromCss = makeRelative(localPath, nestedLocal);
          mapping.set(cleanedNested, relFromCss);
          // Rewrite in CSS text
          const esc = cleanedNested.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(`url\\((['\"])${esc}\\1\\)`, 'g');
          const re2 = new RegExp(`url\\(${esc}\\)`, 'g');
          rewritten = rewritten.replace(re, `url($1${relFromCss}$1)`).replace(re2, `url(${relFromCss})`);
        } catch (e) {
          console.warn(`[warn] nested asset fail ${nu}: ${e.message}`);
        }
      }
      writeFileSyncSafe(localPath, rewritten);
      const rel = makeRelative(path.join(outDir, 'index.html'), localPath);
      mapping.set(cleaned, rel);
      console.log(`[css] ${abs} -> ${rel}`);
    } catch (e) {
      console.warn(`[warn] css fail ${abs}: ${e.message}`);
    }
  }

  async function handleBinary(url, label) {
    const abs = new URL(url, baseUrl).toString();
    const cleaned = stripHashAndQuery(abs);
    const localPath = urlToLocalPath(cleaned, baseUrl, outDir);
    try {
      const bin = await downloadBinary(abs, baseUrl);
      writeFileSyncSafe(localPath, bin);
      const rel = makeRelative(path.join(outDir, 'index.html'), localPath);
      mapping.set(cleaned, rel);
      console.log(`[${label}] ${abs} -> ${rel}`);
    } catch (e) {
      console.warn(`[warn] ${label} fail ${abs}: ${e.message}`);
    }
  }

  // Fetch assets (CSS first so nested assets/rules are available in mapping)
  for (const href of assets.css) await handleCss(href);
  for (const src of assets.js) await handleBinary(src, 'js');
  for (const src of assets.imgs) await handleBinary(src, 'asset');

  // Save HTML with rewritten asset paths
  const indexPath = path.join(outDir, 'index.html');
  const rewrittenHtml = rewriteHtmlAttrs(html, mapping);
  writeFileSyncSafe(indexPath, rewrittenHtml);
  console.log(`[saved] ${indexPath}`);

  console.log('\nDone. Open index.html via a static server for best results.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


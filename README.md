# TextDiff Pro – Text & Document Comparison Tool (English)

100% client-side tool (pure HTML + CSS + JS). No backend, no build.

## Live global visitor counter
- Section `#visitors` (before the footer): total visits, visits this week/month/year, online right now, and a per-country ranking with ISO flags.
- **Data source**: [CounterAPI](https://countapi.mileshilliard.com) (`countapi.mileshilliard.com/api/v1`) — free, no signup, no API key, CORS enabled. The original `countapi.xyz` is defunct; this is the maintained replacement.
- **Geo source**: `ipwho.is` -> `ipapi.co` -> `freeipapi.com` (fallback chain, all CORS-enabled, 5s timeout each).
- **Keys used** (namespace `textdiffpro_live_v1`): `_total`, `_y<year>`, `_m<YYYYMM>`, `_w<year>W<isoweek>`, and `_c_<CC>` per country.
- **Privacy**: only a country code + counter number is stored. No IPs, no personal data. Ad cookies may still be set by Google AdSense — see the AdSense section below. See the privacy FAQ + footer note.
- **Anti-inflation**: one visit counted per visitor per day via an anonymous random id in `localStorage`; refreshes do not increment. Results cached 30 min to avoid hammering the API; country list loads in the background with max 8 concurrent requests.
- To rename the namespace, change `NS` in `counter.js`. To use a different provider, change `API` and the `get`/`hit` helpers.

## Google AdSense (monetization)

- **Publisher ID**: `ca-pub-5979162907814078` (already wired into `index.html`).
- **Integration**: this is a **regular web page, not AMP**, so the AMP `<amp-auto-ads>` element is **not** used. Instead the standard auto-ads script is loaded in `<head>`:
  ```html
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5979162907814078" crossorigin="anonymous"></script>
  ```
  That single script is all that auto ads require — Google injects the ad units into the page automatically.
- **Ad slot container**: `<section class="wrap adzone" aria-label="Advertisement">` sits between the tool section and the FAQ. To run **manual** ad units instead, paste the `<ins class="adsbygoogle">` block from **AdSense > Ads > Display ad units** inside that section. Never publish a placeholder slot id: it produces ad errors.
- **`ads.txt`**: the authorized-sellers record is at the repository root and mirrored inside this folder:
  ```
  google.com, pub-5979162907814078, DIRECT, f08c47fec0942fa0
  ```
  It must be reachable at **`<domain-root>/ads.txt`** (e.g. `https://yourdomain.com/ads.txt`). If the site is deployed from this folder to a subdirectory (`/text-compare-tool/`), the root copy is the one that counts — keep both.
- **Dashboard checklist**: enable **Auto ads** (AdSense > AdSense Settings > Overview), confirm the site is approved, and check **Sites > ads.txt status** until it reads *Authorized* (changes can take a few days to propagate).
- **Service worker**: `sw.js` uses a versioned cache (`textdiff-v4`) and is **network-first for HTML documents**, so an updated page (e.g. a new AdSense snippet) reaches returning visitors immediately. Bump `CACHE` whenever you change the cached assets.
- **Privacy disclosures**: the visible FAQ, the FAQ JSON-LD, the footer note and `llms.txt` all disclose AdSense and third-party ad cookies, with links to Google Ads Settings and Google's ad privacy policy. Update them if the ad setup changes.

## Run
- Double-click `index.html`, or `npx serve .`, or deploy to Netlify / Vercel / GitHub Pages / Cloudflare Pages.

## Publish checklist (traffic-ready)
1. Replace `yourdomain.com` everywhere (`index.html`, `robots.txt`, `sitemap.xml`, `security.txt`, `llms.txt`) with your real domain + set `hello@yourdomain.com`.
2. Convert `og-image.svg` to `og-image.jpg` (1200x630) and keep both files (social crawlers prefer JPG/PNG).
3. Submit `sitemap.xml` in Google Search Console + Bing Webmaster Tools. Request indexing for `/text-compare-tool/`.
4. Add GA4 or Plausible snippet before `</body>` if you want analytics (optional, not included to stay 100% private by default).
5. Deploy with HTTPS + the included `.htaccess` (security headers + 30-day cache for css/js/svg).

## SEO / GEO / AEO / LLMO included
- SEO: keyword-rich title + description, canonical, hreflang en/x-default, robots max-snippet, OG + Twitter cards with image alt, preload + preconnect, PWA manifest, sitemap with lastmod, robots with AI-crawler allow, security.txt, SW offline cache.
- Schemas: WebApplication + FAQPage (9 Q&A) + HowTo (3 steps) + BreadcrumbList + SoftwareApplication (4.9/312 reviews, mirrored in visible rating).
- GEO: language English, geo.region US/GB/CA/AU, ICBM, placename, x-default.
- AEO: `#quick-answer` 40-word direct answer, 3-step HowTo list, 10 FAQs with direct first sentences, comparison table with caption + scoped headers.
- LLMO: `llms.txt` summary file + quotable definitions, steps and stats phrased for AI citations.

## Icons
All icons are custom inline SVGs defined once as symbols in `index.html` (no emojis, no external fonts). Reuse with `<svg class="ic"><use href="#i-..."/></svg>`.
IDs: i-logo, i-zap, i-swap, i-trash, i-spark, i-copy, i-dl, i-share, i-print, i-file, i-check, i-lock, i-chart, i-eye, i-moon, i-sun, i-x, i-hist.

## Files
- `index.html` -> tool + SEO landing + FAQ + schemas
- `styles.css` -> responsive design + dark mode + print
- `app.js` -> Myers/LCS diff engine, file upload, history, share
- `counter.js` -> live global visitor counter (CounterAPI + geo fallback chain)
- `og-image.svg` -> social preview (convert to JPG for crawlers)
- `sw.js` -> offline PWA cache · `manifest.json` -> installable app
- `robots.txt` + `sitemap.xml` + `security.txt` + `llms.txt` + `.htaccess`
- `ads.txt` -> authorized sellers record for Google AdSense (must be served from the domain root)

# ai.opensubtitles.com — Website

SEO-first demo & marketing site. PHP 8.3 + FatFreeFramework, server-rendered,
vanilla JS, no build step. All API calls happen in browser JS (direct or via the
existing same-domain proxy); PHP only renders pages. See `../plan.md` for the
full brainstorm/decision record.

## Run (dev)

    composer install
    php -S localhost:8080 -t public public/index.php

Then open http://localhost:8080 (German pages under /de/...).

## Structure

    public/          webroot: index.php bootstrap, .htaccess, css/ + js assets
    app/
      App.php        boot: config, theme UI paths, locale, routes
      config.php     theme, locales, api proxy base, cache TTL
      routes.php     route table (plain PHP array)
      Controllers/   one class per page group (render-only)
      Services/      Locale, PricingCache
    ui/
      base/          shared base templates (fallback layer)
      themes/        theme packs; templates here override base
    dict/            F3 lexicon: en.json, de.json (missing DE keys fall back to EN)
    js/              vanilla JS: api client, mediainfo/ffmpeg glue, upload, polling
    vendor/          composer packages (fatfree core)
    cache/           pricing cache (file-based)

## Notes

- Theme switching: set `theme` in `app/config.php`; theme templates in
  `ui/themes/<name>/` override `ui/base/`, CSS in `public/assets/css/<name>/`.
- Dark/light toggle rides CSS tokens (`data-theme` attribute), preference in
  localStorage, defaults to `prefers-color-scheme`.
- Locale: URLs are `/` (en) and `/de/...`; `app/config.php` `languages` map
  (locale => label + flag + optional `flag_overrides`) is the single source of
  truth for available languages. First visit without a `site_locale` cookie is
  auto-forwarded (302) when `Accept-Language` matches a configured language;
  afterwards bare URLs always serve en. The header language popover
  (`public/js/lang-select.js`, nav-menu pattern) overrides: sets the cookie
  (1y) and navigates via the page's hreflang alternates; labels render in the
  current UI language via browser-native `Intl.DisplayNames` (no library).
- Language flags: circular SVGs vendored in `public/lib/circle-flags/`
  (source: github.com/HatScripts/circle-flags, gh-pages snapshot 2026-09-30,
  MIT, subset: referenced flags only, ~1 KB each). Each language has a default
  flag plus optional per-country overrides (visitor country -> flag) for
  politically ambiguous languages (en: gb default, us/ca/au/nz/in overrides —
  user-approved 2026-09-30; future language->flag mappings are delegated to
  the agent, recorded in plan.md). The visitor country is detected
  **client-side** via Cloudflare's edge endpoint `/cdn-cgi/trace`
  (`loc=XX`, all plans, proxied zones only), cached in `localStorage`
  (`cf_country`), and swaps default flags after render — the HTML stays
  identical for every visitor, so Cloudflare full-page caching stays safe.
  Without Cloudflare (dev) flags fall back to the defaults.
- Adding a language: add one entry to the `languages` map in
  `app/config.php` (`label` + `flag` + optional `flag_overrides`) —
  routing, auto-forward, menu row, JS flags map, and hreflang all derive
  from it. Vendor the needed SVGs into `public/lib/circle-flags/`
  (lowercase ISO names matching the config values). Create
  `dict/<locale>.json` (FALLBACK=en covers missing keys; translations
  land in one batch later). Extend `tests/locale-redirect.sh` and this
  README's language list.
- Auth handoff: the site and the web client (`/ai-web`, same origin) share
  localStorage keys (`ai_opensubtitles_token*`, `ai_opensubtitles_config`);
  a login on the site carries over — the client verifies the cached token
  (`tokenLogin()`) without a second login, and "remember me" also stores the
  public Api-Key in the shared config so the client can auto-relogin after
  token expiry. Logout on either side logs out both.
- Pricing page renders from `cache/pricing.json`, refreshed from
  `api_proxy_base` (config) when older than 6h. Empty until configured.
  Model cards show credit prices (max 5 decimals) plus a computed USD line
  (1 credit = $0.01, config `credit_usd_rate`; per 1,000 chars / per minute).
  A "Credit packages" card grid (from POST `/ai/info/credits`, public, no
  Api-Key, same cache) is rendered server-side for anonymous visitors and
  crawlers; `/buy` stays the logged-in purchase flow. Each card has a
  "Purchase now" button (`public/js/pricing.js`): anonymous -> /login with
  return redirect to /pricing; logged in -> fetches checkout URLs from
  `/ai/credits/buy` (matched by package name) and opens checkout in a new
  tab. (In-page iframe modal was tried and reverted: shop sends
  frame-blocking headers.)
- ffmpeg.wasm + mediainfo.js + subsrt-ts are self-hosted in `public/lib/`
  (`ffmpeg/`, `mediainfo/`, `subsrt-ts/`).
- Subtitle previews (search results, dashboard/job files) open in a modal with
  a virtualized cue list (`public/js/subtitle-viewer.js`, parsed with
  subsrt-ts): format badge, cue count, duration, text/cue-number search.
  Non-subtitle content falls back to the raw text view. The font-size buttons
  scale both views.
- Local dev runs on whatever PHP is installed; production target is PHP 8.3+.

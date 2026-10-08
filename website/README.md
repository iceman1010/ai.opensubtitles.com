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
    dict/            F3 lexicon: en.json (source of truth), de.json, es.json,
                     fr.json, pt-BR.json, tr.json, it.json, ar.json, ru.json, pl.json, ja.json, ko.json, id.json, vi.json, th.json, hi.json, uk.json, sk.json, cs.json (all keys
                     present in each; missing
                     keys would fall back to EN. NOTE: multi-part filenames
                     must uppercase the region — F3 turns LANGUAGE "pt-br"
                     into file "pt-BR.json"; URL prefix stays lowercase
                     /pt-br/) + _context.json (key notes for translators;
                     not loaded by F3)
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
  truth for available languages. `App::boot()` wraps all main route handlers
  so `Services\Locale::apply()` runs before each controller — dict lookups in
  controllers (e.g. `page_title`) resolve the request's locale. First visit
  without a `site_locale` cookie is
  auto-forwarded (302) when `Accept-Language` matches a configured language;
  with a pinned cookie, locale-less URLs 302 to the pinned locale (bots carry
  no cookie and never see that redirect — one language per URL for crawlers).
  All internal `<a href>` page links in templates are locale-aware via the
  `lp` hive var (`{{ @lp }}/faq`; empty for en) — new templates must use it
  on page links, never on assets. JS `location.href` navigations stay plain
  and rely on the cookie redirect. The header language popover
  (`public/js/lang-select.js`, nav-menu pattern) overrides: sets the cookie
  (1y) and navigates via the page's hreflang alternates; labels render in the
  current UI language via browser-native `Intl.DisplayNames` (no library).
- Language flags: circular SVGs vendored in `public/lib/circle-flags/`
  (source: github.com/HatScripts/circle-flags, gh-pages snapshot 2026-09-30,
  MIT, full set: 430 flags, ~1.7 MB — user-approved 2026-09-30). Each
  language has a default flag plus optional per-country overrides (visitor
  country -> flag) for politically ambiguous languages (en: gb default,
  us/ca/au/nz/in overrides — user-approved 2026-09-30; future
  language->flag mappings are delegated to the agent, recorded in plan.md).
  The visitor country is detected **client-side** via Cloudflare's edge
  endpoint `/cdn-cgi/trace` (`loc=XX`, all plans, proxied zones only),
  cached in `localStorage` (`cf_country`), and swaps default flags after
  render — the HTML stays identical for every visitor, so Cloudflare
  full-page caching stays safe. Without Cloudflare (dev) flags fall back to
  the defaults. Search results reuse the same logic (`window.LangFlag`
  exported by `lang-select.js` + `LANG_COUNTRY` map in `search-page.js`):
  the subtitle card's language pill shows the circle flag plus the full
  language name (API list first, `Intl.DisplayNames` fallback); languages
  without a mapped flag use the generic gray `xx.svg`.

### API reference page (`/api-docs`)
- Generated from the OpenAPI spec `assets/opensubtitles_openapi.json` (single
  source of truth). After editing the JSON run
  `python3 assets/generate_api_docs.py` (rewrites `ui/base/api.html`) and
  `php tests/clear_f3_cache.php`.
- The generator validates its own output: well-formed XML (F3 requirement),
  exactly 2 F3 tokens, no broken internal anchors. Spec descriptions may
  contain `{{...}}` placeholders — these are entity-encoded so F3 never sees
  them. The spec's `..open_api.json/paths/...` cross-links become same-page
  anchors.
- Served by `Controllers\ApiDocs` + `ui/base/api.html`; page chrome wording
  lives in the `apidocs.*` dict keys (en + de). Content itself is English-only
  (it is the spec's text).
- Adding a language: add one entry to the `languages` map in
  `app/config.php` (`label` + `flag` + optional `flag_overrides`) —
  routing, auto-forward, menu row, JS flags map, and hreflang all derive
  from it. Vendor the needed SVGs into `public/lib/circle-flags/`
  (lowercase ISO names matching the config values). Translate the dict via
  `docs/scripts/dict_tools.py` (`init` → merge batches → `check`/`leftover`;
  it catches duplicate keys, key drift vs en.json and lost `{n}` 
  placeholders — never hand-write a full dict file in one go). Every key
  needs a translator note in `dict/_context.json` (same key set as
  en.json; F3 never loads it — lexicon only loads `dict/<locale>.json`).
  Long-form `ui/base/content/<section>/<locale>.html` blocks are optional
  per locale and fall back to EN. Extend `tests/locale-redirect.sh` and
  this README's language list.
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

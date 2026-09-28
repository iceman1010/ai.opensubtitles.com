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
    dict/            F3 lexicon: en.php, de.php (missing DE keys fall back to EN)
    js/              vanilla JS: api client, mediainfo/ffmpeg glue, upload, polling
    vendor/          composer packages (fatfree core)
    cache/           pricing cache (file-based)

## Notes

- Theme switching: set `theme` in `app/config.php`; theme templates in
  `ui/themes/<name>/` override `ui/base/`, CSS in `public/assets/css/<name>/`.
- Dark/light toggle rides CSS tokens (`data-theme` attribute), preference in
  localStorage, defaults to `prefers-color-scheme`.
- Pricing page renders from `cache/pricing.json`, refreshed from
  `api_proxy_base` (config) when older than 6h. Empty until configured.
- ffmpeg.wasm + mediainfo.js + subsrt-ts are self-hosted in `public/lib/`
  (`ffmpeg/`, `mediainfo/`, `subsrt-ts/`).
- Subtitle previews (search results, dashboard/job files) open in a modal with
  a virtualized cue list (`public/js/subtitle-viewer.js`, parsed with
  subsrt-ts): format badge, cue count, duration, text/cue-number search.
  Non-subtitle content falls back to the raw text view. The font-size buttons
  scale both views.
- Local dev runs on whatever PHP is installed; production target is PHP 8.3+.

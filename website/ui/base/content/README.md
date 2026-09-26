# content/ — per-locale SEO content partials

Raw HTML partials, one file per page per language. Included server-side by the
controllers — this is indexable page content, not dict UI chrome (short strings
still belong in `dict/en.json` / `dict/de.json`).

## Layout

```
tools/en/web-client.html      -> detail page /tools/web-client
tools/de/web-client.html      -> German variant of the same page
search/en.html                -> static content block on /search
search/de.html                -> German variant
```

- Tool files: `{locale}/{id}.html` — `id` must match an entry in
  `app/tools.json`, and that entry must have `"published": true`.
  Anything else 404s.
- Files are raw HTML (h2/p/ul/...), rendered unescaped — content only.
  Never put scripts or user input here.

## Locale resolution & fallback

`app/Services/Content.php` resolves the requested locale first; if that file
does not exist, it falls back to the default locale (`en`). So `de/` files are
optional — create them when a real translation exists, not as placeholders.

## Sitemap: automatic

`app/Controllers/Seo.php` globs `tools/en/*.html` and `search/en.html`:

- every tool file = one `/tools/{id}` URL in `sitemap.xml`
- `<lastmod>` = the file's mtime — editing a file refreshes it automatically
- hreflang alternates (en / de / x-default) are emitted per URL

Adding a tool = add the entry to `app/tools.json` + drop `tools/en/{id}.html`.
No sitemap or route bookkeeping needed.

## Images

Not inline in the partials. Put an optional `"image": "/assets/img/tools/x.png"`
field on the tool entry in `app/tools.json` — the detail template renders it
with `loading="lazy"` and alt text when present.

## After editing

Templates and dicts are compiled into F3's cache (`website/tmp/`). After
changes run, from `website/`:

    php tests/clear_f3_cache.php

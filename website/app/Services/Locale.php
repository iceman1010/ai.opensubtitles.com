<?php

namespace Services;

class Locale
{
    public static function apply(\Base $f3): void
    {
        $default = $f3->get('APP.default_locale');
        $locales = $f3->get('APP.locales');
        $requested = $f3->get('PARAMS.locale');

        if ($requested === null && $f3->get('VERB') === 'GET') {
            $cookie = (string) ($f3->get('COOKIE.site_locale') ?? '');
            if ($cookie !== '' && in_array($cookie, $locales, true) && $cookie !== $default) {
                // Pinned visitor on a locale-less path: keep their language.
                // Bots carry no cookie and never see this redirect.
                // First-visit detection is NOT done here: the homepage is
                // full-page cached at Cloudflare (origin never sees those
                // requests), so the ask-first prompt runs client-side
                // (public/js/locale-prompt.js, cf_country -> geo_map).
                $path = (string) $f3->get('PATH');
                $query = (string) $f3->get('QUERY');
                $f3->reroute('/' . $cookie . ($path === '/' ? '' : $path) . ($query !== '' ? '?' . $query : ''));
                return;
            }
        }

        if ($requested !== null && !in_array($requested, $locales, true)) {
            $f3->error(404);
            return;
        }

        $locale = $requested ?: $default;

        $f3->set('LANGUAGE', $locale === $default ? $default : $locale);
        $f3->set('locale', $locale);
        $f3->set('lp', $locale === $default ? '' : '/' . $locale);
        $f3->set('locales', $locales);
        $f3->set('site_name', $f3->get('APP.site_name'));
    }

    public static function alternates(\Base $f3, string $path): array
    {
        $links = [];
        foreach ($f3->get('APP.locales') as $locale) {
            $prefix = $locale === $f3->get('APP.default_locale') ? '' : '/' . $locale;
            $url = $prefix . $path;
            $links[$locale] = $url === '/' ? '/' : rtrim($url, '/');
        }
        $default = $f3->get('APP.default_locale');
        $links['x-default'] = $links[$default] ?? ($path === '/' ? '/' : rtrim($path, '/'));
        return $links;
    }

    public static function menu(\Base $f3, string $path): array
    {
        $current = (string) $f3->get('locale');
        $urls = self::alternates($f3, $path);
        $rows = [];
        foreach ($f3->get('APP.languages') as $code => $lang) {
            $rows[] = [
                'code' => $code,
                'label' => $lang['label'],
                'flag' => $lang['flag'],
                'url' => $urls[$code],
                'aria' => $code === $current ? ' aria-current="true"' : '',
            ];
        }
        return $rows;
    }

    public static function flagsJson(\Base $f3): string
    {
        $out = [];
        foreach ($f3->get('APP.languages') as $code => $lang) {
            $out[$code] = ['flag' => $lang['flag'], 'overrides' => $lang['flag_overrides'] ?? []];
        }
        return json_encode($out, JSON_UNESCAPED_SLASHES);
    }

    public static function geoJson(\Base $f3): string
    {
        $languages = $f3->get('APP.languages');
        $map = $f3->get('APP.geo_map') ?: [];
        $targets = array_values(array_unique($map));
        $dir = rtrim((string) $f3->get('LOCALES'), '/') . '/';

        $stamp = '';
        $files = [];
        foreach ($targets as $locale) {
            $file = $dir . preg_replace_callback('/-([a-z]{2})$/', static fn (array $m): string => '-' . strtoupper($m[1]), $locale) . '.json';
            $files[$locale] = $file;
            $stamp .= $file . ':' . (string) @filemtime($file) . ';';
        }

        $cacheDir = (string) $f3->get('APP.cache_dir');
        $cacheFile = $cacheDir . '/lang-geo.json';
        if (is_file($cacheFile)) {
            $cached = json_decode((string) file_get_contents($cacheFile), true);
            if (is_array($cached) && ($cached['stamp'] ?? '') === $stamp) {
                return (string) ($cached['json'] ?? '');
            }
        }

        $prompts = [];
        foreach ($targets as $locale) {
            if (!isset($languages[$locale])) {
                continue;
            }
            $dict = json_decode((string) @file_get_contents($files[$locale]), true);
            if (!is_array($dict) || !isset($dict['prompt.title'], $dict['prompt.question'], $dict['prompt.english'])) {
                continue;
            }
            $lang = $languages[$locale];
            $prompts[$locale] = [
                'label' => $lang['label'],
                'flag' => $lang['flag'],
                'dir' => $lang['dir'] ?? 'ltr',
                'name' => $lang['name'] ?? $lang['label'],
                'question' => (string) $dict['prompt.question'],
                'english_gloss' => (string) $dict['prompt.english'],
            ];
        }

        $json = json_encode(['map' => $map, 'prompts' => $prompts], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (is_dir($cacheDir) || @mkdir($cacheDir, 0775, true)) {
            @file_put_contents($cacheFile, json_encode(['stamp' => $stamp, 'json' => $json], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }
        return $json;
    }
}

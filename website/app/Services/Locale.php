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
            if ($cookie === '') {
                $match = self::negotiate($locales, (string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''));
                if ($match !== null && $match !== $default) {
                    setcookie('site_locale', $match, ['expires' => time() + 31536000, 'path' => '/', 'samesite' => 'Lax']);
                    $path = (string) $f3->get('PATH');
                    $query = (string) $f3->get('QUERY');
                    $f3->reroute('/' . $match . ($path === '/' ? '' : $path) . ($query !== '' ? '?' . $query : ''));
                    return;
                }
            } elseif (in_array($cookie, $locales, true) && $cookie !== $default) {
                // Pinned visitor on a locale-less path: keep their language.
                // Bots carry no cookie and never see this redirect.
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
            $links[$locale] = $prefix . $path;
        }
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

    private static function negotiate(array $locales, string $header): ?string
    {
        if ($header === '') {
            return null;
        }

        $candidates = [];
        foreach (explode(',', $header) as $part) {
            $segments = explode(';q=', trim($part));
            $tag = strtolower(trim((string) $segments[0]));
            $q = isset($segments[1]) ? (float) $segments[1] : 1.0;
            if ($tag === '' || $tag === '*' || $q <= 0.0) {
                continue;
            }
            $candidates[] = [$tag, $q];
        }

        usort($candidates, static fn (array $a, array $b): int => $b[1] <=> $a[1]);

        foreach ($candidates as [$tag]) {
            $base = explode('-', $tag)[0];
            foreach ($locales as $locale) {
                if (strtolower($locale) === $tag) {
                    return $locale;
                }
            }
            foreach ($locales as $locale) {
                if (strtolower($locale) === $base) {
                    return $locale;
                }
            }
        }

        return null;
    }
}

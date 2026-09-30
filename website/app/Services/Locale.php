<?php

namespace Services;

class Locale
{
    public static function apply(\Base $f3): void
    {
        $default = $f3->get('APP.default_locale');
        $locales = $f3->get('APP.locales');
        $requested = $f3->get('PARAMS.locale');

        if ($requested === null && $f3->get('VERB') === 'GET' && !$f3->exists('COOKIE.site_locale')) {
            $match = self::negotiate($locales, (string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''));
            if ($match !== null && $match !== $default) {
                setcookie('site_locale', $match, ['expires' => time() + 31536000, 'path' => '/', 'samesite' => 'Lax']);
                $path = (string) $f3->get('PATH');
                $query = (string) $f3->get('QUERY');
                $f3->reroute('/' . $match . ($path === '/' ? '' : $path) . ($query !== '' ? '?' . $query : ''));
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

<?php

namespace Services;

class Locale
{
    public static function apply(\Base $f3): void
    {
        $default = $f3->get('APP.default_locale');
        $locales = $f3->get('APP.locales');
        $requested = $f3->get('PARAMS.locale');

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
}

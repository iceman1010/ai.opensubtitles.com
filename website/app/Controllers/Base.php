<?php

namespace Controllers;

class Base
{
    protected function render(\Base $f3, string $page, string $path = '/'): void
    {
        \Services\Locale::apply($f3);

        $markdown = [
            'home.html' => '/index.md',
            'transcribe.html' => '/transcribe.md',
            'translate.html' => '/translate.md',
            'faq.html' => '/faq.md',
            'pricing.html' => '/pricing.md',
            'support.html' => '/support.md',
            'api.html' => '/api-docs.md',
            'buy.html' => '/buy.md',
            'search.html' => '/search.md',
        ];
        if (isset($markdown[$page])) {
            header('Link: <' . $markdown[$page] . '>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"');
        }

        $locale = $f3->get('locale');
        $prefix = $locale === $f3->get('APP.default_locale') ? '' : '/' . $locale;

        $f3->set('page', $page);
        $canonical = $prefix . $path;
        $f3->set('canonical', $canonical === '/' ? '/' : rtrim($canonical, '/'));
        $f3->set('alternates', \Services\Locale::alternates($f3, $path));
        $f3->set('lang_rows', \Services\Locale::menu($f3, $path));
        $f3->set('lang_flags', \Services\Locale::flagsJson($f3));
        $f3->set('lang_flag_current', $f3->get('APP.languages')[$locale]['flag'] ?? '');
        $f3->set('lang_dir', $f3->get('APP.languages')[$locale]['dir'] ?? 'ltr');
        $f3->set('lang_search_show', $f3->get('APP.lang_search') && count($f3->get('APP.languages')) > 8);
        $f3->set('noindex', false);
        $cssDir = dirname(__DIR__, 2) . '/ui/css/caption-light/';
        $cssVersion = 0;
        foreach (glob($cssDir . '*.css') ?: [] as $cssFile) {
            $cssVersion = max($cssVersion, filemtime($cssFile));
        }
        $f3->set('css_v', $cssVersion);
        echo \Template::instance()->render('layout.html');
    }
}

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
        $cssDir = dirname(__DIR__, 2) . '/ui/css/caption-light/';
        $cssVersion = 0;
        foreach (glob($cssDir . '*.css') ?: [] as $cssFile) {
            $cssVersion = max($cssVersion, filemtime($cssFile));
        }
        $links = ['</assets/css/caption-light/main.css?v=' . $cssVersion . '>; rel="preload"; as="style"'];
        if (isset($markdown[$page])) {
            $links[] = '<' . $markdown[$page] . '>; rel="alternate"; type="text/markdown"';
            $links[] = '</llms.txt>; rel="describedby"';
        }
        header('Link: ' . implode(', ', $links));
        if ($page === 'pricing.html') {
            header('Cache-Control: public, max-age=0, s-maxage=600, stale-while-revalidate=3600');
        } elseif (in_array($page, ['login.html', 'dashboard.html', 'new.html', 'jobs.html', 'job.html'], true)) {
            header('Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=600');
        } else {
            header('Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
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
        $f3->set('noindex', (bool) $f3->get('noindex'));
        $f3->set('css_v', $cssVersion);
        $jsVersion = 0;
        foreach (glob(dirname(__DIR__, 2) . '/public/js/*.js') ?: [] as $jsFile) {
            $jsVersion = max($jsVersion, filemtime($jsFile));
        }
        $f3->set('js_v', $jsVersion);
        $t0 = hrtime(true);
        $html = \Template::instance()->render('layout.html');
        header('Server-Timing: total;dur=' . round((microtime(true) - (float) $f3->get('TIME')) * 1000, 1) . ', render;dur=' . round((hrtime(true) - $t0) / 1e6, 1));
        echo $html;
    }
}

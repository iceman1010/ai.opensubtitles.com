<?php

class App
{
    public static function boot(): \Base
    {
        $f3 = \Base::instance();

        $config = require dirname(__DIR__) . '/app/config.php';
        foreach ($config as $key => $value) {
            $f3->set('APP.' . $key, $value);
        }
        $f3->set('APP.locales', array_keys($config['languages']));

        $root = dirname(__DIR__);

        $f3->set('LOCALES', $root . '/dict/');
        $f3->set('UI', $root . '/ui/themes/' . $config['theme'] . '/;' . $root . '/ui/base/');

        $routes = require $root . '/app/routes.php';
        foreach ($routes as $pattern => $handler) {
            [$methods, $path] = explode(' ', $pattern, 2);
            $f3->route($methods . ' ' . $path, $handler);
            $f3->route($methods . ' /@locale' . $path, $handler);
            if ($path === '/') {
                $f3->route($methods . ' /@locale', $handler);
            }
        }

        $f3->route('GET /robots.txt', 'Controllers\Seo->robots');
        $f3->route('GET /sitemap.xml', 'Controllers\Seo->sitemap');
        $f3->route('GET /@locale/robots.txt', 'Controllers\Seo->robots');
        $f3->route('GET /@locale/sitemap.xml', 'Controllers\Seo->sitemap');

        if ((string) $f3->get('APP.dev_proxy_upstream') !== '') {
            $f3->route('GET /ai-web/*', 'Controllers\DevProxy->forward');
            $f3->route('POST /ai-web/*', 'Controllers\DevProxy->forward');
            $f3->route('PUT /ai-web/*', 'Controllers\DevProxy->forward');
        }

        return $f3;
    }
}

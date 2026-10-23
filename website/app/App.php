<?php

class App
{
    public static function boot(): \Base
    {
        $f3 = \Base::instance();
        $f3->set('CACHE', true);

        $config = require dirname(__DIR__) . '/app/config.php';
        if (is_file(__DIR__ . '/config.local.php')) {
            $config = array_replace($config, require __DIR__ . '/config.local.php');
        }
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
            $handler = self::localized($handler);
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

        $f3->route('GET /llms.txt', 'Controllers\Llms->txt');
        $f3->route('GET /llms-full.txt', 'Controllers\Llms->full');
        foreach (\Controllers\Llms::slugs() as $slug) {
            $f3->route('GET /' . $slug . '.md', fn (\Base $f3) => (new \Controllers\Llms())->serve($f3, $slug));
        }

        $f3->route('GET /assets/css/caption-light/main.css', function (\Base $f3): void {
            $dir = dirname(__DIR__) . '/ui/css/caption-light/';
            $files = array_map('basename', glob($dir . '*.css') ?: []);
            sort($files);
            echo \Web::instance()->minify($files, 'text/css', true, $dir);
        }, 31536000);

        // JS bundle whitelist — public/js files assembled per request. Documented in
        // AGENTS.md and website/docs/scripts/README.md before adding a file or bundle here.
        $f3->route('GET /assets/js/@bundle.js', function (\Base $f3, array $args): void {
            $bundles = [
                'core-head' => ['config.js', 'api.js', 'auth.js'],
                'core-tail' => ['theme-toggle.js', 'nav-menu.js', 'lang-select.js', 'cookie-consent.js'],
                'page-search' => ['subtitle-viewer.js', 'preview-modal.js', 'search-page.js'],
                'page-dashboard' => ['subtitle-viewer.js', 'preview-modal.js', 'dashboard.js'],
                'page-job' => ['subtitle-viewer.js', 'preview-modal.js', 'job.js'],
                'page-new' => ['detect.js', 'ffmpeg-service.js', 'media-info-service.js', 'new-job.js'],
            ];
            $files = $bundles[$args['bundle']] ?? null;
            if ($files === null) {
                $f3->error(404);
                return;
            }
            header('Content-Type: text/javascript; charset=UTF-8');
            $dir = dirname(__DIR__) . '/public/js/';
            foreach ($files as $file) {
                echo \Web::instance()->minify([$file], 'text/javascript', false, $dir), "\n";
            }
        }, 31536000);

        if ((string) $f3->get('APP.dev_proxy_upstream') !== '') {
            $f3->route('GET /ai-web/*', 'Controllers\DevProxy->forward');
            $f3->route('POST /ai-web/*', 'Controllers\DevProxy->forward');
            $f3->route('PUT /ai-web/*', 'Controllers\DevProxy->forward');
        }

        return $f3;
    }

    private static function localized(string $handler): callable
    {
        [$class, $method] = explode('->', $handler);
        return function (\Base $f3) use ($class, $method): void {
            \Services\Locale::apply($f3);
            (new $class())->$method($f3);
        };
    }
}

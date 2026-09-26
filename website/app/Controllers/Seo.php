<?php

namespace Controllers;

class Seo
{
    public function robots(\Base $f3): void
    {
        header('Content-Type: text/plain; charset=utf-8');
        echo "User-agent: *\n";
        echo "Disallow: /dashboard\n";
        echo "Disallow: /new\n";
        echo "Disallow: /jobs\n";
        echo "Sitemap: https://ai.opensubtitles.com/sitemap.xml\n";
    }

    public function sitemap(\Base $f3): void
    {
        header('Content-Type: application/xml; charset=utf-8');

        $base = 'https://ai.opensubtitles.com';
        $locales = $f3->get('APP.locales');
        $default = $f3->get('APP.default_locale');

        $uiBase = dirname(__DIR__, 2) . '/ui/base/';
        $uiContent = dirname(__DIR__, 2) . '/ui/base/content/';

        $templates = [
            '/' => 'home.html',
            '/transcribe' => 'transcribe.html',
            '/translate' => 'translate.html',
            '/pricing' => 'pricing.html',
            '/tools' => 'tools.html',
            '/support' => 'support.html',
            '/login' => 'login.html',
        ];

        $entries = [];
        foreach ($templates as $path => $template) {
            $entries[$path] = is_file($uiBase . $template) ? filemtime($uiBase . $template) : null;
        }

        if (is_file($uiContent . 'search/' . $default . '.html')) {
            $entries['/search'] = filemtime($uiContent . 'search/' . $default . '.html');
        }

        foreach (glob($uiContent . 'tools/' . $default . '/*.html') ?: [] as $file) {
            $entries['/tools/' . basename($file, '.html')] = filemtime($file);
        }

        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";
        foreach ($entries as $path => $mtime) {
            echo "  <url>\n";
            foreach ($locales as $locale) {
                $loc = $base . ($locale === $default ? '' : '/' . $locale) . $path;
                echo '    <xhtml:link rel="alternate" hreflang="' . $locale . '" href="' . htmlspecialchars($loc) . '"/>' . "\n";
            }
            echo '    <xhtml:link rel="alternate" hreflang="x-default" href="' . htmlspecialchars($base . $path) . '"/>' . "\n";
            echo '    <loc>' . htmlspecialchars($base . $path) . '</loc>' . "\n";
            if ($mtime !== null) {
                echo '    <lastmod>' . date('c', $mtime) . '</lastmod>' . "\n";
            }
            echo "  </url>\n";
        }
        echo '</urlset>' . "\n";
    }
}

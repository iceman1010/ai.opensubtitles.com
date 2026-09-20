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
        $pages = ['/', '/transcribe', '/translate', '/pricing', '/login'];
        $locales = $f3->get('APP.locales');
        $default = $f3->get('APP.default_locale');
        $base = 'https://ai.opensubtitles.com';

        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($pages as $page) {
            foreach ($locales as $locale) {
                $loc = $base . ($locale === $default ? '' : '/' . $locale) . $page;
                echo "  <url><loc>" . htmlspecialchars($loc) . "</loc></url>\n";
            }
        }
        echo '</urlset>' . "\n";
    }
}

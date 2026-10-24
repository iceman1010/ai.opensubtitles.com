<?php

namespace Controllers;

class ApiDocs extends Base
{
    public function index(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('apidocs.title'));
        $f3->set('page_description', $f3->get('apidocs.meta_description'));
        $this->render($f3, 'api.html', '/api-docs');
    }

    public function openapi(\Base $f3): void
    {
        $path = dirname(__DIR__, 2) . '/assets/opensubtitles_openapi.json';
        if (!is_file($path)) {
            $f3->error(404);
            return;
        }
        header('Content-Type: application/json; charset=utf-8');
        header('X-Robots-Tag: noindex');
        header('Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
        readfile($path);
    }
}

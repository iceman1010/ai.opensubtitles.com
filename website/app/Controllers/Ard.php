<?php

namespace Controllers;

class Ard
{
    public function manifest(\Base $f3): void
    {
        $path = dirname(__DIR__, 2) . '/assets/ard.json';
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

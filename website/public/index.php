<?php

if (PHP_SAPI === 'cli-server') {
    if (is_file(__DIR__ . $_SERVER['REQUEST_URI'])) {
        return false;
    }
    $_SERVER['SCRIPT_NAME'] = '/' . basename(__FILE__);
}

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/app/App.php';

$f3 = App::boot();

$parts = parse_url($_SERVER['REQUEST_URI'] ?? '');
$path = is_array($parts) ? ($parts['path'] ?? '') : '';
if (in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true) && $path !== '/' && substr($path, -1) === '/') {
    $target = rtrim($path, '/') . (isset($parts['query']) && $parts['query'] !== '' ? '?' . $parts['query'] : '');
    $f3->reroute($target, true);
}

$f3->run();

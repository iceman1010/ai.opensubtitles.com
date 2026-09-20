<?php

if (PHP_SAPI === 'cli-server' && is_file(__DIR__ . $_SERVER['REQUEST_URI'])) {
    return false;
}

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/app/App.php';

App::boot()->run();

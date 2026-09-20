<?php

if (PHP_SAPI === 'cli-server') {
    if (is_file(__DIR__ . $_SERVER['REQUEST_URI'])) {
        return false;
    }
    $_SERVER['SCRIPT_NAME'] = '/' . basename(__FILE__);
}

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/app/App.php';

App::boot()->run();

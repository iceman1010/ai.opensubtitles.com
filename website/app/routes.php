<?php

return [
    'GET /' => 'Controllers\Home->index',
    'GET /transcribe' => 'Controllers\Marketing->transcribe',
    'GET /translate' => 'Controllers\Marketing->translate',
    'GET /pricing' => 'Controllers\Pricing->index',
    'GET /tools' => 'Controllers\Tools->index',
    'GET /login' => 'Controllers\Auth->login',
    'GET /dashboard' => 'Controllers\Dashboard->index',
    'GET /buy' => 'Controllers\Credits->index',
    'GET /new' => 'Controllers\Job->create',
    'GET /search' => 'Controllers\Search->index',
    'GET /jobs' => 'Controllers\Job->index',
    'GET /jobs/@type/@id' => 'Controllers\Job->show',
];

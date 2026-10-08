<?php

return [
    'GET /' => 'Controllers\Home->index',
    'GET /transcribe' => 'Controllers\Marketing->transcribe',
    'GET /translate' => 'Controllers\Marketing->translate',
    'GET /faq' => 'Controllers\Marketing->faq',
    'GET /pricing' => 'Controllers\Pricing->index',
    // TEMP-beta: Tools hidden for beta launch. Siblings of this comment: ui/base/layout.html (nav pill) and app/Controllers/Seo.php (sitemap).
    // 'GET /tools' => 'Controllers\Tools->index',
    // 'GET /tools/@tool' => 'Controllers\Tools->show',
    'GET /support' => 'Controllers\Support->index',
    'GET /api-docs' => 'Controllers\ApiDocs->index',
    'GET /login' => 'Controllers\Auth->login',
    'GET /dashboard' => 'Controllers\Dashboard->index',
    'GET /buy' => 'Controllers\Credits->index',
    'GET /new' => 'Controllers\Job->create',
    'GET /search' => 'Controllers\Search->index',
    'GET /jobs' => 'Controllers\Job->index',
    'GET /jobs/@type/@id' => 'Controllers\Job->show',
];

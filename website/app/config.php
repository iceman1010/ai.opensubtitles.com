<?php

return [
    'theme' => 'caption-light',
    'default_locale' => 'en',
    'languages' => [
        'en' => ['label' => 'English', 'flag' => 'gb', 'flag_overrides' => ['us' => 'us', 'ca' => 'us', 'au' => 'au', 'nz' => 'nz', 'in' => 'in']],
        'de' => ['label' => 'Deutsch', 'flag' => 'de'],
    ],
    'site_name' => 'AI Opensubtitles',
    'api_key' => '5MGRBWO9lHA023KPmVMaa0PoRYHqQKpK',
    'api_base' => '/ai-web/api/v1',
    'api_base_server' => 'https://ai.opensubtitles.com/ai-web/api/v1',
    'dev_proxy_upstream' => 'https://ai.opensubtitles.com',
    'user_agent' => 'aios v1',
    'pricing_cache_ttl' => 21600,
    'cache_dir' => dirname(__DIR__) . '/cache',
];

<?php

namespace Controllers;

class Pricing extends Base
{
    public function index(\Base $f3): void
    {
        $cache = new \Services\PricingCache($f3);
        $f3->set('services', $cache->get());
        $f3->set('page_title', $f3->get('pricing.title'));
        $f3->set('page_description', $f3->get('pricing.meta_description'));
        $this->render($f3, 'pricing.html', '/pricing');
    }
}

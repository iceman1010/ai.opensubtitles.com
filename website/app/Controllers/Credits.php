<?php

namespace Controllers;

class Credits extends Base
{
    public function index(\Base $f3): void
    {
        $f3->set('noindex', true);
        $f3->set('page_title', $f3->get('credits.title'));
        $f3->set('page_description', '');
        $this->render($f3, 'buy.html', '/buy');
    }
}

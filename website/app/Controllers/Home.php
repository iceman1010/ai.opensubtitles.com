<?php

namespace Controllers;

class Home extends Base
{
    public function index(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('home.title'));
        $f3->set('page_description', $f3->get('home.meta_description'));
        $this->render($f3, 'home.html', '/');
    }
}

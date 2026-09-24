<?php

namespace Controllers;

class Tools extends Base
{
    public function index(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('tools.title'));
        $f3->set('page_description', $f3->get('tools.meta_description'));
        $this->render($f3, 'tools.html', '/tools');
    }
}

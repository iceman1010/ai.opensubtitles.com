<?php

namespace Controllers;

class Search extends Base
{
    public function index(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('search.title'));
        $f3->set('page_description', $f3->get('search.meta_description'));
        $this->render($f3, 'search.html', '/search');
    }
}

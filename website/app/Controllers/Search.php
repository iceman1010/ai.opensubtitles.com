<?php

namespace Controllers;

class Search extends Base
{
    public function index(\Base $f3): void
    {
        \Services\Locale::apply($f3);

        $f3->set('page_title', $f3->get('search.title'));
        $f3->set('page_description', $f3->get('search.meta_description'));

        $f3->set('search_content', \Services\Content::file($f3, 'search'));

        $this->render($f3, 'search.html', '/search');
    }
}

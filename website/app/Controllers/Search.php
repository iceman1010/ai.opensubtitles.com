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
        $f3->set('search_imdb_prefill', '');
        $f3->set('search_imdb_kind', '');

        $this->render($f3, 'search.html', '/search');
    }

    public function imdb(\Base $f3): void
    {
        $this->deepLink($f3, 'imdb_id');
    }

    public function imdbParent(\Base $f3): void
    {
        $this->deepLink($f3, 'parent_imdb_id');
    }

    private function deepLink(\Base $f3, string $param): void
    {
        $id = $f3->get('PARAMS.id');
        if (!preg_match('/^tt\d{1,10}$/', $id)) {
            $f3->error(404);
            return;
        }

        \Services\Locale::apply($f3);

        $f3->set('page_title', $f3->get('search.title'));
        $f3->set('page_description', $f3->get('search.meta_description'));

        $f3->set('search_content', \Services\Content::file($f3, 'search'));

        $f3->set('noindex', true);
        $f3->set('search_imdb_prefill', $id);
        $f3->set('search_imdb_kind', $param);

        $this->render($f3, 'search.html', '/search');
    }
}

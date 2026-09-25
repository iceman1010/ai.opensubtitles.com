<?php

namespace Controllers;

class Support extends Base
{
    public function index(\Base $f3): void
    {
        \Services\Locale::apply($f3);

        $f3->set('page_title', $f3->get('support.title'));
        $f3->set('page_description', $f3->get('support.meta_description'));

        $this->render($f3, 'support.html', '/support');
    }
}

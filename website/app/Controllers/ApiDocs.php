<?php

namespace Controllers;

class ApiDocs extends Base
{
    public function index(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('apidocs.title'));
        $f3->set('page_description', $f3->get('apidocs.meta_description'));
        $this->render($f3, 'api.html', '/api-docs');
    }
}

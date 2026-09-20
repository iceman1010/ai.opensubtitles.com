<?php

namespace Controllers;

class Dashboard extends Base
{
    public function index(\Base $f3): void
    {
        $f3->set('noindex', true);
        $f3->set('page_title', $f3->get('dashboard.title'));
        $f3->set('page_description', '');
        $this->render($f3, 'dashboard.html', '/dashboard');
    }
}

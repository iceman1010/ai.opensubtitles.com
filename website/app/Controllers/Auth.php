<?php

namespace Controllers;

class Auth extends Base
{
    public function login(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('login.title'));
        $f3->set('page_description', $f3->get('login.meta_description'));
        $this->render($f3, 'login.html', '/login');
    }
}

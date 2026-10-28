<?php

namespace Controllers;

class Legal extends Base
{
    public function privacy(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('privacy.title'));
        $f3->set('page_description', $f3->get('privacy.meta_description'));
        $f3->set('privacy_content', \Services\Content::file($f3, 'privacy'));
        $this->render($f3, 'privacy.html', '/privacy');
    }

    public function terms(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('terms.title'));
        $f3->set('page_description', $f3->get('terms.meta_description'));
        $f3->set('terms_content', \Services\Content::file($f3, 'terms'));
        $this->render($f3, 'terms.html', '/terms');
    }
}

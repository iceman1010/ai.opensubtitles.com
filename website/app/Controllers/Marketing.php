<?php

namespace Controllers;

class Marketing extends Base
{
    public function transcribe(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('transcribe.title'));
        $f3->set('page_description', $f3->get('transcribe.meta_description'));
        $this->render($f3, 'transcribe.html', '/transcribe');
    }

    public function translate(\Base $f3): void
    {
        $f3->set('page_title', $f3->get('translate.title'));
        $f3->set('page_description', $f3->get('translate.meta_description'));
        $this->render($f3, 'translate.html', '/translate');
    }
}

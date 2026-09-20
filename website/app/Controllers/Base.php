<?php

namespace Controllers;

class Base
{
    protected function render(\Base $f3, string $page, string $path = '/'): void
    {
        \Services\Locale::apply($f3);

        $locale = $f3->get('locale');
        $prefix = $locale === $f3->get('APP.default_locale') ? '' : '/' . $locale;

        $f3->set('page', $page);
        $f3->set('canonical', $prefix . $path);
        $f3->set('alternates', \Services\Locale::alternates($f3, $path));
        $f3->set('noindex', false);
        echo \Template::instance()->render('layout.html');
    }
}

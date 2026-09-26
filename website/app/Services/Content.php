<?php

namespace Services;

class Content
{
    public static function file(\Base $f3, string $section, string $id = ''): string
    {
        $ui = dirname(__DIR__, 2) . '/ui/base/';
        $default = $f3->get('APP.default_locale');
        $locale = (string)($f3->get('locale') ?: $default);
        $suffix = $id === '' ? '' : '/' . $id;
        foreach ([$locale, $default] as $candidate) {
            $rel = 'content/' . $section . '/' . $candidate . $suffix . '.html';
            if (is_file($ui . $rel)) {
                return $rel;
            }
        }
        return '';
    }
}

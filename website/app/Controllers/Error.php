<?php

namespace Controllers;

class Error extends Base
{
	public function show(\Base $f3): void
	{
		if ($f3->get('AJAX')) {
			$error = array_diff_key((array) $f3->get('ERROR'), $f3->get('DEBUG') ? [] : ['trace' => 1]);
			header('Content-Type: application/json; charset=UTF-8');
			echo json_encode($error);
			return;
		}

		$default = $f3->get('APP.default_locale');
		$locales = $f3->get('APP.locales');
		$locale = (string) $f3->get('PARAMS.locale');
		if (!in_array($locale, $locales, true)) {
			$segments = explode('/', trim((string) $f3->get('PATH'), '/'));
			$first = $segments[0] ?? '';
			$locale = in_array($first, $locales, true) ? $first : '';
		}
		if ($locale === '') {
			$cookie = (string) ($f3->get('COOKIE.site_locale') ?? '');
			$locale = in_array($cookie, $locales, true) ? $cookie : $default;
		}

		$f3->set('LANGUAGE', $locale);
		$f3->set('locale', $locale);
		$f3->set('lp', $locale === $default ? '' : '/' . $locale);
		$f3->set('locales', $locales);
		$f3->set('site_name', $f3->get('APP.site_name'));

		$is404 = (int) $f3->get('ERROR.code') === 404;
		$f3->set('error_is_404', $is404);
		$f3->set('noindex', true);
		$f3->set('page_title', $f3->get($is404 ? 'error.404.h1' : 'error.generic.h1'));
		$f3->set('page_description', $f3->get($is404 ? 'error.404.lead' : 'error.generic.lead'));

		$path = (string) $f3->get('PATH');
		if ($locale !== $default && strpos($path, '/' . $locale) === 0) {
			$path = substr($path, strlen('/' . $locale));
		}
		$this->render($f3, 'error.html', $path === '' ? '/' : $path);
	}
}

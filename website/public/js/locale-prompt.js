// locale-prompt.js — first-visit language suggestion modal (option A).
// Suggested card priority: browser preference (navigator.languages, first
// supported non-EN entry) -> Cloudflare visitor country (localStorage
// cf_country, else /cdn-cgi/trace, mapped via config geo_map). Asks once
// ever, never redirects without consent. See plan.md.
(function () {
	'use strict';

	var ASKED = 'ai_locale_prompt';
	var modal = document.getElementById('locale-prompt');
	if (!modal) return;

	var nav = document.getElementById('lang-nav');
	if (!nav) return;

	function isAsked() {
		try { return localStorage.getItem(ASKED) !== null; } catch (e) { return true; }
	}

	function markAsked() {
		try { localStorage.setItem(ASKED, '1'); } catch (e) {}
	}

	function geoConfig() {
		try {
			var geo = JSON.parse(modal.getAttribute('data-geo') || '{}');
			if (geo.map && geo.prompts) return geo;
		} catch (e) {}
		return null;
	}

	function pickBrowser(prompts) {
		var langs = navigator.languages || (navigator.language ? [navigator.language] : []);
		var entries = [];
		for (var i = 0; i < langs.length; i++) {
			var tag = String(langs[i] || '').toLowerCase();
			if (tag) entries.push(tag);
		}
		for (var j = 0; j < entries.length; j++) {
			if (prompts[entries[j]]) return { locale: entries[j], prompt: prompts[entries[j]] };
		}
		var bases = {};
		for (var key in prompts) {
			var base = key.split('-')[0];
			if (!bases[base]) bases[base] = key;
		}
		for (var k = 0; k < entries.length; k++) {
			var pick = bases[entries[k].split('-')[0]];
			if (pick) return { locale: pick, prompt: prompts[pick] };
		}
		return null;
	}

	function pickCountry(geo, country) {
		var locale = geo.map[country];
		if (!locale || locale === 'en') return null;
		var prompt = geo.prompts[locale];
		return prompt ? { locale: locale, prompt: prompt } : null;
	}

	function allowed() {
		if (isAsked()) return false;
		if (navigator.webdriver) return false;
		if (/bot|crawl|spider|slurp|headless|preview|monitor|facebook|twitter|linkedin|whatsapp|telegram/i.test(navigator.userAgent)) return false;
		if (/(?:^|;\s*)site_locale=/.test(document.cookie)) return false;
		var locales = [];
		try { locales = Object.keys(JSON.parse(nav.getAttribute('data-languages') || '{}')); } catch (e) {}
		var seg = location.pathname.split('/')[1];
		if (seg && locales.indexOf(seg) !== -1) return false;
		return true;
	}

	function flagSrc(flag) {
		return '/lib/circle-flags/' + encodeURIComponent(flag) + '.svg';
	}

	function openModal(country, locale, prompt) {
		var title = document.getElementById('lp-title');
		title.textContent = (title.textContent || '').replace('{language}', prompt.name);
		var sub = document.getElementById('lp-sub');
		sub.textContent = prompt.question;
		sub.setAttribute('dir', prompt.dir || 'ltr');
		document.getElementById('lp-locale-flag').src = flagSrc(prompt.flag);
		document.getElementById('lp-locale-name').textContent = prompt.label;
		document.getElementById('lp-locale-gloss').textContent = prompt.name;
		document.getElementById('lp-english-gloss').textContent = prompt.english_gloss;
		if (country && window.LangFlag && window.LangFlag.flagFor) {
			var enFlag = window.LangFlag.flagFor('en', country);
			if (enFlag) document.getElementById('lp-english-flag').src = flagSrc(enFlag);
		}

		var restore = document.activeElement;
		modal.hidden = false;
		document.getElementById('lp-locale').focus();

		function close() {
			modal.hidden = true;
			markAsked();
			document.removeEventListener('keydown', onKey);
			if (restore && restore.focus) restore.focus();
		}

		function onKey(e) {
			if (e.key === 'Escape') close();
		}

		document.addEventListener('keydown', onKey);
		modal.addEventListener('click', function (e) {
			if (e.target === modal) close();
		});
		document.getElementById('lp-close').addEventListener('click', close);
		document.getElementById('lp-english').addEventListener('click', function () {
			document.cookie = 'site_locale=en; max-age=31536000; path=/; samesite=lax';
			close();
		});
		document.getElementById('lp-locale').addEventListener('click', function () {
			markAsked();
			document.cookie = 'site_locale=' + encodeURIComponent(locale) + '; max-age=31536000; path=/; samesite=lax';
			var path = location.pathname === '/' ? '' : location.pathname;
			location.assign('/' + locale + path + location.search);
		});
	}

	function show(country, locale, prompt) {
		setTimeout(function () {
			openModal(country, locale, prompt);
		}, 300);
	}

	if (!allowed()) return;

	var geo = geoConfig();
	if (!geo) return;

	var stored = null;
	try { stored = localStorage.getItem('cf_country'); } catch (e) {}

	var hit = pickBrowser(geo.prompts);
	if (hit) {
		show(stored || '', hit.locale, hit.prompt);
		return;
	}

	function offer(country) {
		var fallback = pickCountry(geo, country);
		if (fallback) show(country, fallback.locale, fallback.prompt);
	}

	if (stored) {
		offer(stored.toUpperCase());
		return;
	}
	if (!window.fetch) return;
	fetch('/cdn-cgi/trace').then(function (res) { return res.text(); }).then(function (text) {
		var match = /(?:^|\n)loc=([A-Za-z]{2})(?:\n|$)/.exec(text || '');
		if (!match) return;
		var country = match[1].toUpperCase();
		try { localStorage.setItem('cf_country', country); } catch (e) {}
		offer(country);
	}).catch(function () {});
})();

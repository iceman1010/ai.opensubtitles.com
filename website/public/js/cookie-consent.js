(function () {
	'use strict';

	var CONSENT_KEY = 'cookie_consent';
	var COUNTRY_KEY = 'cf_country';

	function meta(name) {
		var el = document.querySelector('meta[name="' + name + '"]');
		return el ? el.getAttribute('content') : '';
	}

	var gaId = meta('ga-id');
	if (!gaId) return;

	var countries = [];
	try { countries = JSON.parse(meta('cookie-countries') || '[]'); } catch (e) {}

	function initGA() {
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () { window.dataLayer.push(arguments); };
		window.gtag('js', new Date());
		window.gtag('config', gaId);
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
		document.head.appendChild(s);
	}

	function storedConsent() {
		try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
	}

	function showBanner() {
		var banner = document.getElementById('cookie-banner');
		if (!banner) return;
		banner.hidden = false;
		var accept = document.getElementById('cookie-accept');
		var decline = document.getElementById('cookie-decline');
		if (accept) accept.addEventListener('click', function () {
			try { localStorage.setItem(CONSENT_KEY, 'granted'); } catch (e) {}
			banner.hidden = true;
			initGA();
		});
		if (decline) decline.addEventListener('click', function () {
			try { localStorage.setItem(CONSENT_KEY, 'denied'); } catch (e) {}
			banner.hidden = true;
		});
	}

	function resolveCountry(cb) {
		var cached = null;
		try { cached = localStorage.getItem(COUNTRY_KEY); } catch (e) {}
		if (cached) return cb(cached.toUpperCase());
		if (!window.fetch) return cb('');
		fetch('/cdn-cgi/trace').then(function (res) { return res.text(); }).then(function (text) {
			var match = /(?:^|\n)loc=([A-Za-z]{2})(?:\n|$)/.exec(text || '');
			var cc = match ? match[1].toUpperCase() : '';
			if (cc) { try { localStorage.setItem(COUNTRY_KEY, cc); } catch (e) {} }
			cb(cc);
		}).catch(function () { cb(''); });
	}

	resolveCountry(function (cc) {
		if (countries.indexOf(cc) === -1) return initGA();
		var consent = storedConsent();
		if (consent === 'granted') return initGA();
		if (consent === null) showBanner();
	});
})();

(function () {
	'use strict';

	var CONSENT_KEY = 'cookie_consent';

	var gaId = Common.meta('ga-id');
	if (!gaId) return;

	var countries = [];
	try { countries = JSON.parse(Common.meta('cookie-countries') || '[]'); } catch (e) {}

	function consentDefaults(granted) {
		var value = granted ? 'granted' : 'denied';
		return { ad_storage: value, ad_user_data: value, ad_personalization: value, analytics_storage: value };
	}

	function initGA(granted) {
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () { window.dataLayer.push(arguments); };
		window.gtag('consent', 'default', consentDefaults(granted));
		window.gtag('js', new Date());
		window.gtag('config', gaId);
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
		document.head.appendChild(s);
	}

	function grantConsent() {
		if (window.gtag) window.gtag('consent', 'update', consentDefaults(true));
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
			grantConsent();
		});
		if (decline) decline.addEventListener('click', function () {
			try { localStorage.setItem(CONSENT_KEY, 'denied'); } catch (e) {}
			banner.hidden = true;
		});
	}

	Common.country(function (cc) {
		if (countries.indexOf(cc) === -1) return initGA(true);
		var consent = storedConsent();
		if (consent === 'granted') return initGA(true);
		initGA(false);
		if (consent === null) showBanner();
	});
})();

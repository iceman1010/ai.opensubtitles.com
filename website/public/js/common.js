(function () {
	'use strict';

	var langNames = {};

	function el(id) {
		return document.getElementById(id);
	}

	function i18n(id) {
		const node = document.getElementById(id);
		return node ? Object.assign({}, node.dataset) : {};
	}

	function esc(value) {
		return String(value === undefined || value === null ? '' : value)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	function meta(name) {
		const node = document.querySelector('meta[name="' + name + '"]');
		return node ? node.getAttribute('content') || '' : '';
	}

	function localePrefix() {
		return meta('locale-prefix');
	}

	function showError(box, message) {
		box.textContent = message;
		box.hidden = false;
	}

	function setButtonBusy(button, busy, label) {
		const span = button.querySelector('.btn-label');
		if (!span) return;
		if (busy) {
			span.dataset.original = span.textContent;
			span.textContent = label;
			button.disabled = true;
		} else {
			span.textContent = span.dataset.original || span.textContent;
			button.disabled = false;
		}
	}

	function formatSize(fileName) {
		const match = /(\d+(?:[.,]\d+)?)\s?(KB|MB|GB)/i.exec(fileName || '');
		return match ? match[1] + ' ' + match[2].toUpperCase() : null;
	}

	function formatDate(iso) {
		if (!iso) return null;
		try {
			return new Date(iso).toLocaleDateString();
		} catch (e) {
			return null;
		}
	}

	function make(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function icon(name) {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'btn-icon');
		svg.setAttribute('aria-hidden', 'true');
		const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
		use.setAttribute('href', '#icon-' + name);
		svg.appendChild(use);
		return svg;
	}

	function iconBtn(classes, label, iconName, iconOnly) {
		const btn = make('button', classes);
		btn.type = 'button';
		btn.appendChild(icon(iconName));
		if (iconOnly) {
			btn.setAttribute('aria-label', label);
			btn.title = label;
		} else {
			btn.appendChild(make('span', 'btn-label', label));
		}
		return btn;
	}

	function loadScript(src, marker, label) {
		return new Promise((resolve, reject) => {
			const existing = document.querySelector('script[data-' + marker + '="1"]');
			if (existing) return resolve();
			const script = document.createElement('script');
			script.src = src;
			script.dataset[marker] = '1';
			script.onload = resolve;
			script.onerror = () => reject(new Error('Failed to load ' + label));
			document.head.appendChild(script);
		});
	}

	function storedCountry() {
		try { return (localStorage.getItem('cf_country') || '').toUpperCase(); } catch (e) { return ''; }
	}

	function country(cb) {
		if (!cb) return;
		const cached = storedCountry();
		if (cached) return cb(cached);
		if (!window.fetch) return cb('');
		fetch('/cdn-cgi/trace').then((res) => res.text()).then((text) => {
			const match = /(?:^|\n)loc=([A-Za-z]{2})(?:\n|$)/.exec(text || '');
			const cc = match ? match[1].toUpperCase() : '';
			if (cc) { try { localStorage.setItem('cf_country', cc); } catch (e) {} }
			cb(cc);
		}).catch(() => cb(''));
	}

	const FLAGS = '/lib/circle-flags/';
	const LANG_COUNTRY = {
		ab: 'ge', af: 'za', sq: 'al', am: 'et', ar: 'sa', an: 'es', hy: 'am', as: 'in', at: 'es',
		'az-az': 'az', eu: 'es', be: 'by', bn: 'bd', bs: 'ba', br: 'fr', bg: 'bg', my: 'mm', ca: 'es',
		ze: 'cn', 'zh-ca': 'hk', 'zh-cn': 'cn', 'zh-tw': 'tw', hr: 'hr', cs: 'cz', da: 'dk', pr: 'af',
		nl: 'nl', en: 'gb', et: 'ee', ex: 'es', fi: 'fi', fr: 'fr', gd: 'gb-sct', gl: 'es', ka: 'ge',
		de: 'de', el: 'gr', he: 'il', hi: 'in', hu: 'hu', is: 'is', ig: 'ng', id: 'id', ga: 'ie',
		it: 'it', ja: 'jp', kn: 'in', kk: 'kz', km: 'kh', ko: 'kr', lv: 'lv', lt: 'lt', lb: 'lu',
		mk: 'mk', ms: 'my', ml: 'in', ma: 'in', mr: 'in', mn: 'mn', me: 'me', nv: 'us', ne: 'np',
		se: 'sami', no: 'no', oc: 'fr', or: 'in', fa: 'ir', pl: 'pl', 'pt-pt': 'pt', 'pt-br': 'br',
		pm: 'mz', ps: 'af', ro: 'ro', ru: 'ru', sx: 'in', sr: 'rs', sd: 'pk', si: 'lk', sk: 'sk',
		sl: 'si', so: 'so', 'az-zb': 'ir', es: 'es', sp: 'es', ea: 'mx', sw: 'tz', sv: 'se', sy: 'sy',
		tl: 'ph', ta: 'in', tt: 'ru', te: 'in', 'tm-td': 'tl', th: 'th', tr: 'tr', tk: 'tm', uk: 'ua',
		ur: 'pk', uz: 'uz', vi: 'vn', cy: 'gb-wls'
	};

	function displayName(code) {
		const key = String(code || '').toLowerCase();
		const loc = document.documentElement.lang || 'en';
		if (window.Intl && Intl.DisplayNames) {
			try {
				const name = new Intl.DisplayNames([loc], { type: 'language' }).of(key);
				if (name && name !== key) return name;
			} catch (e) {}
		}
		return null;
	}

	function langName(code) {
		const key = String(code || '').toLowerCase();
		return displayName(key) || langNames[key] || key.toUpperCase();
	}

	function langFlagSrc(code) {
		const key = String(code || '').toLowerCase();
		const nf = window.LangFlag;
		if (nf) {
			const flag = nf.flagFor(key, nf.country());
			if (flag) return FLAGS + flag + '.svg';
		}
		return LANG_COUNTRY[key] ? FLAGS + LANG_COUNTRY[key] + '.svg' : null;
	}

	function langBadge(code) {
		const key = String(code || '').toLowerCase();
		const src = langFlagSrc(key) || FLAGS + 'xx.svg';
		return '<span class="lang-badge"><img class="lang-flag" src="' + esc(src) + '" alt="' + esc(langName(key)) + '" width="15" height="15" data-lang="' + esc(key) + '">' + esc(langName(key)) + '</span>';
	}

	async function loadLangNames() {
		try {
			const list = await AI.searchLanguages();
			langNames = {};
			list.forEach((lang) => { langNames[lang.language_code] = lang.language_name; });
			return list;
		} catch (e) {
			langNames = { en: 'English' };
			throw e;
		}
	}

	function posterUrlFor(featureId) {
		const s = String(featureId);
		return 'https://s8.opensubtitles.com/features/' + s.slice(-1) + '/' + s.slice(-2, -1) + '/' + s.slice(-3, -2) + '/' + s + '.jpg';
	}

	function posterBox(imgUrl, title) {
		return imgUrl
			? '<div class="feature-poster has-img" data-poster="' + esc(imgUrl) + '" data-title="' + esc(title || '') + '"><img class="feature-poster-img" src="' + esc(imgUrl) + '" alt="' + esc(title || '') + '" loading="lazy"></div>'
			: '<div class="feature-poster poster-empty" aria-hidden="true"><svg class="btn-icon"><use href="#icon-film"/></svg></div>';
	}

	async function fetchSubtitleContent(fileId) {
		const data = await AI.downloadSubtitleFile(fileId);
		if (data && data.link) {
			const res = await fetch(data.link);
			return res.text();
		}
		if (data && data.file) return data.file;
		throw new Error('No subtitle content in response');
	}

	window.Common = {
		el: el,
		i18n: i18n,
		esc: esc,
		meta: meta,
		localePrefix: localePrefix,
		showError: showError,
		setButtonBusy: setButtonBusy,
		formatSize: formatSize,
		formatDate: formatDate,
		make: make,
		icon: icon,
		iconBtn: iconBtn,
		loadScript: loadScript,
		storedCountry: storedCountry,
		country: country,
		displayName: displayName,
		langName: langName,
		langFlagSrc: langFlagSrc,
		langBadge: langBadge,
		loadLangNames: loadLangNames,
		posterUrlFor: posterUrlFor,
		posterBox: posterBox,
		fetchSubtitleContent: fetchSubtitleContent
	};
})();

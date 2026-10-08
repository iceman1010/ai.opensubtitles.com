(function () {
	'use strict';

	var FLAGS = '/lib/circle-flags/';

	var nav = document.getElementById('lang-nav');
	var btn = document.getElementById('lang-btn');
	var menu = document.getElementById('lang-menu');
	if (!nav || !btn || !menu) return;

	var current = nav.getAttribute('data-current') || 'en';
	var languages = {};
	try { languages = JSON.parse(nav.getAttribute('data-languages') || '{}'); } catch (e) { languages = {}; }

	function flagFor(code, country) {
		var cfg = languages[code];
		if (!cfg) return null;
		var key = String(country || '').toLowerCase();
		if (key && cfg.overrides && cfg.overrides[key]) return cfg.overrides[key];
		return cfg.flag || null;
	}

	function applyCountry(country) {
		var imgs = document.querySelectorAll('img[data-lang]');
		Array.prototype.forEach.call(imgs, function (img) {
			var flag = flagFor(img.getAttribute('data-lang'), country);
			if (flag) img.src = FLAGS + flag + '.svg';
		});
	}

	function setOpen(open) {
		nav.classList.toggle('open', open);
		btn.setAttribute('aria-expanded', String(open));
		if (window.innerWidth > 640) {
			nav.style.paddingRight = open
				? Math.max(0, menu.offsetWidth - btn.offsetWidth) + 'px'
				: '0px';
		}
		if (open) {
			clearSearch();
			scrollToCurrent();
			updateScrollButtons();
		}
	}

	var scroller = document.getElementById('lang-scroll');
	var scrollUp = document.getElementById('lang-scroll-up');
	var scrollDown = document.getElementById('lang-scroll-down');
	var searchInput = document.getElementById('lang-search');
	var emptyRow = document.getElementById('lang-empty');

	function scrollToCurrent() {
		if (!scroller) return;
		var row = scroller.querySelector('.lang-option[aria-current]');
		if (!row) return;
		var target = row.offsetTop - scroller.offsetTop - (scroller.clientHeight - row.offsetHeight) / 2;
		scroller.scrollTop = Math.max(0, Math.min(target, scroller.scrollHeight - scroller.clientHeight));
	}

	function updateScrollButtons() {
		if (!scroller || !scrollUp || !scrollDown) return;
		var max = scroller.scrollHeight - scroller.clientHeight;
		if (max <= 8) {
			scrollUp.hidden = true;
			scrollDown.hidden = true;
			return;
		}
		scrollDown.hidden = scroller.scrollTop >= max - 8;
		scrollUp.hidden = scroller.scrollTop <= 8;
	}

	function scrollPage(direction) {
		if (!scroller) return;
		var row = scroller.querySelector('.lang-option');
		var step = scroller.clientHeight - (row ? row.offsetHeight + 4 : 56);
		scroller.scrollBy({ top: direction * step, behavior: 'smooth' });
	}

	if (scroller && scrollUp && scrollDown) {
		scroller.addEventListener('scroll', updateScrollButtons, { passive: true });
		scrollUp.addEventListener('click', function () { scrollPage(-1); });
		scrollDown.addEventListener('click', function () { scrollPage(1); });
		window.addEventListener('resize', updateScrollButtons);
	}

	var enNames = null;
	if (window.Intl && Intl.DisplayNames) {
		try { enNames = new Intl.DisplayNames(['en'], { type: 'language' }); } catch (e) {}
	}

	function normalizeText(text) {
		return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	}

	function rowText(row) {
		if (row._langSearch) return row._langSearch;
		var code = row.getAttribute('data-lang') || '';
		var parts = [code];
		var primary = row.querySelector('.lang-primary');
		var alt = row.querySelector('.lang-alt');
		if (primary) parts.push(primary.textContent);
		if (alt && alt.textContent) parts.push(alt.textContent);
		if (enNames) { try { parts.push(enNames.of(code)); } catch (e) {} }
		row._langSearch = normalizeText(parts.join(' '));
		return row._langSearch;
	}

	function clearSearch() {
		if (!searchInput) return;
		searchInput.value = '';
		if (scroller) {
			var rows = scroller.querySelectorAll('.lang-option');
			Array.prototype.forEach.call(rows, function (row) { row.hidden = false; });
		}
		if (emptyRow) emptyRow.hidden = true;
	}

	function filterRows() {
		if (!searchInput || !scroller) return;
		var query = normalizeText(searchInput.value.trim());
		var visible = 0;
		var rows = scroller.querySelectorAll('.lang-option');
		Array.prototype.forEach.call(rows, function (row) {
			var match = !query || rowText(row).indexOf(query) !== -1;
			row.hidden = !match;
			if (match) visible++;
		});
		if (emptyRow) emptyRow.hidden = !(query && visible === 0);
		if (!query) scrollToCurrent();
		updateScrollButtons();
	}

	if (searchInput) {
		searchInput.addEventListener('input', filterRows);
		searchInput.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && searchInput.value) {
				searchInput.value = '';
				filterRows();
				e.stopPropagation();
			} else if (e.key === 'ArrowDown') {
				var first = scroller ? scroller.querySelector('.lang-option:not([hidden])') : null;
				if (first) { first.focus(); e.preventDefault(); }
			}
		});
	}

	if (window.Intl && Intl.DisplayNames) {
		try {
			var names = new Intl.DisplayNames([current, 'en'], { type: 'language' });
			var rows = menu.querySelectorAll('.lang-option');
			Array.prototype.forEach.call(rows, function (row) {
				var code = row.getAttribute('data-lang');
				var name = names.of(code);
				var primary = row.querySelector('.lang-primary');
				var alt = row.querySelector('.lang-alt');
				if (!name || name === code || !primary || !alt) return;
				var value = name.charAt(0).toUpperCase() + name.slice(1);
				if (value.toLowerCase() !== primary.textContent.trim().toLowerCase()) {
					alt.textContent = value;
				}
			});
		} catch (e) {}
	}

	var stored = null;
	try { stored = localStorage.getItem('cf_country'); } catch (e) {}
	if (stored) {
		applyCountry(stored);
	} else if (window.fetch) {
		fetch('/cdn-cgi/trace').then(function (res) { return res.text(); }).then(function (text) {
			var match = /(?:^|\n)loc=([A-Za-z]{2})(?:\n|$)/.exec(text || '');
			if (!match) return;
			var country = match[1].toUpperCase();
			try { localStorage.setItem('cf_country', country); } catch (e) {}
			applyCountry(country);
		}).catch(function () {});
	}

	btn.addEventListener('click', function (e) {
		e.stopPropagation();
		setOpen(!nav.classList.contains('open'));
	});

	document.addEventListener('click', function (e) {
		if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
	});

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') setOpen(false);
	});

	window.addEventListener('resize', function () {
		if (window.innerWidth <= 640 && nav.classList.contains('open')) {
			nav.style.paddingRight = '0px';
		}
	});

	menu.addEventListener('click', function (e) {
		var row = e.target && e.target.closest ? e.target.closest('.lang-option') : null;
		if (!row) return;
		document.cookie = 'site_locale=' + encodeURIComponent(row.getAttribute('data-lang')) + '; max-age=31536000; path=/; samesite=lax';
	});

	window.LangFlag = { flagFor: flagFor, country: function () { return stored || ''; } };
})();

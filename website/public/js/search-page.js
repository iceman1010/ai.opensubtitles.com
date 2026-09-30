(function () {
	const state = {
		mode: 'subtitles',
		page: 1,
		totalPages: 1,
		totalCount: 0,
		query: '',
		imdbKind: 'imdb_id',
		lastParams: null
	};

	const el = (id) => document.getElementById(id);
	const i18n = Object.assign({}, document.getElementById('search-i18n').dataset);
	const i18n_placeholder_subtitles = i18n.placeholder_subtitles || 'Search…';
	const i18n_placeholder_features = i18n.placeholder_features || 'Search…';
	let langNames = {};

	function esc(value) {
		return String(value === undefined || value === null ? '' : value)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	function showError(message) {
		const box = el('search-error');
		box.textContent = message;
		box.hidden = false;
	}

	function clearError() {
		el('search-error').hidden = true;
		el('search-error').textContent = '';
	}

	function setBusy(busy) {
		el('search-submit').disabled = busy;
		el('search-submit').querySelector('.btn-label').textContent = busy ? i18n.searching : i18n.submit;
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

	async function loadLanguages() {
		const select = el('search-language');
		try {
			const list = await AI.searchLanguages();
			select.innerHTML = list.map((lang) =>
				'<option value="' + esc(lang.language_code) + '">' + esc(lang.language_name) + '</option>'
			).join('');
			langNames = {};
			list.forEach((lang) => { langNames[lang.language_code] = lang.language_name; });
		} catch (e) {
			select.innerHTML = '<option value="en">English</option>';
			langNames = { en: 'English' };
		}
		const saved = AI.getConfig().lastSearchLanguage;
		const codes = Array.from(select.options).map((o) => o.value);
		select.value = saved && codes.includes(saved) ? saved : (codes.includes('en') ? 'en' : codes[0]);
	}

	function buildParams() {
		const query = el('search-query').value.trim();
		const imdb = el('search-imdb').value.trim();
		const year = parseInt(el('search-year').value, 10);
		const type = el('search-type').value;
		const params = { page: state.page };
		if (query) params.query = query;
		if (imdb) params[state.imdbKind] = imdb;
		if (!isNaN(year)) params.year = year;
		if (state.mode === 'subtitles') {
			params.languages = el('search-language').value;
			if (type) params.type = type;
		} else if (type) {
			params.type = type;
		}
		return params;
	}

	function posterUrlFor(featureId) {
		const s = String(featureId);
		return 'https://s8.opensubtitles.com/features/' + s.slice(-1) + '/' + s.slice(-2, -1) + '/' + s.slice(-3, -2) + '/' + s + '.jpg';
	}

	function posterBox(imgUrl) {
		return imgUrl
			? '<div class="feature-poster has-img" data-poster="' + esc(imgUrl) + '"><img class="feature-poster-img" src="' + esc(imgUrl) + '" alt="" loading="lazy"></div>'
			: '<div class="feature-poster poster-empty" aria-hidden="true"><svg class="btn-icon"><use href="#icon-film"/></svg></div>';
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

	function langFlagSrc(code) {
		const key = String(code || '').toLowerCase();
		const nf = window.LangFlag;
		if (nf) {
			const flag = nf.flagFor(key, nf.country());
			if (flag) return FLAGS + flag + '.svg';
		}
		return LANG_COUNTRY[key] ? FLAGS + LANG_COUNTRY[key] + '.svg' : null;
	}

	function langName(code) {
		const key = String(code || '').toLowerCase();
		if (langNames[key]) return langNames[key];
		if (window.Intl && Intl.DisplayNames) {
			try {
				const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(key);
				if (name && name !== key) return name;
			} catch (e) {}
		}
		return key.toUpperCase();
	}

	function langBadge(code) {
		const key = String(code || '').toLowerCase();
		const src = langFlagSrc(key) || FLAGS + 'xx.svg';
		return '<span class="lang-badge"><img class="lang-flag" src="' + esc(src) + '" alt="" width="15" height="15" data-lang="' + esc(key) + '">' + esc(langName(key)) + '</span>';
	}

	function renderSubtitles(data) {
		const grid = el('results-grid');
		const items = data.data || [];
		if (!items.length) {
			grid.innerHTML = '<p class="results-empty">' + esc(i18n.empty) + '</p>';
			return;
		}
		grid.innerHTML = items.map((item) => {
			const a = item.attributes || {};
			const fd = a.feature_details || {};
			const file = (a.files && a.files[0]) || {};
			const imdbId = fd.imdb_id;
			const typeIcon = fd.feature_type === 'Movie' ? '#icon-tag' : '#icon-languages';
			const chips = [];
			if (a.hearing_impaired) chips.push('<span class="issue-chip">' + esc(i18n.hearing_impaired) + '</span>');
			if (a.ai_translated) chips.push('<span class="issue-chip">' + esc(i18n.ai_translated) + '</span>');
			if (a.foreign_parts_only) chips.push('<span class="issue-chip">' + esc(i18n.foreign_parts) + '</span>');
			if (a.from_trusted) chips.push('<span class="issue-chip">' + esc(i18n.trusted) + '</span>');
			const onDemand = a.uploader && a.uploader.name === i18n.on_demand_uploader;
			const size = formatSize(file.file_name);
			const uploaded = formatDate(a.upload_date);
			const poster = fd.feature_id ? posterBox(posterUrlFor(fd.feature_id)) : posterBox(null);
			return '<article class="card sub-card has-poster" data-file-id="' + esc(file.file_id || '') + '" data-file-name="' + esc(file.file_name || '') + '">' +
				poster +
				'<div class="feature-body">' +
				'<div class="sub-card-head">' +
					'<h3><svg class="btn-icon" aria-hidden="true"><use href="' + typeIcon + '"/></svg> ' + esc(fd.title || a.release || '?') +
					(fd.year ? ' <span class="sub-year">(' + esc(fd.year) + ')</span>' : '') + '</h3>' +
					langBadge(a.language) +
				'</div>' +
				(a.release ? '<p class="sub-release">' + esc(i18n.release) + ': ' + esc(a.release) + '</p>' : '') +
				'<p class="sub-meta">' +
					'<span>' + esc(String(a.download_count || 0)) + ' ' + esc(i18n.downloads) + '</span>' +
					(size ? '<span>' + esc(size) + '</span>' : '') +
					(a.fps > 0 ? '<span>' + esc(a.fps) + ' fps</span>' : '') +
					(uploaded ? '<span>' + esc(i18n.uploaded) + ' ' + esc(uploaded) + '</span>' : '') +
				'</p>' +
				(chips.length ? '<p class="sub-chips">' + chips.join('') + '</p>' : '') +
				'<p class="sub-uploader">' + esc(i18n.by) + ' ' + esc((a.uploader && a.uploader.name) || '?') +
					(onDemand ? ' · <span class="sub-ondemand" title="' + esc(i18n.on_demand) + '">AI</span>' : '') +
					(imdbId ? ' · <a class="sub-imdb" href="https://www.imdb.com/title/tt' + esc(String(imdbId).padStart(7, '0')) + '" target="_blank" rel="noopener">IMDb</a>' : '') +
				'</p>' +
				'<div class="sub-actions">' +
					'<button class="btn btn-ghost btn-small" data-action="preview" type="button"><svg class="btn-icon" aria-hidden="true"><use href="#icon-eye"/></svg><span class="btn-label">' + esc(i18n.preview) + '</span></button>' +
					'<button class="btn btn-primary btn-small" data-action="download" type="button"><svg class="btn-icon" aria-hidden="true"><use href="#icon-download"/></svg><span class="btn-label">' + esc(i18n.download) + '</span></button>' +
				'</div>' +
				'</div>' +
			'</article>';
		}).join('');
	}

	function renderFeatures(data) {
		const grid = el('results-grid');
		const items = data.data || [];
		if (!items.length) {
			grid.innerHTML = '<p class="results-empty">' + esc(i18n.empty) + '</p>';
			return;
		}
		grid.innerHTML = items.map((item) => {
			const a = item.attributes || {};
			const imdbId = a.imdb_id;
			const isShow = a.feature_type === 'Tvshow';
			const counts = isShow ? a.seasons_count : a.subtitles_count;
			const countLabel = isShow ? i18n.episodes_count : i18n.subtitles_count;
			const poster = posterBox(a.img_url);
			return '<article class="card sub-card feature-card" data-imdb="' + esc(imdbId || '') + '" data-feature-type="' + esc(a.feature_type || '') + '">' +
				poster +
				'<div class="feature-body">' +
					'<div class="sub-card-head">' +
						'<h3>' + esc(a.title || '?') + (a.year ? ' <span class="sub-year">(' + esc(a.year) + ')</span>' : '') + '</h3>' +
						'<span class="lang-badge">' + esc(a.feature_type || '') + '</span>' +
					'</div>' +
					(a.parent_title ? '<p class="sub-release">' + esc(a.parent_title) + '</p>' : '') +
					'<p class="sub-meta">' +
						(counts !== undefined && counts !== null ? '<span>' + esc(String(counts)) + ' ' + esc(countLabel) + '</span>' : '') +
						(imdbId ? '<span>IMDb ' + esc(String(imdbId)) + '</span>' : '') +
					'</p>' +
					(imdbId ? '<div class="sub-actions"><button class="btn btn-primary btn-small" data-action="find" type="button"><svg class="btn-icon" aria-hidden="true"><use href="#icon-search"/></svg><span class="btn-label">' + esc(i18n.find_subtitles) + '</span></button></div>' : '') +
				'</div>' +
			'</article>';
		}).join('');
	}

	function renderResults(data) {
		const isSubs = state.mode === 'subtitles';
		el('results-title').textContent = isSubs ? i18n.results_title_subtitles : i18n.results_title_features;
		state.totalCount = data.total_count || 0;
		state.totalPages = Math.max(1, data.total_pages || 1);
		el('results-meta').textContent = state.totalCount.toLocaleString() + ' ' + i18n.found;
		if (isSubs) renderSubtitles(data);
		else renderFeatures(data);
		const pag = el('pagination');
		pag.hidden = state.totalPages <= 1;
		el('page-info').textContent = i18n.page_of + ' ' + state.page + ' ' + i18n.of + ' ' + state.totalPages;
		el('page-prev').disabled = state.page <= 1;
		el('page-next').disabled = state.page >= state.totalPages;
		el('search-results').hidden = false;
	}

	async function runSearch() {
		const params = buildParams();
		if (!params.query && !params.imdb_id && !params.parent_imdb_id) return;
		clearError();
		setBusy(true);
		state.lastParams = Object.assign({}, params);
		try {
			const data = state.mode === 'subtitles'
				? await AI.searchSubtitles(params)
				: await AI.searchFeatures(params);
			renderResults(data);
		} catch (e) {
			showError(i18n.error + ' ' + e.message);
		} finally {
			setBusy(false);
		}
	}

	function requireLogin() {
		if (AI.loggedIn()) return true;
		location.href = '/login';
		return false;
	}

	async function fetchSubtitleContent(fileId) {
		const data = await AI.downloadSubtitleFile(fileId);
		if (data && data.link) {
			const res = await fetchWithRetryPlain(data.link);
			return res.text();
		}
		if (data && data.file) return data.file;
		throw new Error('No subtitle content in response');
	}

	async function fetchWithRetryPlain(url) {
		return fetch(url);
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

	async function handleCardAction(card, action, button) {
		const fileId = card.dataset.fileId;
		const fileName = card.dataset.fileName || 'subtitles.srt';
		if (!fileId || !requireLogin()) return;
		if (action === 'preview') {
			setButtonBusy(button, true, i18n.loading_preview);
			try {
				const content = await fetchSubtitleContent(fileId);
				PreviewModal.open(fileName.endsWith('.srt') ? fileName : fileName + '.srt', content, {
					download: i18n.download,
					close: i18n.close,
					font_smaller: i18n.font_smaller,
					font_larger: i18n.font_larger,
					find_placeholder: i18n.find_placeholder,
					find: i18n.find,
					cues: i18n.cues,
					prev_match: i18n.prev_match,
					next_match: i18n.next_match
				});
			} catch (e) {
				showError(i18n.download_failed + ' ' + e.message);
			} finally {
				setButtonBusy(button, false);
			}
		} else if (action === 'download') {
			setButtonBusy(button, true, i18n.downloading);
			try {
				const content = await fetchSubtitleContent(fileId);
				AI.downloadText(content, fileName.endsWith('.srt') ? fileName : fileName + '.srt');
			} catch (e) {
				showError(i18n.download_failed + ' ' + e.message);
			} finally {
				setButtonBusy(button, false);
			}
		}
	}

	function setMode(mode) {
		state.mode = mode;
		state.imdbKind = 'imdb_id';
		el('tab-subtitles').setAttribute('aria-selected', mode === 'subtitles');
		el('tab-features').setAttribute('aria-selected', mode === 'features');
		el('search-query').placeholder = mode === 'subtitles' ? i18n_placeholder_subtitles : i18n_placeholder_features;
		el('search-language').closest('label').hidden = mode === 'features';
		el('search-results').hidden = true;
		el('pagination').hidden = true;
	}

	function bind() {
		el('search-form').addEventListener('submit', (e) => {
			e.preventDefault();
			state.page = 1;
			runSearch();
		});
		el('tab-subtitles').addEventListener('click', () => setMode('subtitles'));
		el('tab-features').addEventListener('click', () => setMode('features'));
		el('search-advanced-toggle').addEventListener('click', () => {
			const panel = el('search-advanced');
			panel.hidden = !panel.hidden;
			el('search-advanced-toggle').textContent = i18n.advanced + (panel.hidden ? ' ▾' : ' ▴');
		});
		el('search-language').addEventListener('change', () => {
			AI.saveConfig({ lastSearchLanguage: el('search-language').value });
		});
		el('page-prev').addEventListener('click', () => {
			if (state.page > 1) { state.page--; runSearch(); window.scrollTo(0, 0); }
		});
		el('page-next').addEventListener('click', () => {
			if (state.page < state.totalPages) { state.page++; runSearch(); window.scrollTo(0, 0); }
		});
		el('results-grid').addEventListener('error', (e) => {
			const img = e.target;
			if (!img.classList || !img.classList.contains('feature-poster-img')) return;
			const box = img.parentElement;
			box.classList.remove('has-img');
			box.removeAttribute('data-poster');
			box.classList.add('poster-empty');
			box.innerHTML = '<svg class="btn-icon" aria-hidden="true"><use href="#icon-film"/></svg>';
		}, true);
		el('lightbox-overlay').addEventListener('click', () => {
			el('lightbox-overlay').hidden = true;
			el('lightbox-img').src = '';
		});
		el('results-grid').addEventListener('click', (e) => {
			const posterEl = e.target.closest('.feature-poster.has-img');
			if (posterEl && posterEl.dataset.poster) {
				el('lightbox-img').src = posterEl.dataset.poster;
				el('lightbox-overlay').hidden = false;
				return;
			}
			const button = e.target.closest('button[data-action]');
			if (!button) return;
			const card = e.target.closest('.sub-card');
			if (!card) return;
			const action = button.dataset.action;
			if (action === 'find') {
				const imdb = card.dataset.imdb;
				if (!imdb) return;
				setMode('subtitles');
				state.imdbKind = card.dataset.featureType === 'Tvshow' ? 'parent_imdb_id' : 'imdb_id';
				el('search-imdb').value = imdb;
				el('search-advanced').hidden = false;
				el('search-query').value = '';
				el('search-type').value = '';
				state.page = 1;
				runSearch();
				window.scrollTo(0, 0);
				return;
			}
			handleCardAction(card, action, button);
		});
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && !el('lightbox-overlay').hidden) {
				el('lightbox-overlay').hidden = true;
				el('lightbox-img').src = '';
			}
		});
	}

	loadLanguages();
	bind();
})();

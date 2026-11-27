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

	const el = Common.el;
	const qsa = (sel) => document.querySelectorAll(sel);
	const i18n = Common.i18n('search-i18n');
	const i18n_placeholder_subtitles = i18n.placeholder_subtitles || 'Search…';
	const i18n_placeholder_features = i18n.placeholder_features || 'Search…';
	const esc = Common.esc;
	const displayName = Common.displayName;
	const langBadge = Common.langBadge;
	const formatSize = Common.formatSize;
	const formatDate = Common.formatDate;
	const posterUrlFor = Common.posterUrlFor;
	const posterBox = Common.posterBox;
	const fetchSubtitleContent = Common.fetchSubtitleContent;
	const setButtonBusy = Common.setButtonBusy;
	const localePrefix = Common.localePrefix;

	function showError(message) {
		Common.showError(el('search-error'), message);
	}

	function clearError() {
		el('search-error').hidden = true;
		el('search-error').textContent = '';
	}

	function setBusy(busy) {
		el('search-submit').disabled = busy;
		el('search-submit').querySelector('.btn-label').textContent = busy ? i18n.searching : i18n.submit;
	}

	async function loadLanguages() {
		const select = el('search-language');
		let list;
		try {
			list = await Common.loadLangNames();
		} catch (e) {
			list = [{ language_code: 'en', language_name: 'English' }];
		}
		select.innerHTML = list.map((lang) =>
			'<option value="' + esc(lang.language_code) + '">' + esc(displayName(lang.language_code) || lang.language_name) + '</option>'
		).join('');
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
			const poster = fd.feature_id ? posterBox(posterUrlFor(fd.feature_id), fd.title || a.release) : posterBox(null);
			return '<article class="card sub-card has-poster" data-file-id="' + esc(file.file_id || '') + '" data-file-name="' + esc(file.file_name || '') + '" data-lang="' + esc(a.language || '') + '">' +
				poster +
				'<div class="feature-body">' +
				'<div class="sub-card-head">' +
					'<h3 dir="auto"><svg class="btn-icon" aria-hidden="true"><use href="' + typeIcon + '"/></svg> ' + esc(fd.title || a.release || '?') +
					(fd.year ? ' <span class="sub-year">(' + esc(fd.year) + ')</span>' : '') + '</h3>' +
					langBadge(a.language) +
				'</div>' +
				(a.release ? '<p class="sub-release" dir="auto">' + esc(i18n.release) + ': ' + esc(a.release) + '</p>' : '') +
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
					'<button class="btn btn-ghost btn-small" data-action="download" type="button"><svg class="btn-icon" aria-hidden="true"><use href="#icon-download"/></svg><span class="btn-label">' + esc(i18n.download) + '</span></button>' +
					'<button class="btn btn-primary btn-small" data-action="translate" type="button"><svg class="btn-icon" aria-hidden="true"><use href="#icon-languages"/></svg><span class="btn-label">' + esc(i18n.translate) + '</span></button>' +
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
			const poster = posterBox(a.img_url, a.title);
			return '<article class="card sub-card feature-card" data-imdb="' + esc(imdbId || '') + '" data-feature-type="' + esc(a.feature_type || '') + '">' +
				poster +
				'<div class="feature-body">' +
					'<div class="sub-card-head">' +
						'<h3 dir="auto">' + esc(a.title || '?') + (a.year ? ' <span class="sub-year">(' + esc(a.year) + ')</span>' : '') + '</h3>' +
						'<span class="lang-badge">' + esc(a.feature_type || '') + '</span>' +
					'</div>' +
					(a.parent_title ? '<p class="sub-release" dir="auto">' + esc(a.parent_title) + '</p>' : '') +
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
		qsa('.pagination').forEach((pag) => { pag.hidden = state.totalPages <= 1; });
		qsa('.page-info').forEach((node) => { node.textContent = i18n.page_of + ' ' + state.page + ' ' + i18n.of + ' ' + state.totalPages; });
		qsa('.page-prev').forEach((btn) => { btn.disabled = state.page <= 1; });
		qsa('.page-next').forEach((btn) => { btn.disabled = state.page >= state.totalPages; });
		el('search-results').hidden = false;
	}

	const URL_KEYS = ['mode', 'q', 'lang', 'year', 'type', 'imdb', 'parent', 'page'];

	function urlFromParams(params) {
		const q = new URLSearchParams();
		if (state.mode === 'features') q.set('mode', 'features');
		if (params.query) q.set('q', params.query);
		if (params.languages) q.set('lang', params.languages);
		if (params.year) q.set('year', params.year);
		if (params.type) q.set('type', params.type);
		if (params.imdb_id) q.set('imdb', params.imdb_id);
		if (params.parent_imdb_id) q.set('parent', params.parent_imdb_id);
		if (state.page > 1) q.set('page', state.page);
		const s = q.toString();
		return s ? '?' + s : '';
	}

	function syncUrl() {
		const qs = urlFromParams(buildParams());
		const target = location.pathname + qs;
		if (location.search !== qs) history.replaceState(null, '', target);
	}

	async function runSearch() {
		const params = buildParams();
		if (!params.query && !params.imdb_id && !params.parent_imdb_id) return;
		syncUrl();
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

	function requireLogin(card, action) {
		if (AI.loggedIn()) return true;
		sessionStorage.setItem('ai_redirect_after_login', location.pathname + location.search);
		if (state.lastParams) {
			var pending = card && action ? { action: action, fileId: card.dataset.fileId, fileName: card.dataset.fileName || '', lang: card.dataset.lang || '' } : null;
			sessionStorage.setItem('ai_resume_search', JSON.stringify({ params: state.lastParams, mode: state.mode, imdbKind: state.imdbKind, pending: pending }));
		}
		location.href = localePrefix() + '/login';
		return false;
	}

	async function handleCardAction(card, action, button) {
		const fileId = card.dataset.fileId;
		const fileName = card.dataset.fileName || 'subtitles.srt';
		if (!fileId || !requireLogin(card, action)) return;
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
				}, card.dataset.lang);
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
		} else if (action === 'translate') {
			setButtonBusy(button, true, i18n.downloading);
			try {
				const content = await fetchSubtitleContent(fileId);
				sessionStorage.setItem('ai_newjob_pending', JSON.stringify({
					name: fileName.endsWith('.srt') ? fileName : fileName + '.srt',
					content: content,
					lang: card.dataset.lang || ''
				}));
				location.href = localePrefix() + '/new';
			} catch (e) {
				showError(i18n.download_failed + ' ' + e.message);
				setButtonBusy(button, false);
			}
		}
	}

	function setMode(mode) {
		state.mode = mode;
		state.imdbKind = 'imdb_id';
		el('tab-subtitles').setAttribute('aria-pressed', mode === 'subtitles');
		el('tab-features').setAttribute('aria-pressed', mode === 'features');
		const label = mode === 'subtitles' ? i18n_placeholder_subtitles : i18n_placeholder_features;
		el('search-query').placeholder = label;
		el('search-query').setAttribute('aria-label', label);
		el('search-language').closest('label').hidden = mode === 'features';
		el('search-results').hidden = true;
		qsa('.pagination').forEach((pag) => { pag.hidden = true; });
	}

	function prefersReducedMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function keepViewOnPagination(btn, barTopBefore) {
		const pag = btn.closest('.pagination');
		if (!pag || barTopBefore == null) return;
		const delta = pag.getBoundingClientRect().top - barTopBefore;
		if (delta) window.scrollBy(0, delta);
	}

	const FADE_MS = 300;

	async function swapResultsPage(refresh) {
		const grid = el('results-grid');
		if (prefersReducedMotion()) return refresh();
		grid.classList.add('is-fading');
		try {
			await Promise.all([
				new Promise((resolve) => setTimeout(resolve, FADE_MS)),
				Promise.resolve(refresh())
			]);
		} finally {
			grid.classList.remove('is-fading');
		}
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
		const paginate = (btn) => {
			const barTop = btn.closest('.pagination').getBoundingClientRect().top;
			swapResultsPage(runSearch).then(() => keepViewOnPagination(btn, barTop));
		};
		qsa('.page-prev').forEach((btn) => btn.addEventListener('click', () => {
			if (state.page > 1) { state.page--; paginate(btn); }
		}));
		qsa('.page-next').forEach((btn) => btn.addEventListener('click', () => {
			if (state.page < state.totalPages) { state.page++; paginate(btn); }
		}));
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
			el('lightbox-img').alt = '';
		});
		el('results-grid').addEventListener('click', (e) => {
			const posterEl = e.target.closest('.feature-poster.has-img');
			if (posterEl && posterEl.dataset.poster) {
				el('lightbox-img').src = posterEl.dataset.poster;
				el('lightbox-img').alt = posterEl.dataset.title || '';
				el('lightbox-overlay').hidden = false;
				el('lightbox-overlay').focus();
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
				el('lightbox-img').alt = '';
			}
		});
	}

	function applyUrlState() {
		const p = new URLSearchParams(location.search);
		if (!URL_KEYS.some((k) => p.has(k))) return false;
		setMode(p.get('mode') === 'features' ? 'features' : 'subtitles');
		const query = (p.get('q') || '').trim();
		const imdb = (p.get('imdb') || '').trim();
		const parent = (p.get('parent') || '').trim();
		if (query) el('search-query').value = query;
		if (imdb || parent) {
			el('search-imdb').value = imdb || parent;
			state.imdbKind = parent ? 'parent_imdb_id' : 'imdb_id';
			el('search-advanced').hidden = false;
		}
		const year = parseInt(p.get('year'), 10);
		if (!isNaN(year)) el('search-year').value = year;
		const type = p.get('type') || '';
		if (type) el('search-type').value = type;
		const lang = p.get('lang') || '';
		if (lang) {
			const codes = Array.from(el('search-language').options).map((o) => o.value);
			if (codes.includes(lang)) el('search-language').value = lang;
		}
		state.page = Math.max(1, parseInt(p.get('page'), 10) || 1);
		runSearch();
		return true;
	}

	function applyImdbPrefill() {
		var imdb = el('search-form').dataset.imdbPrefill;
		if (!imdb || sessionStorage.getItem('ai_resume_search')) return;
		setMode('subtitles');
		state.imdbKind = el('search-form').dataset.imdbKind === 'parent_imdb_id' ? 'parent_imdb_id' : 'imdb_id';
		el('search-imdb').value = imdb;
		el('search-advanced').hidden = false;
		state.page = 1;
		runSearch();
	}

	async function resumeSearch() {
		var raw = sessionStorage.getItem('ai_resume_search');
		if (!raw) return false;
		sessionStorage.removeItem('ai_resume_search');
		try {
			var saved = JSON.parse(raw);
			if (!saved || !saved.params) return false;
			setMode(saved.mode === 'features' ? 'features' : 'subtitles');
			var p = saved.params;
			state.imdbKind = saved.imdbKind === 'parent_imdb_id' ? 'parent_imdb_id' : 'imdb_id';
			if (p.query) el('search-query').value = p.query;
			if (p.imdb_id || p.parent_imdb_id) {
				el('search-imdb').value = p.imdb_id || p.parent_imdb_id;
				el('search-advanced').hidden = false;
			}
			if (p.year) el('search-year').value = p.year;
			if (p.type) el('search-type').value = p.type;
			if (p.languages) {
				var codes = Array.from(el('search-language').options).map((o) => o.value);
				if (codes.includes(p.languages)) el('search-language').value = p.languages;
			}
			state.page = p.page || 1;
			await runSearch();
			if (AI.loggedIn()) replayPendingAction(saved.pending);
			return true;
		} catch (e) {
			return false;
		}
	}

	function replayPendingAction(pending) {
		if (!pending || !pending.fileId || !pending.action) return;
		var card = document.querySelector('.sub-card[data-file-id="' + CSS.escape(pending.fileId) + '"]');
		if (!card) return;
		card.scrollIntoView({ behavior: 'smooth', block: 'center' });
		var button = card.querySelector('button[data-action="' + pending.action + '"]');
		if (button) handleCardAction(card, pending.action, button);
	}

	bind();
	loadLanguages().then(() => {
		return resumeSearch().then((resumed) => {
			if (resumed) return;
			if (applyUrlState()) return;
			applyImdbPrefill();
		});
	});
})();

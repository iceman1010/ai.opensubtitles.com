(function () {
	const card = document.getElementById('subtitle-card');
	const fileId = card.dataset.fileId;
	const detail = document.getElementById('subtitle-detail');
	const loading = document.getElementById('subtitle-loading');
	const notFound = document.getElementById('subtitle-notfound');
	const errorBox = document.getElementById('subtitle-error');
	const i18n = Common.i18n('subtitle-i18n');
	const esc = Common.esc;
	const formatSize = Common.formatSize;
	const formatDate = Common.formatDate;
	const langName = Common.langName;
	const langBadge = Common.langBadge;
	const posterUrlFor = Common.posterUrlFor;
	const posterBox = Common.posterBox;
	const fetchSubtitleContent = Common.fetchSubtitleContent;
	const setButtonBusy = Common.setButtonBusy;
	const localePrefix = Common.localePrefix;

	async function loadLanguages() {
		try { await Common.loadLangNames(); } catch (e) {}
	}

	function requireLogin(action) {
		if (AI.loggedIn()) return true;
		sessionStorage.setItem('ai_subtitle_pending', action);
		sessionStorage.setItem('ai_redirect_after_login', location.pathname + location.search);
		location.href = localePrefix() + '/login';
		return false;
	}

	function subtitleFileName(item) {
		const file = (item.attributes && item.attributes.files && item.attributes.files[0]) || {};
		const name = file.file_name || 'subtitles.srt';
		return name.endsWith('.srt') ? name : name + '.srt';
	}

	async function handleAction(item, action, button) {
		if (!requireLogin(action)) return;
		const fileName = subtitleFileName(item);
		if (action === 'preview') {
			setButtonBusy(button, true, i18n.loading_preview);
			try {
				const content = await fetchSubtitleContent(fileId);
				PreviewModal.open(fileName, content, {
					download: i18n.download,
					close: i18n.close,
					font_smaller: i18n.font_smaller,
					font_larger: i18n.font_larger,
					find_placeholder: i18n.find_placeholder,
					find: i18n.find,
					cues: i18n.cues,
					prev_match: i18n.prev_match,
					next_match: i18n.next_match
				}, item.attributes.language);
			} catch (e) {
				Common.showError(errorBox, i18n.download_failed + ' ' + e.message);
			} finally {
				setButtonBusy(button, false);
			}
		} else if (action === 'download') {
			setButtonBusy(button, true, i18n.downloading);
			try {
				const content = await fetchSubtitleContent(fileId);
				AI.downloadText(content, fileName);
			} catch (e) {
				Common.showError(errorBox, i18n.download_failed + ' ' + e.message);
			} finally {
				setButtonBusy(button, false);
			}
		} else if (action === 'translate') {
			setButtonBusy(button, true, i18n.preparing);
			try {
				const content = await fetchSubtitleContent(fileId);
				sessionStorage.setItem('ai_newjob_pending', JSON.stringify({
					name: fileName,
					content: content,
					lang: (item.attributes && item.attributes.language) || ''
				}));
				location.href = localePrefix() + '/new';
			} catch (e) {
				if (e && e.name === 'QuotaExceededError') Common.showError(errorBox, i18n.stash_failed);
				else Common.showError(errorBox, i18n.download_failed + ' ' + e.message);
				setButtonBusy(button, false);
			}
		}
	}

	function render(item) {
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
		detail.innerHTML =
			poster +
			'<div class="feature-body">' +
			'<div class="sub-card-head">' +
				'<h2 dir="auto"><svg class="btn-icon" aria-hidden="true"><use href="' + typeIcon + '"/></svg> ' + esc(fd.title || a.release || '?') +
				(fd.year ? ' <span class="sub-year">(' + esc(fd.year) + ')</span>' : '') + '</h2>' +
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
			'</div>';
		detail.dataset.fileId = file.file_id || fileId;
		detail.dataset.fileName = file.file_name || '';
		detail.dataset.lang = a.language || '';
		document.title = (fd.title || a.release || i18n.release) +
			(fd.year ? ' (' + fd.year + ')' : '') +
			' · ' + langName(a.language) + ' subtitle · AI.Opensubtitles.com';
		detail.hidden = false;
	}

	async function loadMeta() {
		try {
			const data = await AI.searchSubtitles({ file_id: fileId });
			const items = (data && data.data) || [];
			if (!items.length) {
				notFound.hidden = false;
				return;
			}
			render(items[0]);
		} catch (e) {
			Common.showError(errorBox, i18n.error + ' ' + e.message);
		} finally {
			loading.hidden = true;
		}
	}

	function resumePending() {
		if (!AI.loggedIn()) return;
		const action = sessionStorage.getItem('ai_subtitle_pending');
		if (!action) return;
		sessionStorage.removeItem('ai_subtitle_pending');
		const button = detail.querySelector('button[data-action="' + action + '"]');
		if (button) handleAction(currentItem(), action, button);
	}

	function currentItem() {
		return {
			attributes: {
				language: detail.dataset.lang || '',
				files: [{ file_id: detail.dataset.fileId, file_name: detail.dataset.fileName }]
			}
		};
	}

	function bind() {
		detail.addEventListener('click', (e) => {
			const posterEl = e.target.closest('.feature-poster.has-img');
			if (posterEl && posterEl.dataset.poster) {
				document.getElementById('lightbox-img').src = posterEl.dataset.poster;
				document.getElementById('lightbox-img').alt = posterEl.dataset.title || '';
				document.getElementById('lightbox-overlay').hidden = false;
				document.getElementById('lightbox-overlay').focus();
				return;
			}
			const button = e.target.closest('button[data-action]');
			if (!button) return;
			handleAction(currentItem(), button.dataset.action, button);
		});
		detail.addEventListener('error', (e) => {
			const img = e.target;
			if (!img.classList || !img.classList.contains('feature-poster-img')) return;
			const box = img.parentElement;
			box.classList.remove('has-img');
			box.removeAttribute('data-poster');
			box.classList.add('poster-empty');
			box.innerHTML = '<svg class="btn-icon" aria-hidden="true"><use href="#icon-film"/></svg>';
		}, true);
		document.getElementById('lightbox-overlay').addEventListener('click', () => {
			document.getElementById('lightbox-overlay').hidden = true;
			document.getElementById('lightbox-img').src = '';
			document.getElementById('lightbox-img').alt = '';
		});
		document.addEventListener('keydown', (e) => {
			const overlay = document.getElementById('lightbox-overlay');
			if (e.key === 'Escape' && !overlay.hidden) {
				overlay.hidden = true;
				document.getElementById('lightbox-img').src = '';
				document.getElementById('lightbox-img').alt = '';
			}
		});
	}

	loadLanguages();
	bind();
	loadLanguages().then(loadMeta).then(resumePending);
})();

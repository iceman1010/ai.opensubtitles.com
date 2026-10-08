(function () {
	const MIN = 0.65;
	const MAX = 2;
	const STEP = 0.1;
	let fontSize = 0.85;
	let modal = null;
	let viewer = null;
	let currentContent = '';

	function el(tag, className, text) {
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
		const btn = el('button', classes);
		btn.type = 'button';
		btn.appendChild(icon(iconName));
		if (iconOnly) {
			btn.setAttribute('aria-label', label);
			btn.title = label;
		} else {
			btn.appendChild(el('span', 'btn-label', label));
		}
		return btn;
	}

	function applyFontSize() {
		modal.pre.style.fontSize = fontSize.toFixed(2) + 'rem';
		modal.view.style.fontSize = fontSize.toFixed(2) + 'rem';
		modal.smaller.disabled = fontSize <= MIN;
		modal.larger.disabled = fontSize >= MAX;
		if (viewer) viewer.remeasure();
	}

	function escListener(e) {
		if (e.key === 'Escape') PreviewModal.close();
	}

	function build(labels) {
		const overlay = el('div', 'modal-overlay');
		const card = el('div', 'modal-card');
		const head = el('div', 'modal-head');
		const title = el('h3', null, '');
		const font = el('div', 'modal-font');
		const smaller = iconBtn('btn btn-small btn-ghost media-icon-btn', labels.font_smaller, 'minus', true);
		const larger = iconBtn('btn btn-small btn-ghost media-icon-btn', labels.font_larger, 'plus', true);
		smaller.addEventListener('click', () => {
			fontSize = Math.max(MIN, fontSize - STEP);
			applyFontSize();
		});
		larger.addEventListener('click', () => {
			fontSize = Math.min(MAX, fontSize + STEP);
			applyFontSize();
		});
		font.appendChild(smaller);
		font.appendChild(icon('type'));
		font.appendChild(larger);
		head.appendChild(title);
		head.appendChild(font);

		const toolbar = el('div', 'pv-toolbar');
		const badge = el('span', 'pv-badge');
		const search = el('input', 'pv-search');
		search.type = 'search';
		search.autocomplete = 'off';
		search.dir = 'auto';
		const findBtn = iconBtn('btn btn-small btn-ghost media-icon-btn', 'Search', 'search', true);
		const prevBtn = iconBtn('btn btn-small btn-ghost media-icon-btn', 'Previous match', 'chevron-left', true);
		prevBtn.classList.add('pv-nav-btn', 'pv-off');
		const nextBtn = iconBtn('btn btn-small btn-ghost media-icon-btn', 'Next match', 'chevron-right', true);
		nextBtn.classList.add('pv-nav-btn', 'pv-off');
		const counter = el('span', 'pv-count pv-nav-btn pv-off');
		toolbar.appendChild(badge);
		toolbar.appendChild(search);
		toolbar.appendChild(findBtn);
		toolbar.appendChild(prevBtn);
		toolbar.appendChild(nextBtn);
		toolbar.appendChild(counter);
		let numericMode = false;
		function applyResult(r) {
			if (!r) return;
			prevBtn.disabled = !r.total || r.pos <= 1;
			nextBtn.disabled = !r.total || r.pos >= r.total;
			if (!r.total) counter.textContent = '0 / 0';
			else if (numericMode) counter.textContent = '#' + (r.index + 1);
			else counter.textContent = r.pos + ' / ' + r.total;
		}
		function revealNav() {
			prevBtn.classList.remove('pv-off');
			nextBtn.classList.remove('pv-off');
			counter.classList.remove('pv-off');
		}
		function doSearch() {
			if (!viewer) return;
			const q = search.value;
			if (!q.trim()) {
				counter.textContent = '';
				prevBtn.disabled = nextBtn.disabled = true;
				return;
			}
			revealNav();
			const r = viewer.searchAll(q);
			numericMode = r.numeric;
			applyResult(r);
		}
		search.addEventListener('keydown', (e) => {
			if (e.key !== 'Enter') return;
			e.preventDefault();
			doSearch();
		});
		search.addEventListener('focus', () => {
			search.value = '';
			counter.textContent = '';
			prevBtn.disabled = nextBtn.disabled = true;
			if (viewer) viewer.clearMatches();
		});
		findBtn.addEventListener('click', doSearch);
		prevBtn.addEventListener('click', () => applyResult(viewer.step(-1)));
		nextBtn.addEventListener('click', () => applyResult(viewer.step(1)));

		const pre = el('pre', 'modal-pre', '');
		pre.dir = 'auto';
		const view = el('div', 'pv-view');
		view.dir = 'auto';
		view.hidden = true;

		const actions = el('div', 'modal-actions');
		const download = iconBtn('btn btn-small btn-primary', labels.download, 'download');
		const close = iconBtn('btn btn-small btn-ghost', labels.close, 'x');
		download.addEventListener('click', () => window.AI.downloadText(currentContent, title.textContent || 'subtitles.srt'));
		close.addEventListener('click', PreviewModal.close);
		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) PreviewModal.close();
		});
		actions.appendChild(download);
		actions.appendChild(close);
		card.appendChild(head);
		card.appendChild(toolbar);
		card.appendChild(pre);
		card.appendChild(view);
		card.appendChild(actions);
		overlay.appendChild(card);
		document.body.appendChild(overlay);
		modal = { overlay, title, pre, view, toolbar, badge, search, find: findBtn, prev: prevBtn, next: nextBtn, counter, smaller, larger, labels: {} };
		applyFontSize();
	}

	function parseCues(content) {
		if (!window.Subsrt || !content) return null;
		try {
			const format = window.Subsrt.detect(content);
			if (!format) return null;
			const parsed = window.Subsrt.parse(content, { format: format });
			const cues = [];
			for (const c of parsed) {
				if (c && c.type === 'caption' && isFinite(c.start) && isFinite(c.end)) cues.push(c);
			}
			return cues.length ? { format: String(format).toUpperCase(), cues: cues } : null;
		} catch (e) {
			return null;
		}
	}

	const RTL_LANGS = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb', 'nqo'];
	function dirFor(lang) {
		const l = String(lang || '').toLowerCase();
		if (!l) return 'auto';
		return RTL_LANGS.indexOf(l) !== -1 ? 'rtl' : 'ltr';
	}

	const PreviewModal = {
		open(fileName, content, labels, lang) {
			const L = labels || {};
			if (!modal) build({
				download: L.download || 'Download',
				close: L.close || 'Close',
				font_smaller: L.font_smaller || 'Smaller text',
				font_larger: L.font_larger || 'Larger text'
			});
			const dir = dirFor(lang);
			modal.pre.dir = dir;
			modal.view.dir = dir;
			modal.labels = L;
			modal.search.placeholder = L.find_placeholder || 'Find text or cue number…';
			modal.find.setAttribute('aria-label', L.find || 'Search');
			modal.find.title = L.find || 'Search';
			modal.prev.setAttribute('aria-label', L.prev_match || 'Previous match');
			modal.prev.title = L.prev_match || 'Previous match';
			modal.next.setAttribute('aria-label', L.next_match || 'Next match');
			modal.next.title = L.next_match || 'Next match';
			modal.search.value = '';
			modal.counter.textContent = '';
			modal.prev.disabled = modal.next.disabled = true;
			currentContent = String(content || '');
			modal.title.textContent = fileName;
			modal.title.dir = 'auto';
			if (viewer) {
				viewer.destroy();
				viewer = null;
			}
			const parsed = parseCues(currentContent);
			if (parsed) {
				modal.pre.hidden = true;
				modal.toolbar.hidden = false;
				modal.view.hidden = false;
				let minStart = Infinity;
				let maxEnd = 0;
				for (const c of parsed.cues) {
					if (c.start < minStart) minStart = c.start;
					if (c.end > maxEnd) maxEnd = c.end;
				}
				const dur = maxEnd > minStart ? ' \u00b7 ' + window.SubtitleViewer.fmtTime(maxEnd - minStart) : '';
				modal.badge.textContent = parsed.format + ' \u00b7 ' + parsed.cues.length.toLocaleString() + ' ' + (L.cues || 'cues') + dur;
				modal.overlay.hidden = false;
				applyFontSize();
				viewer = window.SubtitleViewer.create(modal.view, parsed.cues);
			} else {
				modal.toolbar.hidden = true;
				modal.view.hidden = true;
				modal.pre.hidden = false;
				modal.pre.textContent = currentContent;
				modal.overlay.hidden = false;
				applyFontSize();
			}
			document.addEventListener('keydown', escListener);
		},
		close() {
			if (!modal) return;
			modal.overlay.hidden = true;
			if (viewer) {
				viewer.destroy();
				viewer = null;
			}
			document.removeEventListener('keydown', escListener);
		}
	};

	window.PreviewModal = PreviewModal;
})();
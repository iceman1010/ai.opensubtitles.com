(function () {
	if (!window.AI.requireAuth()) return;

	const SUBTITLE_EXT = /\.(srt|vtt|ass|ssa)$/i;
	const T = window.DASH_I18N || {};
	const CHUNK = 10;
	const API_PAGE = 20;

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

	function iconBtn(classes, label, iconName) {
		const btn = el('button', classes);
		btn.type = 'button';
		btn.appendChild(icon(iconName));
		btn.appendChild(el('span', 'btn-label', label));
		return btn;
	}

	async function loadCredits() {
		const el = document.getElementById('credits-value');
		if (!el) return;
		try {
			const result = await window.AI.getCredits();
			el.textContent = String(result.credits);
		} catch (e) {
			el.textContent = '–';
		}
	}

	async function loadActivities() {
		const container = document.getElementById('recent-activities');
		if (!container) return;
		pagedList(container, {
			fetch: (page) => window.AI.recentActivities(page),
			empty: T.activities_none || 'Nothing here yet.',
			error: T.activities_error || 'Could not load activities.',
			more: T.show_more,
			buildContainer: () => el('div', 'media-list'),
			row: activityRow
		});
	}

	function typeIconName(typeName) {
		if (typeName === 'translation') return 'languages';
		if (typeName === 'transcription') return 'mic';
		return 'tag';
	}

	function timeBlock(className, timeStr) {
		const box = el('span', className, '');
		box.title = timeStr || '';
		const s = timeStr || '';
		const i = s.indexOf(' ');
		for (const line of (i < 0 ? [s] : [s.slice(0, i), s.slice(i + 1)])) box.appendChild(el('span', null, line));
		return box;
	}

	function activityRow(item) {
		const row = el('div', 'media-item act-row');
		const type = el('span', 'act-type');
		type.appendChild(icon(typeIconName(item.type_name)));
		type.appendChild(el('span', null, item.type_name));
		row.appendChild(type);
		row.appendChild(el('span', 'act-credits', String(item.credits)));
		row.appendChild(timeBlock('media-time', item.time_str));
		return row;
	}

	async function loadMedia() {
		const container = document.getElementById('recent-media');
		if (!container) return;
		pagedList(container, {
			fetch: (page) => window.AI.recentMedia(page),
			empty: T.media_none || 'Nothing here yet.',
			error: T.media_error || 'Could not load recent media.',
			more: T.show_more,
			buildContainer: () => el('div', 'media-list'),
			row: (item) => renderMediaItem(item)
		});
	}

	function renderRows(container, rows) {
		if (!rows.length) {
			container.textContent = T.activities_none || 'Nothing here yet.';
			return;
		}
		const table = document.createElement('table');
		table.className = 'data-table';
		for (const row of rows) {
			const tr = document.createElement('tr');
			for (const cell of [row.col1, row.col2, row.col3]) {
				const td = document.createElement('td');
				td.textContent = cell;
				tr.appendChild(td);
			}
			table.appendChild(tr);
		}
		container.innerHTML = '';
		container.appendChild(table);
	}

	function pagedList(container, opts) {
		let page = 1;
		let buffer = [];
		let rendered = 0;
		let done = false;

		const list = opts.buildContainer();
		const moreBtn = el('button', 'btn btn-ghost btn-block-show', opts.more || 'Show more');
		moreBtn.type = 'button';
		moreBtn.addEventListener('click', loadMore);

		async function fillBuffer() {
			while (buffer.length < CHUNK && !done) {
				const items = await opts.fetch(page++);
				buffer = buffer.concat(items);
				if (!items.length || items.length < API_PAGE) done = true;
			}
		}

		async function loadMore() {
			moreBtn.disabled = true;
			try {
				await fillBuffer();
				append();
			} catch (e) {
				container.querySelectorAll('.form-error').forEach((n) => n.remove());
				const box = el('p', 'form-error', T.more_error || 'Could not load more.');
				container.prepend(box);
				setTimeout(() => box.remove(), 6000);
			} finally {
				moreBtn.disabled = false;
			}
		}

		function append() {
			if (!rendered && !buffer.length) {
				container.innerHTML = '';
				container.appendChild(el('p', 'empty', opts.empty));
				return;
			}
			if (rendered === 0) {
				container.innerHTML = '';
				container.appendChild(list);
				container.appendChild(moreBtn);
			}
			const take = buffer.splice(0, CHUNK);
			for (const item of take) list.appendChild(opts.row(item));
			rendered += take.length;
			if (done && !buffer.length) moreBtn.hidden = true;
		}

		fillBuffer().then(() => {
			append();
			if (rendered === 0) moreBtn.hidden = true;
		}).catch(() => {
			container.innerHTML = '';
			container.appendChild(el('p', 'form-error', opts.error));
		});
	}

	function renderMediaItem(item) {
		const details = el('details', 'media-item');
		const summary = el('summary', 'media-summary');
		summary.appendChild(el('span', 'media-id', '#' + item.id));
		const files = item.files || [];
		if (files.length) summary.appendChild(el('span', 'media-file-name', files[0]));
		if (files.length > 1) summary.appendChild(el('span', 'media-count', '+' + (files.length - 1)));
		summary.appendChild(timeBlock('media-time', item.time_str));
		details.appendChild(summary);

		const filesBox = el('div', 'media-files');
		for (const fileName of files) {
			filesBox.appendChild(renderFileRow(item.id, fileName));
		}
		details.appendChild(filesBox);
		return details;
	}

	function renderFileRow(mediaId, fileName) {
		const row = el('div', 'media-file');
		row.appendChild(el('span', 'file-name', fileName));

		if (SUBTITLE_EXT.test(fileName)) {
			const previewBtn = iconBtn('btn btn-small', T.preview || 'Preview', 'eye');
			previewBtn.addEventListener('click', () => previewMedia(mediaId, fileName, previewBtn));
			row.appendChild(previewBtn);
		}

		const dlBtn = iconBtn('btn btn-small', T.download || 'Download', 'download');
		dlBtn.addEventListener('click', () => downloadMedia(mediaId, fileName, dlBtn));
		row.appendChild(dlBtn);
		return row;
	}

	async function downloadMedia(mediaId, fileName, btn) {
		btn.disabled = true;
		try {
			const content = await window.AI.mediaFileText(mediaId, fileName);
			window.AI.downloadText(content, fileName);
		} catch (e) {
			if (!e.auth) showMediaError((T.download_failed || 'Download failed') + ': ' + e.message);
		} finally {
			btn.disabled = false;
		}
	}

	async function previewMedia(mediaId, fileName, btn) {
		btn.disabled = true;
		try {
			const content = await window.AI.mediaFileText(mediaId, fileName);
			openPreview(fileName, content);
		} catch (e) {
			if (!e.auth) showMediaError((T.preview_failed || 'Preview failed') + ': ' + e.message);
		} finally {
			btn.disabled = false;
		}
	}

	let previewModal;
	function openPreview(fileName, content) {
		if (!previewModal) previewModal = buildPreviewModal();
		previewModal.title.textContent = fileName;
		previewModal.pre.textContent = content;
		previewModal.download.onclick = () => window.AI.downloadText(content, fileName);
		previewModal.overlay.hidden = false;
		document.addEventListener('keydown', escListener);
	}

	function closePreview() {
		if (!previewModal) return;
		previewModal.overlay.hidden = true;
		document.removeEventListener('keydown', escListener);
	}

	function escListener(e) {
		if (e.key === 'Escape') closePreview();
	}

	function buildPreviewModal() {
		const overlay = el('div', 'modal-overlay');
		const card = el('div', 'modal-card');
		const title = el('h3', null, '');
		const pre = el('pre', 'modal-pre', '');
		const actions = el('div', 'modal-actions');
		const download = iconBtn('btn btn-small btn-primary', T.download || 'Download', 'download');
		const close = iconBtn('btn btn-small btn-ghost', T.close || 'Close', 'x');
		close.addEventListener('click', closePreview);
		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) closePreview();
		});
		actions.appendChild(download);
		actions.appendChild(close);
		card.appendChild(title);
		card.appendChild(pre);
		card.appendChild(actions);
		overlay.appendChild(card);
		document.body.appendChild(overlay);
		return { overlay, title, pre, download };
	}

	function showMediaError(message) {
		const container = document.getElementById('recent-media');
		if (!container) return;
		container.querySelectorAll('.form-error').forEach((n) => n.remove());
		const box = el('p', 'form-error', message);
		container.prepend(box);
		setTimeout(() => box.remove(), 6000);
	}

	async function loadPayments() {
		const container = document.getElementById('payment-history');
		if (!container) return;
		pagedList(container, {
			fetch: (page) => window.AI.paymentHistory(page),
			empty: T.payments_none || 'No payments recorded yet.',
			error: T.payments_error || 'Could not load payment history.',
			more: T.show_more,
			buildContainer: () => el('div', 'media-list'),
			row: paymentRow
		});
	}

	function paymentRow(item) {
		const row = el('div', 'media-item act-row');
		row.appendChild(timeBlock('pay-date', item.date));
		row.appendChild(el('span', 'pay-usd', '$' + item.usd));
		row.appendChild(el('span', 'pay-credits', '+' + item.credits));
		return row;
	}

	loadCredits();
	loadActivities();
	loadMedia();
	loadPayments();
})();

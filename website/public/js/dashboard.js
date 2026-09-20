(function () {
	if (!window.AI.requireAuth()) return;

	const SUBTITLE_EXT = /\.(srt|vtt|ass|ssa)$/i;
	const T = window.DASH_I18N || {};

	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	async function loadCredits() {
		const el = document.getElementById('credits-value');
		if (!el) return;
		try {
			const result = await window.AI.getCredits();
			el.textContent = result.credits.toFixed(2);
		} catch (e) {
			el.textContent = '–';
		}
	}

	async function loadActivities() {
		const container = document.getElementById('recent-activities');
		if (!container) return;
		try {
			const items = await window.AI.recentActivities(1);
			renderRows(container, items.map((item) => ({
				id: item.id,
				col1: item.time_str,
				col2: item.type_name,
				col3: item.credits
			})));
		} catch (e) {
			container.textContent = T.activities_error || 'Could not load activities.';
		}
	}

	async function loadMedia() {
		const container = document.getElementById('recent-media');
		if (!container) return;
		try {
			const items = await window.AI.recentMedia(1);
			renderMedia(container, items);
		} catch (e) {
			container.textContent = T.media_error || 'Could not load recent media.';
		}
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

	function renderMedia(container, items) {
		container.innerHTML = '';
		if (!items.length) {
			container.appendChild(el('p', 'empty', T.media_none || 'Nothing here yet.'));
			return;
		}
		const list = el('div', 'media-list');
		for (const item of items) list.appendChild(renderMediaItem(item));
		container.appendChild(list);
	}

	function renderMediaItem(item) {
		const details = el('details', 'media-item');
		const summary = el('summary', 'media-summary');
		summary.appendChild(el('span', 'media-id', '#' + item.id));
		summary.appendChild(el('span', 'media-time', item.time_str || ''));
		const count = item.files ? item.files.length : 0;
		summary.appendChild(el('span', 'media-count', count + ' ' + (T.files || 'file(s)')));
		details.appendChild(summary);

		const files = el('div', 'media-files');
		for (const fileName of item.files || []) {
			files.appendChild(renderFileRow(item.id, fileName));
		}
		details.appendChild(files);
		return details;
	}

	function renderFileRow(mediaId, fileName) {
		const row = el('div', 'media-file');
		row.appendChild(el('span', 'file-name', fileName));

		if (SUBTITLE_EXT.test(fileName)) {
			const previewBtn = el('button', 'btn btn-small', T.preview || 'Preview');
			previewBtn.type = 'button';
			previewBtn.addEventListener('click', () => previewMedia(mediaId, fileName, previewBtn));
			row.appendChild(previewBtn);
		}

		const dlBtn = el('button', 'btn btn-small', T.download || 'Download');
		dlBtn.type = 'button';
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
		const download = el('button', 'btn btn-small btn-primary', T.download || 'Download');
		download.type = 'button';
		const close = el('button', 'btn btn-small btn-ghost', T.close || 'Close');
		close.type = 'button';
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

	loadCredits();
	loadActivities();
	loadMedia();
})();

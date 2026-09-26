(function () {
	const MIN = 0.65;
	const MAX = 2;
	const STEP = 0.1;
	let fontSize = 0.85;
	let modal = null;

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
		modal.smaller.disabled = fontSize <= MIN;
		modal.larger.disabled = fontSize >= MAX;
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
		const pre = el('pre', 'modal-pre', '');
		const actions = el('div', 'modal-actions');
		const download = iconBtn('btn btn-small btn-primary', labels.download, 'download');
		const close = iconBtn('btn btn-small btn-ghost', labels.close, 'x');
		download.addEventListener('click', () => window.AI.downloadText(pre.textContent, title.textContent || 'subtitles.srt'));
		close.addEventListener('click', PreviewModal.close);
		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) PreviewModal.close();
		});
		actions.appendChild(download);
		actions.appendChild(close);
		card.appendChild(head);
		card.appendChild(pre);
		card.appendChild(actions);
		overlay.appendChild(card);
		document.body.appendChild(overlay);
		modal = { overlay, title, pre, smaller, larger };
		applyFontSize();
	}

	const PreviewModal = {
		open(fileName, content, labels) {
			const L = labels || {};
			if (!modal) build({
				download: L.download || 'Download',
				close: L.close || 'Close',
				font_smaller: L.font_smaller || 'Smaller text',
				font_larger: L.font_larger || 'Larger text'
			});
			modal.title.textContent = fileName;
			modal.pre.textContent = content;
			modal.overlay.hidden = false;
			document.addEventListener('keydown', escListener);
		},
		close() {
			if (!modal) return;
			modal.overlay.hidden = true;
			document.removeEventListener('keydown', escListener);
		}
	};

	window.PreviewModal = PreviewModal;
})();

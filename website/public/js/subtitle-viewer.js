(function () {
	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function pad(n, w) {
		return String(n).padStart(w, '0');
	}

	function fmtTime(ms) {
		const t = Math.max(0, Math.round(Number(ms) || 0));
		return pad(Math.floor(t / 3600000), 2) + ':' + pad(Math.floor(t / 60000) % 60, 2) + ':' + pad(Math.floor(t / 1000) % 60, 2) + '.' + pad(t % 1000, 3);
	}

	function cleanText(raw) {
		return String(raw || '')
			.replace(/\{\\[^}]*\}/g, '')
			.replace(/<[^>]*>/g, '')
			.replace(/\\[Nn]/g, '\n')
			.replace(/\r/g, '')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}

	function create(container, cues) {
		const rows = cues.map((c) => ({ start: c.start, end: c.end, display: cleanText(c.text || c.content) }));
		const space = el('div', 'pv-space');
		const win = el('div', 'pv-window');
		space.appendChild(win);
		container.textContent = '';
		container.appendChild(space);

		let rowH = 100;
		let lastHit = -1;
		let matchList = [];
		let matchPos = -1;
		let matchFlags = null;
		let raf = 0;

		function estimate() {
			const fpx = fontPx();
			const width = container.clientWidth || 600;
			const charsPerLine = Math.max(20, Math.floor((width - 48) / (fpx * 0.6)));
			const lineH = Math.round(fpx * 1.57);
			const metaH = Math.round(fpx * 0.95) + 8;
			let max = 0;
			for (let i = 0; i < rows.length; i++) {
				const lines = rows[i].display.split('\n').reduce((a, ln) => a + Math.max(1, Math.ceil(ln.length / charsPerLine)), 0);
				max = Math.max(max, metaH + lines * lineH + 12);
			}
			rowH = Math.max(max, Math.round(fpx * 3));
			space.style.height = rows.length * rowH + 'px';
		}

		function fontPx() {
			return parseFloat(getComputedStyle(container).fontSize) || 14;
		}

		function buildRow(i) {
			const row = el('div', 'pv-row');
			if (i % 2 === 1) row.classList.add('pv-alt');
			if (matchFlags && matchFlags[i]) row.classList.add('pv-match');
			if (i === lastHit) row.classList.add('pv-hit');
			row.style.height = rowH + 'px';
			const inner = el('div', 'pv-inner');
			inner.appendChild(el('span', 'pv-num', String(i + 1)));
		const body = el('div', 'pv-body');
		const meta = el('div', 'pv-meta');
		meta.dir = 'ltr';
		meta.appendChild(el('span', 'pv-time', fmtTime(rows[i].start)));
		meta.appendChild(el('span', 'pv-arrow', '\u2192'));
		meta.appendChild(el('span', 'pv-time', fmtTime(rows[i].end)));
		meta.appendChild(el('span', 'pv-dur', '+' + (Math.max(0, rows[i].end - rows[i].start) / 1000).toFixed(1) + 's'));
		body.appendChild(meta);
		const text = el('div', 'pv-text', rows[i].display);
		text.dir = 'auto';
		body.appendChild(text);
			inner.appendChild(body);
			row.appendChild(inner);
			return row;
		}

		function render() {
			raf = 0;
			if (!rows.length) return;
			const top = container.scrollTop;
			const bottom = top + container.clientHeight;
			const buf = 4;
			const i0 = Math.max(0, Math.floor(top / rowH) - buf);
			const i1 = Math.min(rows.length - 1, Math.floor(bottom / rowH) + buf);
			win.style.transform = 'translateY(' + i0 * rowH + 'px)';
			win.textContent = '';
			const frag = document.createDocumentFragment();
			for (let i = i0; i <= i1; i++) frag.appendChild(buildRow(i));
			win.appendChild(frag);
			const nodes = win.children;
			const oldH = rowH;
			for (let k = 0; k < nodes.length; k++) {
				const actual = nodes[k].firstChild.offsetHeight;
				if (actual > rowH) rowH = actual;
			}
			if (rowH !== oldH) {
				space.style.height = rows.length * rowH + 'px';
				container.scrollTop += i0 * (rowH - oldH);
				schedule();
			}
		}

		function schedule() {
			if (!raf) raf = requestAnimationFrame(render);
		}

		function scrollToRow(i) {
			container.scrollTop = Math.max(0, i * rowH - 12);
			schedule();
		}

		function searchAll(q) {
			matchList = [];
			matchPos = -1;
			matchFlags = rows.length ? new Uint8Array(rows.length) : null;
			lastHit = -1;
			const query = String(q || '').trim();
			if (!query || !rows.length) return { numeric: false, pos: 0, total: 0, index: -1 };
			let numeric = false;
			if (/^\d+$/.test(query)) {
				const n = parseInt(query, 10);
				if (n >= 1 && n <= rows.length) {
					numeric = true;
					matchList = [n - 1];
					matchFlags[n - 1] = 1;
					matchPos = 0;
					lastHit = n - 1;
					scrollToRow(n - 1);
				}
			} else {
				const needle = query.toLowerCase();
				for (let i = 0; i < rows.length; i++) {
					if (rows[i].display.toLowerCase().indexOf(needle) !== -1) matchList.push(i);
				}
				for (let k = 0; k < matchList.length; k++) matchFlags[matchList[k]] = 1;
				if (matchList.length) {
					matchPos = 0;
					lastHit = matchList[0];
					scrollToRow(lastHit);
				}
			}
			return { numeric: numeric, pos: matchList.length ? 1 : 0, total: matchList.length, index: lastHit };
		}

		function step(dir) {
			if (!matchList.length) return null;
			const nextPos = matchPos + dir;
			if (nextPos < 0 || nextPos >= matchList.length) return null;
			matchPos = nextPos;
			lastHit = matchList[matchPos];
			scrollToRow(lastHit);
			return { pos: matchPos + 1, total: matchList.length, index: lastHit };
		}

		function clearMatches() {
			matchList = [];
			matchPos = -1;
			matchFlags = null;
			lastHit = -1;
			schedule();
		}

		function remeasure() {
			estimate();
			schedule();
		}

		container.addEventListener('scroll', schedule, { passive: true });
		estimate();
		render();

		return {
			searchAll,
			step,
			clearMatches,
			remeasure,
			destroy() {
				container.removeEventListener('scroll', schedule);
				if (raf) cancelAnimationFrame(raf);
				container.textContent = '';
				rows.length = 0;
			}
		};
	}

	window.SubtitleViewer = { create, cleanText, fmtTime };
})();

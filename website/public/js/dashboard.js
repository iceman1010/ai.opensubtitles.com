(function () {
	if (!window.AI.requireAuth()) return;

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
			container.textContent = 'Could not load activities.';
		}
	}

	async function loadMedia() {
		const container = document.getElementById('recent-media');
		if (!container) return;
		try {
			const items = await window.AI.recentMedia(1);
			renderRows(container, items.map((item) => ({
				id: item.id,
				col1: item.time_str,
				col2: (item.files && item.files.length ? item.files.length : 0) + ' file(s)',
				col3: ''
			})));
		} catch (e) {
			container.textContent = 'Could not load recent media.';
		}
	}

	function renderRows(container, rows) {
		if (!rows.length) {
			container.textContent = 'Nothing here yet.';
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

	loadCredits();
	loadActivities();
	loadMedia();
})();

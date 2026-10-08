(function () {
	if (!window.AI.requireAuth()) return;

	const root = document.getElementById('job-status-card');
	if (!root) return;

	const kind = root.dataset.jobType;
	const jobId = root.dataset.jobId;

	const stateEl = document.getElementById('job-state');
	const detailEl = document.getElementById('job-detail');
	const downloadButton = document.getElementById('job-download');
	const errorEl = document.getElementById('job-errors');
	const qualityEl = document.getElementById('job-quality');
	const readabilityCard = document.getElementById('readability-card');
	const readabilityStats = document.getElementById('readability-stats');
	const readabilityLimits = document.getElementById('readability-limits');
	const readabilitySummary = document.getElementById('readability-summary');
	const readabilityProblems = document.getElementById('readability-problems');

	const POLL_START = 3000;
	const POLL_MAX = 30000;
	const POLL_TIMEOUT = 20 * 60 * 1000;
	const MAX_PROBLEMS_SHOWN = 25;
	const started = Date.now();

	async function poll() {
		let response;
		try {
			response = await window.AI.status(kind, jobId);
		} catch (e) {
			if (e.auth) return;
			stateEl.textContent = 'Connection problem — retrying…';
			return schedule(POLL_MAX);
		}

		if (response.status === 'COMPLETED' && response.data) {
			renderComplete(response.data);
			return;
		}

		if (response.status === 'ERROR' || response.status === 'TIMEOUT') {
			stateEl.textContent = response.status === 'TIMEOUT' ? 'Timed out' : 'Failed';
			errorEl.hidden = false;
			errorEl.textContent = (response.errors && response.errors.join(', ')) || 'The job failed.';
			return;
		}

		if (Date.now() - started > POLL_TIMEOUT) {
			stateEl.textContent = 'Still processing — this page no longer updates automatically. Reload to check again.';
			return;
		}

		stateEl.textContent = 'Processing…';
		schedule(POLL_START);
	}

	let currentDelay = POLL_START;
	function schedule(delay) {
		currentDelay = Math.min(Math.max(delay, currentDelay * 1.2), POLL_MAX);
		setTimeout(poll, currentDelay);
	}

	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function fmt(n) {
		return typeof n === 'number' ? Number.isInteger(n) ? String(n) : n.toFixed(1) : '–';
	}

	function timecode(seconds) {
		if (typeof seconds !== 'number') return '–';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		const mm = String(m).padStart(2, '0');
		const ss = String(s).padStart(2, '0');
		return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
	}

	function renderComplete(data) {
		stateEl.textContent = 'Completed';
		detailEl.hidden = false;

		const nameEl = document.getElementById('job-file');
		const priceEl = document.getElementById('job-price');
		const leftEl = document.getElementById('job-credits-left');
		if (nameEl) nameEl.textContent = data.file_name || '';
		if (priceEl) priceEl.textContent = data.total_price !== undefined ? data.total_price : '–';
		if (leftEl) leftEl.textContent = data.credits_left !== undefined ? data.credits_left : '–';

		if (data.quality) {
			qualityEl.hidden = false;
			const passed = data.quality.valid === true;
			qualityEl.textContent = passed
				? JOB_I18N.quality_pass
				: JOB_I18N.quality_fail.replace('{n}', String(data.quality_refund || 0));
			qualityEl.classList.add(passed ? 'quality-pass' : 'quality-fail');
		}

		if (data.readability) renderReadability(data.readability);

		downloadButton.hidden = false;
		downloadButton.addEventListener('click', async () => {
			downloadButton.disabled = true;
			try {
				await window.AI.downloadFile(data.url, data.file_name);
			} catch (e) {
				qualityEl.hidden = false;
				qualityEl.textContent = 'Download failed: ' + e.message;
			}
			downloadButton.disabled = false;
		});
	}

	function renderReadability(r) {
		readabilityCard.hidden = false;
		readabilityStats.innerHTML = '';
		readabilitySummary.innerHTML = '';
		readabilityProblems.innerHTML = '';

		const t = r.thresholds || {};
		const maxCpsOver = typeof r.max_cps === 'number' && typeof t.max_cps === 'number' && r.max_cps > t.max_cps;
		const maxCplOver = typeof r.max_cpl === 'number' && typeof t.max_cpl === 'number' && r.max_cpl > t.max_cpl;

		const stats = [
			[JOB_I18N.captions, fmt(r.captions), false],
			[JOB_I18N.analyzed, fmt(r.analyzed), false],
			[JOB_I18N.avg_speed, fmt(r.avg_cps) + ' cps', false],
			[JOB_I18N.max_speed, fmt(r.max_cps) + ' cps', maxCpsOver],
			[JOB_I18N.longest_line, fmt(r.max_cpl) + ' chars', maxCplOver]
		];
		for (const [label, value, over] of stats) {
			const chip = el('div', 'stat-chip' + (over ? ' over-limit' : ''));
			chip.appendChild(el('span', 'stat-label', label));
			chip.appendChild(el('span', 'stat-value', value));
			readabilityStats.appendChild(chip);
		}

		readabilityLimits.textContent = JOB_I18N.limits + ': ' +
			fmt(t.max_cps) + ' cps · ' + fmt(t.max_cpl) + ' ' + JOB_I18N.chars_line + ' · ' +
			fmt(t.max_lines) + ' ' + JOB_I18N.lines;

		const byType = r.problems_by_type || {};
		const typeEntries = Object.entries(byType).filter(([, count]) => count > 0);
		const total = typeEntries.reduce((sum, [, count]) => sum + count, 0);

		if (total === 0) {
			readabilitySummary.appendChild(el('p', 'quality-pass', JOB_I18N.no_problems));
			return;
		}

		readabilitySummary.appendChild(el('p', 'read-issues-line',
			total + ' ' + JOB_I18N.issues_total));

		for (const [type, count] of typeEntries) {
			readabilitySummary.appendChild(el('span', 'issue-chip',
				(JOB_I18N[type] || type) + ': ' + count));
		}

		const problems = r.problems || [];
		problems.slice(0, MAX_PROBLEMS_SHOWN).forEach((p) => {
			readabilityProblems.appendChild(renderProblem(p));
		});
		if (problems.length > MAX_PROBLEMS_SHOWN) {
			readabilityProblems.appendChild(el('p', 'muted',
				'+' + (problems.length - MAX_PROBLEMS_SHOWN) + ' ' + JOB_I18N.more_not_shown));
		}
	}

	function renderProblem(p) {
		const row = el('div', 'read-problem ' + (p.severity === 'critical' ? 'sev-critical' : 'sev-minor'));
		const meta = el('div', 'read-meta');

		meta.appendChild(el('strong', null, '#' + p.caption));
		meta.appendChild(el('span', 'sev-badge ' + (p.severity === 'critical' ? 'sev-critical' : 'sev-minor'), p.severity));
		const rt = el('span', 'read-time', timecode(p.start_seconds) + ' → ' + timecode(p.end_seconds));
		rt.dir = 'ltr';
		meta.appendChild(rt);
		if (typeof p.duration_seconds === 'number') meta.appendChild(el('span', null, fmt(p.duration_seconds) + 's'));
		if (typeof p.chars === 'number') meta.appendChild(el('span', null, p.chars + ' ' + JOB_I18N.chars));
		if (typeof p.cps === 'number') meta.appendChild(el('span', null, fmt(p.cps) + ' cps'));

		row.appendChild(meta);

		if (p.text) {
			const rt = el('div', 'read-text', p.text);
			rt.dir = 'auto';
			row.appendChild(rt);
		}

		const issues = el('div', 'read-issues');
		for (const issue of p.issues || []) {
			const unit = issue.type === 'reading_speed' ? ' cps' : '';
			issues.appendChild(el('span', 'issue-chip sev-' + (issue.severity === 'critical' ? 'critical' : 'minor'),
				(JOB_I18N[issue.type] || issue.type) + ': ' + fmt(issue.value) + unit +
				' (' + JOB_I18N.limit + ' ' + fmt(issue.limit) + unit + ')'));
		}
		if (issues.childNodes.length) row.appendChild(issues);

		return row;
	}

	window.AI.renderReadability = renderReadability;

	poll();
})();

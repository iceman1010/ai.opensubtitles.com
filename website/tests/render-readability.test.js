'use strict';

const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { runInThisContext } = require('node:vm');
const path = require('node:path');

const JOB_I18N = {
	captions: 'Captions',
	analyzed: 'Analyzed',
	avg_speed: 'Avg. speed',
	max_speed: 'Max. speed',
	longest_line: 'Longest line',
	limits: 'Limits',
	chars_line: 'chars/line',
	lines: 'lines',
	chars: 'chars',
	no_problems: 'No readability issues — this subtitle is comfortable to read.',
	issues_total: 'readability issue(s) found:',
	more_not_shown: 'more not shown',
	limit: 'limit',
	reading_speed: 'Reading speed',
	line_length: 'Line length',
	line_count: 'Line count',
};

function makeElement(tag) {
	const node = {
		tagName: tag,
		className: '',
		textContent: '',
		hidden: false,
		dataset: {},
		children: [],
		get childNodes() { return this.children; },
		appendChild(child) { this.children.push(child); return child; },
		classList: {
			add() {},
			remove() {},
		},
		addEventListener() {},
	};
	Object.defineProperty(node, 'innerHTML', {
		set() { node.children.length = 0; },
		get() { return ''; },
	});
	return node;
}

function makeDocument() {
	const registry = {};
	const byId = (id) => {
		if (!registry[id]) registry[id] = makeElement('div');
		return registry[id];
	};
	byId('job-status-card').dataset = { jobType: 'translate', jobId: 'test' };
	return {
		getElementById: byId,
		createElement: (tag) => makeElement(tag),
		_addEventListener() {},
	};
}

function loadJobJs() {
	globalThis.window = {
		AI: {
			requireAuth: () => true,
			status: () => new Promise(() => {}),
			downloadFile: async () => {},
		},
	};
	globalThis.document = makeDocument();
	globalThis.JOB_I18N = JOB_I18N;
	const realSetTimeout = globalThis.setTimeout;
	globalThis.setTimeout = () => 0;
	const src = readFileSync(path.join(__dirname, '..', 'public', 'js', 'job.js'), 'utf8');
	runInThisContext(src, { filename: 'job.js' });
	globalThis.setTimeout = realSetTimeout;
	return {
		card: globalThis.document.getElementById('readability-card'),
		stats: globalThis.document.getElementById('readability-stats'),
		limits: globalThis.document.getElementById('readability-limits'),
		summary: globalThis.document.getElementById('readability-summary'),
		problems: globalThis.document.getElementById('readability-problems'),
		render: globalThis.window.AI.renderReadability,
	};
}

const realPayload = {
	captions: 2,
	analyzed: 2,
	avg_cps: 13.8,
	max_cps: 15.2,
	max_cpl: 38,
	thresholds: { max_cps: 20, max_cpl: 42, max_lines: 2 },
	problems: [],
	problems_by_type: {},
};

const problemsPayload = {
	captions: 900,
	analyzed: 890,
	avg_cps: 17.1,
	max_cps: 30.5,
	max_cpl: 50,
	thresholds: { max_cps: 20, max_cpl: 42, max_lines: 2 },
	problems: [
		{
			caption: 12,
			severity: 'critical',
			start_seconds: 83.2,
			end_seconds: 85.1,
			duration_seconds: 1.9,
			chars: 58,
			cps: 30.5,
			text: 'Get me the report before the meeting starts, and make sure nobody sees it.',
			issues: [{ type: 'reading_speed', severity: 'critical', value: 30.5, limit: 20 }],
		},
		{
			caption: 13,
			severity: 'minor',
			start_seconds: 3675,
			end_seconds: 3680,
			chars: 50,
			cps: 21.4,
			text: 'A line that runs a little too long for comfortable reading.',
			issues: [{ type: 'line_length', severity: 'minor', value: 50, limit: 42 }],
		},
	],
	problems_by_type: { reading_speed: 1, line_length: 1 },
};

const ctx = loadJobJs();
assert.strictEqual(typeof ctx.render, 'function', 'window.AI.renderReadability exposed');

ctx.render(realPayload);
assert.strictEqual(ctx.card.hidden, false, 'card shown');
assert.strictEqual(ctx.stats.children.length, 5, 'five stat chips');
assert.ok(ctx.stats.children.every((c) => c.className === 'stat-chip'), 'no chip over limit');
assert.ok(ctx.limits.textContent.includes('20 cps'), 'limits line cps');
assert.ok(ctx.limits.textContent.includes('42 chars/line'), 'limits line cpl');
assert.ok(ctx.limits.textContent.includes('2 lines'), 'limits line lines');
assert.strictEqual(ctx.summary.children[0].className, 'quality-pass', 'no-problems class');
assert.strictEqual(ctx.summary.children[0].textContent, JOB_I18N.no_problems, 'no-problems text');
assert.strictEqual(ctx.problems.children.length, 0, 'no problem rows');

ctx.render(problemsPayload);
assert.strictEqual(ctx.summary.children[0].textContent, '2 ' + JOB_I18N.issues_total, 'issue count line');
const chips = ctx.summary.children.filter((c) => c.className === 'issue-chip');
assert.deepStrictEqual(chips.map((c) => c.textContent),
	['Reading speed: 1', 'Line length: 1'], 'type chips');

assert.strictEqual(ctx.problems.children.length, 2, 'two problem rows');
const row0 = ctx.problems.children[0];
assert.ok(row0.className.includes('sev-critical'), 'row severity class');
const meta0 = row0.children[0];
assert.strictEqual(meta0.children[0].textContent, '#12', 'caption number');
assert.strictEqual(meta0.children[1].className, 'sev-badge sev-critical', 'badge class');
assert.strictEqual(meta0.children[1].textContent, 'critical', 'badge text');
assert.strictEqual(meta0.children[2].textContent, '01:23 → 01:25', 'timecode');
assert.strictEqual(meta0.children[4].textContent, '58 chars', 'chars');
assert.strictEqual(meta0.children[5].textContent, '30.5 cps', 'cps');
assert.strictEqual(row0.children[1].className, 'read-text', 'text block');
const issue0 = row0.children[2].children[0];
assert.strictEqual(issue0.textContent, 'Reading speed: 30.5 cps (limit 20 cps)', 'issue chip text');

const row1 = ctx.problems.children[1];
assert.ok(row1.className.includes('sev-minor'), 'minor row class');
assert.strictEqual(row1.children[0].children[2].textContent, '1:01:15 → 1:01:20', 'hour timecode');
const issue1 = row1.children[2].children[0];
assert.strictEqual(issue1.textContent, 'Line length: 50 (limit 42)', 'line_length chip (no cps unit)');

ctx.render({ captions: 100, thresholds: { max_cps: 20 }, problems: [], problems_by_type: [] });
assert.strictEqual(ctx.summary.children[0].className, 'quality-pass', 'array problems_by_type treated as clean');

const many = Array.from({ length: 30 }, (_, i) => ({
	caption: i + 1,
	severity: 'minor',
	start_seconds: i,
	end_seconds: i + 2,
	cps: 25,
	issues: [{ type: 'reading_speed', severity: 'minor', value: 25, limit: 20 }],
}));
ctx.render({ captions: 100, thresholds: { max_cps: 20 }, problems: many, problems_by_type: { reading_speed: 30 } });
assert.strictEqual(ctx.problems.children.length, 26, '25 rows + truncation note');
assert.strictEqual(ctx.problems.children[25].textContent, '+5 more not shown', 'truncation note text');

console.log('render-readability: all assertions passed');

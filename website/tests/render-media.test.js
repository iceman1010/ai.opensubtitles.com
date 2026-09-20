'use strict';

const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { runInThisContext } = require('node:vm');
const path = require('node:path');

const T = {
	files: 'file(s)',
	preview: 'Preview',
	download: 'Download',
	close: 'Close',
	media_none: 'Nothing here yet.',
	media_error: 'Could not load recent media.',
	activities_none: 'Nothing here yet.',
	activities_error: 'Could not load activities.',
	download_failed: 'Download failed',
	preview_failed: 'Preview failed',
};

function makeElement(tag) {
	const node = {
		tagName: tag,
		className: '',
		_hiddenText: undefined,
		hidden: false,
		type: '',
		disabled: false,
		onclick: null,
		children: [],
		handlers: {},
		get childNodes() { return this.children; },
		get textContent() {
			if (node._hiddenText !== undefined) return node._hiddenText;
			return node.children.map((c) => (c.textContent !== undefined ? c.textContent : '')).join('');
		},
		set textContent(v) { node._hiddenText = v; },
		appendChild(child) { this.children.push(child); return child; },
		prepend(child) { this.children.unshift(child); return child; },
		querySelectorAll() { return []; },
		setAttribute() {},
		remove() {},
		classList: { add() {}, remove() {} },
		addEventListener(type, fn) { (node.handlers[type] = node.handlers[type] || []).push(fn); },
		removeEventListener() {},
		click() { (node.handlers.click || []).forEach((fn) => fn({ target: node, preventDefault() {} })); },
	};
	Object.defineProperty(node, 'innerHTML', {
		set() { node.children.length = 0; },
		get() { return ''; },
	});
	return node;
}

const containers = {};
const document = {
	readyState: 'complete',
	body: makeElement('body'),
	keydownHandlers: [],
	getElementById(id) {
		if (!containers[id]) containers[id] = makeElement('div');
		return containers[id];
	},
	createElement: (tag) => makeElement(tag),
	createElementNS: () => makeElement('svg'),
	addEventListener(type, fn) { if (type === 'keydown') document.keydownHandlers.push(fn); },
	removeEventListener() {},
	querySelectorAll() { return []; },
};

const state = {
	media: [],
	mediaPages: {},
	mediaFiles: {},
	downloads: [],
	mediaTextError: null,
	activityPages: {},
};

const window = {
	AI: {
		requireAuth: () => true,
		getCredits: async () => ({ credits: 12.5 }),
		recentActivities: async (page) => state.activityPages[page] || [],
		recentMedia: async (page) => {
			if (state.mediaPages[page]) return state.mediaPages[page];
			return page === 1 ? state.media : [];
		},
		mediaFileText: async (mediaId, fileName) => {
			if (state.mediaTextError) throw state.mediaTextError;
			return state.mediaFiles[mediaId + '/' + fileName];
		},
		downloadText: (content, fileName) => state.downloads.push([content, fileName]),
	},
};

globalThis.window = window;
globalThis.document = document;
globalThis.DASH_I18N = T;
globalThis.Blob = class {};
globalThis.URL = { createObjectURL: () => 'blob:x', revokeObjectURL() {} };

const src = readFileSync(path.join(__dirname, '..', 'public', 'js', 'dashboard.js'), 'utf8');
const loadDashboard = () => runInThisContext(src, { filename: 'dashboard.js' });
const tick = () => new Promise((r) => setTimeout(r, 0));

(async () => {
	state.media = [
		{ id: 42, time_str: 'Sat, 20 Sep 2026 12:00:00 GMT', files: ['movie.en.srt', 'movie.mp4'] },
		{ id: 43, time_str: 'Sat, 20 Sep 2026 13:30:00 GMT', files: [] },
	];
	state.mediaFiles = { '42/movie.en.srt': 'SRT CONTENT' };
	loadDashboard();
	await tick();
	await tick();

	assert.strictEqual(containers['credits-value'].textContent, '12.50', 'credits rendered');

	const list = containers['recent-media'].children[0];
	assert.strictEqual(list.className, 'media-list', 'media list container');
	assert.strictEqual(list.children.length, 2, 'two media items');

	const item42 = list.children[0];
	assert.strictEqual(item42.tagName, 'details', 'details element');
	const summary = item42.children[0];
	assert.strictEqual(summary.className, 'media-summary');
	assert.strictEqual(summary.children[0].textContent, '#42', 'media id');
	assert.strictEqual(summary.children[2].textContent, '2 file(s)', 'file count');

	const files = item42.children[1];
	assert.strictEqual(files.className, 'media-files');
	const srtRow = files.children[0];
	assert.strictEqual(srtRow.children[0].textContent, 'movie.en.srt');
	assert.strictEqual(srtRow.children[1].textContent, 'Preview', 'srt has preview button');
	assert.strictEqual(srtRow.children[2].textContent, 'Download', 'srt has download button');
	const mp4Row = files.children[1];
	assert.strictEqual(mp4Row.children.length, 2, 'mp4 row: name + download only');
	assert.strictEqual(mp4Row.children[1].textContent, 'Download', 'mp4 has no preview');

	const item43 = list.children[1];
	assert.strictEqual(item43.children[1].children.length, 0, 'empty media item has no file rows');

	srtRow.children[2].click();
	await tick();
	assert.deepStrictEqual(state.downloads, [['SRT CONTENT', 'movie.en.srt']], 'download fetches text and saves');

	srtRow.children[1].click();
	await tick();
	const overlay = document.body.children[0];
	assert.strictEqual(overlay.className, 'modal-overlay');
	assert.strictEqual(overlay.hidden, false, 'modal open');
	assert.strictEqual(overlay.children[0].children[0].textContent, 'movie.en.srt', 'modal title');
	assert.strictEqual(overlay.children[0].children[1].textContent, 'SRT CONTENT', 'modal content');

	overlay.children[0].children[2].children[0].click();
	assert.deepStrictEqual(
		state.downloads[state.downloads.length - 1],
		['SRT CONTENT', 'movie.en.srt'],
		'modal download button'
	);

	overlay.children[0].children[2].children[1].click();
	assert.strictEqual(overlay.hidden, true, 'close button hides modal');

	srtRow.children[1].click();
	await tick();
	assert.strictEqual(document.body.children[0].hidden, false, 'modal reopens');
	document.keydownHandlers[document.keydownHandlers.length - 1]({ key: 'Escape' });
	assert.strictEqual(document.body.children[0].hidden, true, 'escape hides modal');

	state.media = [];
	loadDashboard();
	await tick();
	await tick();
	assert.strictEqual(containers['recent-media'].children[0].className, 'empty', 'empty state');

	state.media = [{ id: 99, time_str: '', files: ['a.srt'] }];
	state.mediaTextError = new Error('HTTP 404');
	loadDashboard();
	await tick();
	await tick();
	const errRow = containers['recent-media'].children[0].children[0].children[1].children[0];

	errRow.children[2].click();
	await tick();
	assert.strictEqual(containers['recent-media'].children[0].className, 'form-error', 'error box prepended');
	assert.ok(containers['recent-media'].children[0].textContent.includes('Download failed'), 'error message shown');

	state.mediaPages = {
		1: Array.from({ length: 20 }, (_, i) => ({ id: 100 + i, time_str: '', files: ['a.srt'] })),
		2: Array.from({ length: 3 }, (_, i) => ({ id: 200 + i, time_str: '', files: ['a.srt'] })),
	};
	loadDashboard();
	await tick();
	await tick();
	assert.strictEqual(containers['recent-media'].children[0].className, 'media-list', 'paginated list container');
	assert.strictEqual(containers['recent-media'].children[0].children.length, 10, 'first chunk is 10 items');
	const actBtn = containers['recent-media'].children[1];
	assert.strictEqual(actBtn.className.includes('btn-block-show'), true, 'show more button present');
	assert.strictEqual(actBtn.hidden, false, 'show more button visible when more data');
	actBtn.click();
	await tick();
	await tick();
	assert.strictEqual(containers['recent-media'].children[0].children.length, 20, 'second chunk appends 10 more');
	actBtn.click();
	await tick();
	await tick();
	assert.strictEqual(containers['recent-media'].children[0].children.length, 23, 'last short page appends remaining 3');
	assert.strictEqual(actBtn.hidden, true, 'show more button hidden after last page');

	console.log('render-media: all assertions passed');
})().catch((e) => { console.error(e); process.exit(1); });

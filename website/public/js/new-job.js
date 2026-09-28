(function () {
	if (!window.AI.requireAuth()) return;

	let currentFile = null;
	let currentKind = null;
	let duration = undefined;

	const DETECT_SECONDS = 240;

	const dropzone = document.getElementById('dropzone');
	const fileInput = document.getElementById('file-input');
	const detectResult = document.getElementById('detect-result');
	const langDetect = document.getElementById('lang-detect');
	const optionsPanel = document.getElementById('options-panel');
	const transcribeOptions = document.getElementById('transcribe-options');
	const translateOptions = document.getElementById('translate-options');
	const convertBox = document.getElementById('convert-progress');
	const convertBar = document.getElementById('convert-bar');
	const uploadBox = document.getElementById('upload-progress');
	const uploadBar = document.getElementById('upload-bar');
	const errorBox = document.getElementById('job-error');
	const submitButton = document.getElementById('job-submit');
	const fileDetails = document.getElementById('file-details');
	const fileDetailsToggle = document.getElementById('file-details-toggle');
	const fileDetailsBody = document.getElementById('file-details-body');
	const detectModal = document.getElementById('detect-modal');

	const I18N = Object.assign({}, document.getElementById('newjob-i18n').dataset);
	const SELECT_LANGUAGE = I18N.select_language || 'Select Language';

	function showError(message) {
		errorBox.textContent = message;
		errorBox.hidden = false;
	}

	function reset() {
		errorBox.hidden = true;
		optionsPanel.hidden = true;
		convertBox.hidden = true;
		uploadBox.hidden = true;
		submitButton.disabled = false;
		langDetect.hidden = true;
		langDetect.classList.remove('ok', 'fail');
		fileDetails.hidden = true;
		fileDetailsBody.hidden = true;
		fileDetailsBody.innerHTML = '';
		fileDetailsToggle.classList.remove('open');
		fileDetailsToggle.setAttribute('aria-expanded', 'false');
		detectModal.hidden = true;
	}

	function wireDropzone() {
		document.addEventListener('dragover', (e) => e.preventDefault());
		document.addEventListener('drop', (e) => e.preventDefault());
		if (!dropzone) return;
		dropzone.addEventListener('click', () => fileInput.click());
		dropzone.addEventListener('dragover', (e) => {
			e.preventDefault();
			dropzone.classList.add('dragover');
		});
		dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
		dropzone.addEventListener('drop', (e) => {
			e.preventDefault();
			dropzone.classList.remove('dragover');
			if (e.dataTransfer.files.length) onFile(e.dataTransfer.files[0]);
		});
		fileInput.addEventListener('change', () => {
			if (fileInput.files.length) onFile(fileInput.files[0]);
		});
	}

	async function onFile(file) {
		reset();
		currentFile = file;
		currentKind = null;
		detectResult.hidden = false;
		detectResult.textContent = 'Inspecting ' + file.name + ' …';

		try {
			const detection = await window.FileDetect.detect(file);
			currentKind = detection.kind === 'subtitle' || detection.kind === 'media' ? detection.kind : null;
			if (detection.duration) duration = detection.duration;

			if (currentKind === null) {
				showError(detection.message || ('Unsupported file type: .' + detection.ext));
				return;
			}

			const size = window.FileDetect.sizeCheck(file);
			if (!size.ok) {
				detectResult.textContent = size.error;
				return;
			}

			detectResult.textContent = detection.kind === 'subtitle'
				? 'Subtitle file detected — configure the translation below.'
				: 'Media file detected — configure the transcription below.' + (size.warning ? ' ' + size.warning : '');

			renderFileDetails(detection.details);
			await showOptions(detection.kind);
			if (detection.kind === 'media') showDetectConsent();
			else detectSourceLanguage();
		} catch (e) {
			showError(e.message || 'Could not process this file.');
		}
	}

	function fillSelect(select, items, valueKey, labelKey, preferred, placeholder) {
		select.innerHTML = '';
		if (placeholder) {
			const ph = document.createElement('option');
			ph.value = '';
			ph.textContent = placeholder;
			select.appendChild(ph);
		}
		for (const item of items) {
			const option = document.createElement('option');
			option.value = item[valueKey];
			option.textContent = item[labelKey];
			select.appendChild(option);
		}
		if (preferred && select.querySelector('option[value="' + preferred + '"]')) select.value = preferred;
		else if (placeholder) select.value = '';
	}

	function apiIds(apis) {
		if (Array.isArray(apis)) return apis.map((a) => typeof a === 'string' ? a : a.name || a.id).filter(Boolean);
		if (apis && typeof apis === 'object') {
			return Object.keys(apis).map((key) => apis[key] && apis[key].name ? apis[key].name : key);
		}
		return [];
	}

	async function showOptions(kind) {
		const info = await window.AI.serviceInfo(kind === 'subtitle' ? 'translation' : 'transcription');
		const apis = apiIds(info.data.apis);
		const stored = window.AI.getConfig();
		const lastApi = stored.lastApi;
		const lastLanguage = stored.lastUsedLanguage;

		if (kind === 'subtitle') {
			transcribeOptions.hidden = true;
			translateOptions.hidden = false;
			const modelSelect = translateOptions.querySelector('select[name="model"]');
			fillSelect(modelSelect, apis.map((id) => ({ id: id, label: id })), 'id', 'label', apis.includes(lastApi) ? lastApi : apis[0]);
			await loadLanguages(modelSelect.value, lastLanguage);

			modelSelect.onchange = async () => {
				const previous = Array.from(translateOptions.querySelectorAll('select[data-role="language"]')).map((s) => s.value);
				await loadLanguages(modelSelect.value, null, previous);
			};
		} else {
			translateOptions.hidden = true;
			transcribeOptions.hidden = false;
			const modelSelect = transcribeOptions.querySelector('select[name="model"]');
			fillSelect(modelSelect, apis.map((id) => ({ id: id, label: id })), 'id', 'label', apis.includes(lastApi) ? lastApi : apis[0]);
			await loadLanguages(modelSelect.value, lastLanguage);

			modelSelect.onchange = async () => {
				const select = transcribeOptions.querySelector('select[data-role="language"]');
				await loadLanguages(modelSelect.value, null, [select.value]);
			};
		}

		optionsPanel.hidden = false;
	}

	async function loadLanguages(apiId, preferred, previous) {
		const kind = currentKind === 'subtitle' ? 'translation' : 'transcription';
		const languages = await window.AI.languagesFor(kind, apiId);
		const scope = currentKind === 'subtitle' ? translateOptions : transcribeOptions;
		const selects = scope.querySelectorAll('select[data-role="language"]');
		selects.forEach((select, i) => {
			fillSelect(select, languages, 'language_code', 'language_name', remapLanguage((previous && previous[i]) || preferred, languages), SELECT_LANGUAGE);
		});
	}

	function setLangStatus(text, state, withSpinner) {
		langDetect.textContent = '';
		if (withSpinner) langDetect.appendChild(Object.assign(document.createElement('span'), { className: 'spinner' }));
		langDetect.appendChild(document.createTextNode(text || ''));
		langDetect.hidden = false;
		langDetect.classList.remove('ok', 'fail');
		if (state) langDetect.classList.add(state);
	}

	function showDetectConsent() {
		detectModal.hidden = false;
	}

	function skipDetection() {
		detectModal.hidden = true;
		setLangStatus(I18N.detect_skipped);
	}

	document.getElementById('detect-modal-yes').addEventListener('click', () => {
		detectModal.hidden = true;
		detectSourceLanguage();
	});
	document.getElementById('detect-modal-no').addEventListener('click', skipDetection);
	detectModal.addEventListener('click', (e) => {
		if (e.target === detectModal) skipDetection();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !detectModal.hidden) skipDetection();
	});

	function baseLanguage(code) {
		return String(code || '').split(/[-_]/)[0].toLowerCase();
	}

	function remapLanguage(code, languages) {
		if (!code) return '';
		if (languages.some((l) => l.language_code === code)) return code;
		const base = baseLanguage(code);
		const hit = languages.find((l) => baseLanguage(l.language_code) === base);
		return hit ? hit.language_code : '';
	}

	function esc(value) {
		return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
	}

	function fmtDuration(seconds) {
		if (!isFinite(seconds) || seconds <= 0) return null;
		const total = Math.round(seconds);
		const pad = (n) => String(n).padStart(2, '0');
		const h = Math.floor(total / 3600);
		const m = Math.floor((total % 3600) / 60);
		const s = total % 60;
		return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
	}

	function fmtKbps(bitsPerSecond) {
		return isFinite(bitsPerSecond) && bitsPerSecond > 0 ? Math.round(bitsPerSecond / 1000) + ' kbps' : null;
	}

	function fmtKHz(hertz) {
		return isFinite(hertz) && hertz > 0 ? (hertz / 1000).toFixed(1) + ' kHz' : null;
	}

	function fmtChannels(track) {
		if (!isFinite(track.channels) || track.channels <= 0) return null;
		if (track.channels > 2 && track.layout) return track.channels + ' ch · ' + track.layout;
		return track.channels + ' ch';
	}

	function joinProfile(format, profile) {
		if (!format) return profile || null;
		return profile ? format + ' · ' + profile : format;
	}

	function detailRows(rows) {
		return rows
			.filter((r) => r[1] !== null && r[1] !== undefined && r[1] !== '')
			.map((r) => '<div class="fd-row"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>')
			.join('');
	}

	function detailGroup(title, rows) {
		const html = detailRows(rows);
		return html ? '<div class="fd-group"><h4>' + esc(title) + '</h4><dl>' + html + '</dl></div>' : '';
	}

	function renderFileDetails(details) {
		if (!details) return;
		const L = I18N;
		const c = details.container || {};
		let html = detailGroup(L.details_container, [
			[L.details_format, joinProfile(c.format, c.profile)],
			[L.details_duration, fmtDuration(c.duration)],
			[L.details_size, isFinite(c.size) && c.size > 0 ? window.FileDetect.formatSize(c.size) : null],
			[L.details_bitrate, fmtKbps(c.bitrate)]
		]);
		for (const v of details.video || []) {
			html += detailGroup(L.details_video, [
				[L.details_format, joinProfile(v.format, v.profile)],
				[L.details_resolution, v.width > 0 && v.height > 0 ? v.width + ' × ' + v.height : null],
				[L.details_frame_rate, isFinite(v.frameRate) && v.frameRate > 0 ? Math.round(v.frameRate) + ' fps' : null],
				[L.details_bitrate, fmtKbps(v.bitrate)]
			]);
		}
		const audioTracks = details.audio || [];
		audioTracks.forEach((a, i) => {
			const title = audioTracks.length > 1 ? L.details_audio + ' ' + (i + 1) : L.details_audio;
			html += detailGroup(title, [
				[L.details_format, joinProfile(a.format, a.profile)],
				[L.details_channels, fmtChannels(a)],
				[L.details_sample_rate, fmtKHz(a.sampleRate)],
				[L.details_bitrate, fmtKbps(a.bitrate)],
				[L.details_language, a.language]
			]);
		});
		const s = details.subtitles;
		if (s) {
			html += detailGroup(L.details_subtitles, [
				[L.details_format, s.format],
				[L.details_captions, isFinite(s.captions) && s.captions > 0 ? s.captions.toLocaleString() : null],
				[L.details_duration, fmtDuration(s.duration)],
				[L.details_characters, isFinite(s.characters) && s.characters > 0 ? s.characters.toLocaleString() : null],
				[L.details_words, isFinite(s.words) && s.words > 0 ? s.words.toLocaleString() : null],
				[L.details_avg_length, isFinite(s.avgLength) && s.avgLength > 0 ? String(s.avgLength) : null]
			]);
		}
		if (!html) return;
		fileDetailsBody.innerHTML = html;
		fileDetails.hidden = false;
	}

	fileDetailsToggle.addEventListener('click', () => {
		const open = fileDetailsBody.hidden;
		fileDetailsBody.hidden = !open;
		fileDetailsToggle.classList.toggle('open', open);
		fileDetailsToggle.setAttribute('aria-expanded', String(open));
	});

	function applyDetectedLanguage(lang) {
		if (!lang || !lang.ISO_639_1) {
			setLangStatus(I18N.language_detect_failed, 'fail');
			return;
		}
		const scope = currentKind === 'subtitle' ? translateOptions : transcribeOptions;
		const select = currentKind === 'subtitle'
			? scope.querySelectorAll('select[data-role="language"]')[0]
			: scope.querySelector('select[data-role="language"]');
		if (!select || !select.options.length) {
			setLangStatus(I18N.language_detect_failed, 'fail');
			return;
		}

		const base = baseLanguage(lang.ISO_639_1);
		let match = null;
		for (const option of select.options) {
			if (baseLanguage(option.value) === base) { match = option; break; }
		}
		if (match) {
			select.value = match.value;
			setLangStatus(I18N.language_detected + ' ' + (lang.name || match.textContent) + ' (' + match.value + ')', 'ok');
		} else {
			setLangStatus(I18N.language_detected + ' ' + (lang.name || lang.ISO_639_1) + ' (' + lang.ISO_639_1 + ')', 'ok');
		}
	}

	async function pollDetection(correlationId) {
		const started = Date.now();
		while (Date.now() - started < 120000) {
			const response = await window.AI.languageDetectionStatus(correlationId);
			if (response.status === 'COMPLETED' && response.data && response.data.language) {
				return response.data.language;
			}
			if (response.status === 'ERROR' || response.status === 'TIMEOUT') {
				throw new Error((response.errors && response.errors.join(', ')) || 'Language detection failed');
			}
			await new Promise((r) => setTimeout(r, 3000));
		}
		throw new Error('Language detection timed out');
	}

	async function detectSourceLanguage() {
		if (!currentFile || !currentKind) return;

		try {
			setLangStatus(I18N.detecting_language, null, true);

			let payload = currentFile;
			if (currentKind === 'media') {
				payload = await window.FFmpegService.convertToMonoMp3(currentFile, null, DETECT_SECONDS);
			}

			const response = await window.AI.detectLanguage(payload, DETECT_SECONDS);
			let lang = null;
			if (response && response.data && response.data.language) {
				lang = response.data.language;
			} else if (response && response.correlation_id) {
				lang = await pollDetection(response.correlation_id);
			} else {
				throw new Error((response && response.errors && response.errors.join(', ')) || 'Language detection failed');
			}
			applyDetectedLanguage(lang);
		} catch (e) {
			setLangStatus(I18N.language_detect_failed, 'fail');
		}
	}

	submitButton.addEventListener('click', async () => {
		if (!currentFile || !currentKind) return;
		const langScope = currentKind === 'media' ? transcribeOptions : translateOptions;
		const missingLanguage = Array.from(langScope.querySelectorAll('select[data-role="language"]')).some((s) => !s.value);
		if (missingLanguage) {
			showError(SELECT_LANGUAGE);
			return;
		}
		submitButton.disabled = true;
		errorBox.hidden = true;

		try {
			let payload = currentFile;
			let api, language, from, to;

			if (currentKind === 'media') {
				convertBox.hidden = false;
				payload = await window.FFmpegService.convertToMonoMp3(currentFile, (p) => {
					convertBar.value = Math.round(p * 100);
				}, duration);
				convertBox.hidden = true;

				const scope = transcribeOptions;
				api = scope.querySelector('select[name="model"]').value;
				language = scope.querySelector('select[data-role="language"]').value;
			} else {
				const scope = translateOptions;
				api = scope.querySelector('select[name="model"]').value;
				const langSelects = scope.querySelectorAll('select[data-role="language"]');
				from = langSelects[0].value;
				to = langSelects[1].value;
			}

			const options = currentKind === 'media'
				? { api: api, language: language }
				: { api: api, from: from, to: to };

			window.AI.saveConfig({
				lastApi: api,
				lastUsedLanguage: currentKind === 'media' ? language : to
			});

			uploadBox.hidden = false;
			const kind = currentKind === 'media' ? 'transcribe' : 'translate';
			const response = await window.AI.initiate(kind, payload, options, (p) => {
				uploadBar.value = Math.round(p * 100);
			});
			uploadBox.hidden = true;

			if (response && response.correlation_id) {
				location.href = '/jobs/' + kind + '/' + encodeURIComponent(response.correlation_id);
			} else {
				showError((response && response.errors && response.errors.join(', ')) || 'Job submission failed.');
				submitButton.disabled = false;
			}
		} catch (e) {
			convertBox.hidden = true;
			uploadBox.hidden = true;
			showError(e.message || 'Processing failed.');
			submitButton.disabled = false;
		}
	});

	wireDropzone();
})();

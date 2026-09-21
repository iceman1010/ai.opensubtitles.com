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

	const I18N = window.NEWJOB_I18N || {};

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
			const detection = await window.FileDetect.detect(file, window.FFmpegService.probe);
			currentKind = detection.kind;
			if (detection.duration) duration = detection.duration;

			if (detection.kind === 'unknown') {
				detectResult.textContent = 'Unsupported file type: .' + detection.ext;
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

			await showOptions(detection.kind);
			detectSourceLanguage();
		} catch (e) {
			showError(e.message || 'Could not process this file.');
		}
	}

	function fillSelect(select, items, valueKey, labelKey, preferred) {
		select.innerHTML = '';
		for (const item of items) {
			const option = document.createElement('option');
			option.value = item[valueKey];
			option.textContent = item[labelKey];
			select.appendChild(option);
		}
		if (preferred && select.querySelector('option[value="' + preferred + '"]')) select.value = preferred;
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
				await loadLanguages(modelSelect.value, null);
			};
		} else {
			translateOptions.hidden = true;
			transcribeOptions.hidden = false;
			const modelSelect = transcribeOptions.querySelector('select[name="model"]');
			fillSelect(modelSelect, apis.map((id) => ({ id: id, label: id })), 'id', 'label', apis.includes(lastApi) ? lastApi : apis[0]);
			await loadLanguages(modelSelect.value, lastLanguage);

			modelSelect.onchange = async () => {
				await loadLanguages(modelSelect.value, null);
			};
		}

		optionsPanel.hidden = false;
	}

	async function loadLanguages(apiId, preferred) {
		const kind = currentKind === 'subtitle' ? 'translation' : 'transcription';
		const languages = await window.AI.languagesFor(kind, apiId);
		const scope = currentKind === 'subtitle' ? translateOptions : transcribeOptions;
		const selects = scope.querySelectorAll('select[data-role="language"]');
		for (const select of selects) {
			fillSelect(select, languages, 'language_code', 'language_name', preferred);
		}
	}

	function setLangStatus(text, state) {
		langDetect.textContent = text;
		langDetect.hidden = false;
		langDetect.classList.remove('ok', 'fail');
		if (state) langDetect.classList.add(state);
	}

	function baseLanguage(code) {
		return String(code || '').split(/[-_]/)[0].toLowerCase();
	}

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
			setLangStatus(I18N.detecting_language);

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

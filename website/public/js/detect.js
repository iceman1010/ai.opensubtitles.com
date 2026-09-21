(function () {
	const SUBTITLE = ['srt', 'vtt'];
	const WASM_WARNING = 500 * 1024 * 1024;
	const WASM_LIMIT = 2 * 1024 * 1024 * 1024;

	function extOf(file) {
		return (file.name.split('.').pop() || '').toLowerCase();
	}

	function sizeCheck(file) {
		if (file.size > WASM_LIMIT) {
			return { ok: false, error: 'File is too large for browser processing (' + formatSize(file.size) + '). Maximum is 2GB. Please use the desktop app.' };
		}
		if (file.size > WASM_WARNING) {
			return { ok: true, warning: 'Large file (' + formatSize(file.size) + '). Processing may take a while and use significant memory.' };
		}
		return { ok: true };
	}

	function formatSize(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
		return (bytes / 1073741824).toFixed(2) + ' GB';
	}

	async function detect(file) {
		const ext = extOf(file);
		if (SUBTITLE.includes(ext)) return { kind: 'subtitle', ext: ext };

		let info;
		try {
			info = await window.MediaInfoService.analyze(file);
		} catch (e) {
			return { kind: 'unknown', ext: ext, message: 'Could not read this file (' + (e.message || 'unknown error') + ').' };
		}

		if (info.hasAudio) return { kind: 'media', ext: ext, duration: info.duration };
		if (info.hasVideo) return { kind: 'unsupported', ext: ext, message: 'This file has no audio track — nothing to transcribe.' };
		if (info.hasImage) return { kind: 'unsupported', ext: ext, message: 'Images cannot be transcribed — please provide a video or audio file.' };
		if (info.hasText) return { kind: 'unsupported', ext: ext, message: 'Subtitle content is handled by the translation flow — please use .srt or .vtt.' };
		return { kind: 'unsupported', ext: ext, message: 'Unsupported file type: .' + ext };
	}

	window.FileDetect = {
		detect,
		extOf,
		sizeCheck
	};
})();

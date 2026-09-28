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

	function cleanCaptionText(text) {
		return String(text || '')
			.replace(/<[^>]*>/g, '')
			.replace(/\{[^}]*\}/g, '')
			.replace(/^\[.*?\]\s*/, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	async function subtitleStats(file) {
		const content = await file.text();
		const format = window.Subsrt.detect(content);
		const captions = window.Subsrt.parse(content, { format: format })
			.filter((c) => c.type === 'caption');
		const texts = captions.map((c) => cleanCaptionText(c.text || c.content || '')).filter((t) => t.length > 0);
		const all = texts.join(' ');
		const words = all.split(/\s+/).filter(Boolean);
		const starts = captions.map((c) => c.start).filter((n) => isFinite(n));
		const ends = captions.map((c) => c.end).filter((n) => isFinite(n));
		return {
			format: format ? String(format).toUpperCase() : undefined,
			captions: captions.length,
			duration: starts.length && ends.length ? (Math.max(...ends) - Math.min(...starts)) / 1000 : undefined,
			characters: all.length,
			words: words.length,
			avgLength: texts.length ? Math.round(all.length / texts.length) : undefined
		};
	}

	async function detect(file) {
		const ext = extOf(file);
		const isSubtitleExt = SUBTITLE.includes(ext);

		let info = null;
		try {
			info = await window.MediaInfoService.analyze(file);
		} catch (e) {
			if (!isSubtitleExt) {
				return { kind: 'unknown', ext: ext, message: 'Could not read this file (' + (e.message || 'unknown error') + ').' };
			}
		}

		if (isSubtitleExt) {
			const details = info ? info.details : {};
			try {
				details.subtitles = await subtitleStats(file);
			} catch (e) {
			}
			return { kind: 'subtitle', ext: ext, details: details };
		}

		if (info.hasAudio) return { kind: 'media', ext: ext, duration: info.duration, details: info.details };
		if (info.hasVideo) return { kind: 'unsupported', ext: ext, message: 'This file has no audio track — nothing to transcribe.' };
		if (info.hasImage) return { kind: 'unsupported', ext: ext, message: 'Images cannot be transcribed — please provide a video or audio file.' };
		if (info.hasText) return { kind: 'unsupported', ext: ext, message: 'Subtitle content is handled by the translation flow — please use .srt or .vtt.' };
		return { kind: 'unsupported', ext: ext, message: 'Unsupported file type: .' + ext };
	}

	window.FileDetect = {
		detect,
		extOf,
		sizeCheck,
		formatSize
	};
})();

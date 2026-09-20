(function () {
	const SUBTITLE = ['srt', 'vtt'];
	const VIDEO = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', 'mp2', 'mpe', 'mpv', 'm2v', '3gp', '3g2', 'f4v', 'f4p', 'f4a', 'f4b', 'mxf', 'roq', 'nsv', 'vob', 'dv', 'ts', 'mts', 'm2ts', 'asf'];
	const AUDIO = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'aiff', 'au', 'raw', 'pcm', 'opus', 'vorbis', 'ac3', 'dts', 'ape', 'wv', 'amr', 'awb', 'gsm', 'spx'];

	const WASM_WARNING = 500 * 1024 * 1024;
	const WASM_LIMIT = 2 * 1024 * 1024 * 1024;

	function extOf(file) {
		return (file.name.split('.').pop() || '').toLowerCase();
	}

	function byExtension(file) {
		const ext = extOf(file);
		if (SUBTITLE.includes(ext)) return { kind: 'subtitle', ext: ext };
		if (VIDEO.includes(ext) || AUDIO.includes(ext)) return { kind: 'media', ext: ext };
		return { kind: 'unknown', ext: ext };
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

	async function detect(file, probeFn) {
		const result = byExtension(file);
		if (result.kind !== 'unknown' || typeof probeFn !== 'function') return result;

		try {
			const info = await probeFn(file);
			if (info && (info.hasAudio || info.hasVideo)) {
				return { kind: 'media', ext: result.ext, duration: info.duration };
			}
		} catch (e) {
		}
		return result;
	}

	window.FileDetect = {
		detect,
		sizeCheck,
		extOf
	};
})();

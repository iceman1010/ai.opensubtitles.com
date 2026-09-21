(function () {
	const VENDOR = '/vendor/ffmpeg/';
	let ffmpeg = null;
	let loadPromise = null;
	let opQueue = Promise.resolve();

	function enqueue(op) {
		const next = opQueue.then(op, op);
		opQueue = next.then(() => undefined, () => undefined);
		return next;
	}

	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const existing = document.querySelector('script[data-ffmpeg="1"]');
			if (existing) return resolve();
			const script = document.createElement('script');
			script.src = src;
			script.dataset.ffmpeg = '1';
			script.onload = resolve;
			script.onerror = () => reject(new Error('Failed to load ffmpeg library'));
			document.head.appendChild(script);
		});
	}

	async function blobUrl(path, type) {
		const res = await fetch(path);
		if (!res.ok) throw new Error('Failed to fetch ' + path);
		return URL.createObjectURL(await res.blob());
	}

	async function initialize() {
		if (ffmpeg) return ffmpeg;
		if (loadPromise) return loadPromise;

		loadPromise = (async () => {
			await loadScript(VENDOR + 'ffmpeg.js');
			const FFmpegClass = (window.FFmpegWASM && window.FFmpegWASM.FFmpeg) || window.FFmpeg;

			const [coreURL, wasmURL] = await Promise.all([
				blobUrl(VENDOR + 'ffmpeg-core.js', 'text/javascript'),
				blobUrl(VENDOR + 'ffmpeg-core.wasm', 'application/wasm')
			]);

			ffmpeg = new FFmpegClass();
			await ffmpeg.load({
				coreURL: coreURL,
				wasmURL: wasmURL,
				classWorkerURL: new URL(VENDOR + '814.ffmpeg.js', location.href).href
			});
			return ffmpeg;
		})();

		try {
			return await loadPromise;
		} catch (e) {
			loadPromise = null;
			throw e;
		}
	}

	function baseName(name) {
		return name.replace(/\.[^.]+$/, '');
	}

	async function convertToMonoMp3(file, onProgress, durationSeconds) {
		const instance = await initialize();
		if (instance.on) {
			instance.on('progress', (e) => {
				if (onProgress && e.progress > 0) onProgress(e.progress);
			});
		}

		return enqueue(async () => {
			const inputPath = '/input/' + file.name;
			const outputName = baseName(file.name) + '_converted.mp3';
			await instance.createDir('/input').catch(() => undefined);
			await instance.mount('WORKERFS', { files: [file] }, '/input');
			try {
				const args = ['-i', inputPath];
				if (durationSeconds) args.push('-t', String(Math.ceil(durationSeconds)));
				args.push('-vn', '-acodec', 'libmp3lame', '-ac', '1', '-ar', '16000', outputName);
				const ret = await instance.exec(args);
				if (ret !== 0) throw new Error('Conversion failed (exit code ' + ret + ')');
				const data = await instance.readFile(outputName);
				const out = new File([data.buffer || data], outputName, { type: 'audio/mpeg' });
				await instance.deleteFile(outputName).catch(() => undefined);
				return out;
			} finally {
				await instance.unmount('/input').catch(() => undefined);
			}
		});
	}

	window.FFmpegService = {
		convertToMonoMp3
	};
})();

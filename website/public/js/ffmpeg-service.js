(function () {
	const VENDOR = '/lib/ffmpeg/';
	let ffmpeg = null;
	let loadPromise = null;
	let opQueue = Promise.resolve();

	function enqueue(op) {
		const next = opQueue.then(op, op);
		opQueue = next.then(() => undefined, () => undefined);
		return next;
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
			await Common.loadScript(VENDOR + 'ffmpeg.js', 'ffmpeg', 'ffmpeg library');
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
			const outputName = baseName(file.name) + '.mp3';
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

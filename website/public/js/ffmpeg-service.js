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
			const inputName = file.name;
			const outputName = baseName(file.name) + '_converted.mp3';
			await instance.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

			const args = ['-i', inputName];
			if (durationSeconds) args.push('-t', String(Math.ceil(durationSeconds)));
			args.push('-vn', '-acodec', 'libmp3lame', '-ac', '1', '-ar', '16000', outputName);

			const ret = await instance.exec(args);
			const data = await instance.readFile(outputName);
			await instance.deleteFile(inputName).catch(() => undefined);
			await instance.deleteFile(outputName).catch(() => undefined);

			if (ret !== 0) throw new Error('Conversion failed (exit code ' + ret + ')');
			return new File([data.buffer || data], outputName, { type: 'audio/mpeg' });
		});
	}

	async function probe(file) {
		const instance = await initialize();
		const maxProbe = 10 * 1024 * 1024;
		const slice = file.slice(0, Math.min(file.size, maxProbe));

		return enqueue(async () => {
			await instance.writeFile(file.name, new Uint8Array(await slice.arrayBuffer()));

			let logOutput = '';
			const handler = ({ message }) => {
				logOutput += message + '\n';
			};
			instance.on('log', handler);
			try {
				await instance.exec(['-i', file.name, '-f', 'null', '-']);
			} catch (e) {
			}
			instance.off('log', handler);
			await instance.deleteFile(file.name).catch(() => undefined);

			const result = {
				hasAudio: /Audio:/.test(logOutput),
				hasVideo: /Video:/.test(logOutput),
				duration: undefined,
				format: undefined
			};
			const durationMatch = logOutput.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
			if (durationMatch) {
				result.duration =
					parseInt(durationMatch[1]) * 3600 +
					parseInt(durationMatch[2]) * 60 +
					parseInt(durationMatch[3]) +
					parseInt(durationMatch[4]) / 100;
			}
			const formatMatch = logOutput.match(/Input #0,\s*(\w+)/);
			if (formatMatch) result.format = formatMatch[1];
			return result;
		});
	}

	window.FFmpegService = {
		convertToMonoMp3,
		probe
	};
})();

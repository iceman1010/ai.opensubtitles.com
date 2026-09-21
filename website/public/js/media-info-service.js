(function () {
	const VENDOR = '/vendor/mediainfo/';
	const WASM = VENDOR + 'MediaInfoModule.wasm';

	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const existing = document.querySelector('script[data-mediainfo="1"]');
			if (existing) return resolve();
			const script = document.createElement('script');
			script.src = src;
			script.dataset.mediainfo = '1';
			script.onload = resolve;
			script.onerror = () => reject(new Error('Failed to load MediaInfo library'));
			document.head.appendChild(script);
		});
	}

	function factory() {
		const ns = window.MediaInfo;
		return ns && (ns.mediaInfoFactory || ns.default);
	}

	async function analyze(file) {
		await loadScript(VENDOR + 'mediainfo.min.js');
		const create = factory();
		if (typeof create !== 'function') throw new Error('MediaInfo library not available');

		const mi = await create({ locateFile: () => WASM });
		try {
			const result = await mi.analyzeData(file.size, (size, offset) =>
				file.slice(offset, offset + size).arrayBuffer().then((b) => new Uint8Array(b))
			);
			const tracks = (result && result.media && result.media.track) || [];
			const general = tracks.find((t) => t['@type'] === 'General') || {};
			let duration = parseFloat(general.Duration);
			if (!isFinite(duration)) {
				for (const t of tracks) {
					const d = parseFloat(t.Duration);
					if (isFinite(d)) {
						duration = d;
						break;
					}
				}
			}
			return {
				hasAudio: tracks.some((t) => t['@type'] === 'Audio'),
				hasVideo: tracks.some((t) => t['@type'] === 'Video'),
				hasImage: tracks.some((t) => t['@type'] === 'Image'),
				hasText: tracks.some((t) => t['@type'] === 'Text'),
				duration: isFinite(duration) ? duration : undefined,
				format: general.Format || undefined
			};
		} finally {
			if (mi.close) mi.close();
		}
	}

	window.MediaInfoService = { analyze };
})();

(function () {
	const TOKEN_KEY = 'ai_opensubtitles_token';
	const TOKEN_EXPIRY_KEY = 'ai_opensubtitles_token_expiry';
	const CONFIG_KEY = 'ai_opensubtitles_config';
	const TOKEN_VALIDITY_HOURS = 6;

	function headers(includeAuth, contentType) {
		const h = {
			'Accept': 'application/json',
			'Api-Key': SITE.apiKey,
			'X-User-Agent': SITE.userAgent
		};
		if (contentType) h['Content-Type'] = contentType;
		const token = getValidToken();
		if (includeAuth && token) h['Authorization'] = 'Bearer ' + token;
		return h;
	}

	function aiUrl(endpoint) {
		return SITE.base + '/ai' + endpoint;
	}

	function getValidToken() {
		try {
			const token = localStorage.getItem(TOKEN_KEY);
			const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
			if (!token || !expiry) return null;
			if (Date.now() > parseInt(expiry, 10)) {
				clearToken();
				return null;
			}
			return token;
		} catch (e) {
			return null;
		}
	}

	function saveToken(token) {
		localStorage.setItem(TOKEN_KEY, token);
		localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_VALIDITY_HOURS * 3600 * 1000));
	}

	function clearToken() {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(TOKEN_EXPIRY_KEY);
	}

	function getConfig() {
		try {
			return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
		} catch (e) {
			return {};
		}
	}

	function saveConfig(part) {
		const merged = Object.assign(getConfig(), part);
		localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
	}

	function authExpired() {
		clearToken();
		document.dispatchEvent(new CustomEvent('ai:auth-expired'));
	}

	function parseErrorMessage(body, status) {
		let message = 'Request failed (HTTP ' + status + ')';
		try {
			const parsed = typeof body === 'string' ? JSON.parse(body) : body;
			if (parsed) {
				if (parsed.error) message = parsed.error;
				else if (parsed.message) message = parsed.message;
				else if (Array.isArray(parsed.errors) && parsed.errors.length) message = parsed.errors.join(', ');
			}
		} catch (e) {
			if (typeof body === 'string' && body && body.length < 300) message = body;
		}
		return message;
	}

	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

	async function fetchWithRetry(url, options, label) {
		let lastError;
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				const res = await fetch(url, options);
				if (res.status === 401 || res.status === 403) {
					const body = await res.text().catch(() => '');
					if (getValidToken()) authExpired();
					const err = new Error(parseErrorMessage(body, res.status));
					err.status = res.status;
					err.auth = true;
					throw err;
				}
				if (!res.ok) {
					const body = await res.text().catch(() => '');
					const err = new Error(parseErrorMessage(body, res.status));
					err.status = res.status;
					if (res.status !== 429 && res.status < 500) throw err;
					lastError = err;
				} else {
					return res;
				}
			} catch (e) {
				if (e.auth) throw e;
				lastError = e;
			}
			if (attempt < 2) await sleep(1000 * Math.pow(2, attempt));
		}
		throw lastError || new Error('Request failed');
	}

	async function jsonCall(url, options) {
		const res = await fetchWithRetry(url, options);
		return res.json();
	}

	async function login(username, password, rememberMe) {
		if (!username || !password) return { success: false, error: 'Username and password are required' };
		if (rememberMe) saveConfig({ username: username, password: password });
		else saveConfig({ username: username, password: undefined });

		try {
			const res = await fetch(SITE.base + '/login', {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Api-Key': SITE.apiKey,
					'User-Agent': SITE.userAgent,
					'X-User-Agent': SITE.userAgent,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username: username, password: password })
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				let message = parseErrorMessage(body, res.status);
				if (message.toLowerCase() === 'blocked') {
					message = 'Account temporarily blocked by the API. Please wait a few minutes and try again.';
				} else if (res.status === 401) {
					message = 'Invalid username or password.';
				} else if (res.status === 429) {
					message = 'Too many login attempts. Please wait before trying again.';
				}
				return { success: false, error: message };
			}

			const data = await res.json();
			if (data.token) {
				saveToken(data.token);
				return { success: true, userId: data.user ? data.user.user_id : null };
			}
			return { success: false, error: 'No token received from server' };
		} catch (e) {
			return { success: false, error: 'Network error: ' + e.message };
		}
	}

	async function autoLogin() {
		const token = getValidToken();
		if (!token) return false;
		try {
			const credits = await getCredits();
			if (credits.success) return true;
		} catch (e) {
			if (e.auth) return false;
		}
		clearToken();
		const cfg = getConfig();
		if (cfg.username && cfg.password) {
			const result = await login(cfg.username, cfg.password, false, cfg.apiKey);
			return result.success;
		}
		return false;
	}

	async function getCredits() {
		const data = await jsonCall(aiUrl('/credits'), { method: 'POST', headers: headers(true, 'application/json') });
		const credits = (data.data && data.data.credits !== undefined) ? data.data.credits : data.credits;
		return { success: true, credits: credits || 0 };
	}

	async function servicesInfo() {
		const data = await jsonCall(aiUrl('/info/services'), { method: 'GET', headers: headers(true, 'application/json') });
		return { success: true, data: data.data || data };
	}

	function infoCacheGet(key) {
		try {
			const raw = sessionStorage.getItem(key);
			return raw ? JSON.parse(raw) : null;
		} catch (e) {
			return null;
		}
	}

	function infoCacheSet(key, value) {
		try {
			sessionStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
		}
	}

	async function serviceInfo(kind) {
		const cacheKey = 'ai_info_' + kind;
		const cached = infoCacheGet(cacheKey);
		if (cached) return { success: true, data: cached };

		const options = { method: 'POST', headers: headers(true, 'application/json') };
		const [apisRes, langsRes] = await Promise.all([
			fetchWithRetry(aiUrl('/info/' + kind + '_apis'), options),
			fetchWithRetry(aiUrl('/info/' + kind + '_languages'), { method: 'POST', headers: headers(true, 'application/json') })
		]);
		const apis = await apisRes.json();
		const langs = await langsRes.json();
		const data = {
			apis: apis.data !== undefined ? apis.data : apis,
			languages: langs.data !== undefined ? langs.data : langs
		};
		infoCacheSet(cacheKey, data);
		return { success: true, data: data };
	}

	async function languagesFor(kind, apiId) {
		const cacheKey = 'ai_langs_' + kind + '_' + apiId;
		const cached = infoCacheGet(cacheKey);
		if (cached) return cached;

		const data = await jsonCall(aiUrl('/info/' + kind + '_languages'), {
			method: 'POST',
			headers: headers(true, 'application/json'),
			body: JSON.stringify({ api: apiId })
		});

		let list = data.data !== undefined ? data.data : data;
		if (!Array.isArray(list)) {
			if (list && typeof list === 'object') list = list[apiId] || Object.values(list)[0] || [];
			else list = [];
		}
		infoCacheSet(cacheKey, list);
		return list;
	}

	function upload(url, formData, onProgress) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', url);
			xhr.responseType = 'json';
			const h = headers(true);
			for (const name of Object.keys(h)) xhr.setRequestHeader(name, h[name]);
			xhr.upload.addEventListener('progress', (e) => {
				if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
			});
			xhr.addEventListener('load', () => {
				if (xhr.status === 401 || xhr.status === 403) {
					authExpired();
					const err = new Error('Session expired');
					err.auth = true;
					return reject(err);
				}
				if (xhr.status >= 400) {
					return reject(new Error(parseErrorMessage(xhr.response, xhr.status)));
				}
				resolve(xhr.response);
			});
			xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
			xhr.send(formData);
		});
	}

	async function initiate(kind, file, options, onProgress) {
		const form = new FormData();
		form.append('file', file, file.name || (kind === 'transcribe' ? 'audio.mp3' : 'subtitle.srt'));
		if (kind === 'transcribe') {
			form.append('language', options.language);
			form.append('api', options.api);
		} else {
			form.append('translate_from', options.from);
			form.append('translate_to', options.to);
			form.append('api', options.api);
		}
		if (options.returnContent) form.append('return_content', 'true');

		const endpoint = kind === 'transcribe' ? '/transcribe' : '/translate';
		return upload(aiUrl(endpoint), form, onProgress);
	}

	async function status(kind, correlationId) {
		const path = kind === 'transcribe' ? '/transcribe/' : '/translation/';
		return jsonCall(aiUrl(path + encodeURIComponent(correlationId)), {
			method: 'POST',
			headers: headers(true, 'application/json')
		});
	}

	async function recent(kind, page) {
		const data = await jsonCall(aiUrl('/' + kind + '?page=' + (page || 1)), {
			method: 'POST',
			headers: headers(true, 'application/json')
		});
		return data.data || data;
	}

	async function creditPackages() {
		const res = await fetchWithRetry(aiUrl('/credits/buy'), {
			method: 'POST',
			headers: { 'Accept': 'application/json', 'Api-Key': SITE.apiKey, 'User-Agent': SITE.userAgent, 'X-User-Agent': SITE.userAgent }
		});
		const data = await res.json();
		return data.data || [];
	}

	async function downloadFile(url, fileName) {
		const res = await fetchWithRetry(url, { method: 'GET', headers: headers(true) });
		const blob = await res.blob();
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName || 'subtitles.srt';
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(link.href), 5000);
	}

	async function mediaFileText(mediaId, fileName) {
		const res = await fetchWithRetry(aiUrl('/files/' + encodeURIComponent(mediaId) + '/' + encodeURIComponent(fileName)), {
			method: 'GET',
			headers: headers(true)
		});
		return res.text();
	}

	function downloadText(content, fileName) {
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName || 'subtitles.srt';
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(link.href), 5000);
	}

	window.AI = {
		loggedIn: () => !!getValidToken(),
		requireAuth: () => {
			if (!getValidToken()) location.href = '/login';
			return !!getValidToken();
		},
		authExpired,
		login,
		autoLogin,
		logout: () => {
			clearToken();
			saveConfig({ password: undefined });
			sessionStorage.clear();
		},
		getConfig,
		saveConfig,
		getCredits,
		servicesInfo,
		serviceInfo,
		languagesFor,
		initiate,
		status,
		recentMedia: (page) => recent('recent_media', page),
		recentActivities: (page) => recent('recent_activities', page),
		creditPackages,
		downloadFile,
		mediaFileText,
		downloadText
	};
})();

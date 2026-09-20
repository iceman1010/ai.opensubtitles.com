(function () {
	document.addEventListener('ai:auth-expired', () => {
		if (!location.pathname.startsWith('/login')) {
			sessionStorage.setItem('ai_redirect_after_login', location.pathname);
			location.href = '/login?expired=1';
		}
	});

	function init() {
		const navLogin = document.getElementById('nav-login');
		const navLogout = document.getElementById('nav-logout');
		const navDashboard = document.getElementById('nav-dashboard');
		if (navLogin && navLogout) {
			const loggedIn = window.AI.loggedIn();
			navLogin.hidden = loggedIn;
			navLogout.hidden = !loggedIn;
			if (navDashboard) navDashboard.hidden = !loggedIn;
			navLogout.addEventListener('click', () => {
				window.AI.logout();
				location.href = '/';
			});
		}

		const form = document.getElementById('login-form');
		if (!form) return;

		const stored = window.AI ? window.AI.getConfig() : {};

		const username = form.querySelector('input[name="username"]');
		if (username && stored.username) username.value = stored.username;

		const remember = form.querySelector('input[name="remember"]');
		if (remember && stored.password) remember.checked = true;

		const notice = document.getElementById('login-notice');
		if (notice && new URLSearchParams(location.search).get('expired')) {
			notice.hidden = false;
		}

		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			const errorBox = document.getElementById('login-error');
			const button = form.querySelector('button[type="submit"]');
			errorBox.hidden = true;
			button.disabled = true;

			const username = form.querySelector('input[name="username"]').value.trim();
			const password = form.querySelector('input[name="password"]').value;
			const remember = form.querySelector('input[name="remember"]').checked;

			const result = await window.AI.login(username, password, remember);
			button.disabled = false;

			if (result.success) {
				const redirect = sessionStorage.getItem('ai_redirect_after_login') || '/dashboard';
				sessionStorage.removeItem('ai_redirect_after_login');
				location.href = redirect;
			} else {
				errorBox.textContent = result.error || 'Login failed';
				errorBox.hidden = false;
			}
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

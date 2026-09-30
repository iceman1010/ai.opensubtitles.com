(function () {
	var buttons = document.querySelectorAll('button[data-pkg]');
	if (!buttons.length) return;

	function loginRedirect() {
		sessionStorage.setItem('ai_redirect_after_login', location.pathname);
		location.href = '/login';
	}

	Array.prototype.forEach.call(buttons, function (btn) {
		btn.addEventListener('click', loginRedirect);
	});

	if (!window.AI || !window.AI.loggedIn()) return;

	window.AI.creditPackages().then(function (packages) {
		var urls = {};
		(packages || []).forEach(function (pkg) {
			if (pkg.name && pkg.checkout_url) urls[pkg.name] = pkg.checkout_url;
		});
		Array.prototype.forEach.call(buttons, function (btn) {
			var url = urls[btn.getAttribute('data-pkg')];
			if (!url) return;
			btn.removeEventListener('click', loginRedirect);
			btn.addEventListener('click', function () {
				window.open(url, '_blank');
			});
		});
	}).catch(function () {
		Array.prototype.forEach.call(buttons, function (btn) {
			btn.removeEventListener('click', loginRedirect);
			btn.addEventListener('click', function () {
				location.href = '/buy';
			});
		});
	});
})();

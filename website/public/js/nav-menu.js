(function () {
	var btn = document.getElementById('nav-more-btn');
	var menu = document.getElementById('nav-menu');
	if (!btn || !menu) return;

	function close() {
		menu.hidden = true;
		btn.setAttribute('aria-expanded', 'false');
	}

	btn.addEventListener('click', function (e) {
		e.stopPropagation();
		var open = menu.hidden;
		menu.hidden = !open;
		btn.setAttribute('aria-expanded', String(open));
	});

	document.addEventListener('click', function (e) {
		if (!menu.hidden && e.target !== btn && !menu.contains(e.target)) close();
	});

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') close();
	});
})();

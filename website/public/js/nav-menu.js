(function () {
	var btn = document.getElementById('nav-more-btn');
	var wrap = btn && btn.parentElement;
	var menu = document.getElementById('nav-menu');
	if (!btn || !wrap || !menu) return;

	function setOpen(open) {
		wrap.classList.toggle('open', open);
		btn.setAttribute('aria-expanded', String(open));
		if (window.innerWidth > 640) {
			wrap.style.paddingRight = open
				? Math.max(0, menu.offsetWidth - btn.offsetWidth) + 'px'
				: '0px';
		}
	}

	btn.addEventListener('click', function (e) {
		e.stopPropagation();
		setOpen(!wrap.classList.contains('open'));
	});

	document.addEventListener('click', function (e) {
		if (wrap.classList.contains('open') && !wrap.contains(e.target)) setOpen(false);
	});

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') setOpen(false);
	});

	window.addEventListener('resize', function () {
		if (window.innerWidth <= 640 && wrap.classList.contains('open')) {
			wrap.style.paddingRight = '0px';
		}
	});
})();

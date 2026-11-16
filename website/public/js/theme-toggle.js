(function () {
	var root = document.documentElement;
	var button = document.getElementById('theme-toggle');
	if (!button) return;

	function setPressed() {
		button.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
	}

	setPressed();

	button.addEventListener('click', function () {
		var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
		root.dataset.theme = next;
		localStorage.setItem('theme', next);
		setPressed();
	});
})();

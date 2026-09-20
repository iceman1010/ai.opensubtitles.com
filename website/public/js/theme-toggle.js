(function () {
	var root = document.documentElement;
	var button = document.getElementById('theme-toggle');
	if (!button) return;

	button.addEventListener('click', function () {
		var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
		root.dataset.theme = next;
		localStorage.setItem('theme', next);
	});
})();

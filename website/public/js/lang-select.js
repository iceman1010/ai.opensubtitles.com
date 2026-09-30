(function () {
	'use strict';

	var select = document.getElementById('lang-select');
	if (!select) { return; }

	var alternates = {};
	try { alternates = JSON.parse(select.dataset.alternates || '{}'); } catch (e) { alternates = {}; }
	var current = select.dataset.current || 'en';

	if (window.Intl && Intl.DisplayNames) {
		try {
			var names = new Intl.DisplayNames([current, 'en'], { type: 'language' });
			Array.prototype.forEach.call(select.options, function (opt) {
				var name = names.of(opt.value);
				if (name && name !== opt.value) {
					opt.textContent = name.charAt(0).toUpperCase() + name.slice(1);
				}
			});
		} catch (e) {}
	}

	select.value = current;

	select.addEventListener('change', function () {
		var target = alternates[select.value];
		if (!target) { return; }
		document.cookie = 'site_locale=' + encodeURIComponent(select.value) + '; max-age=31536000; path=/; samesite=lax';
		window.location.href = target;
	});
})();

(function () {
	function meta(name) {
		var el = document.querySelector('meta[name="' + name + '"]');
		return el ? el.content : '';
	}

	window.SITE = {
		base: meta('api-base'),
		apiKey: meta('api-key'),
		userAgent: meta('api-user-agent') || 'aios v1'
	};
})();

(function () {
	window.SITE = {
		base: Common.meta('api-base'),
		apiKey: Common.meta('api-key'),
		userAgent: Common.meta('api-user-agent') || 'aios v1',
		debug: Common.meta('app-debug') === '1'
	};
})();

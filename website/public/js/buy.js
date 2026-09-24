(function () {
	if (!window.AI.requireAuth()) return;

	const T = window.BUY_I18N || {};

	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	async function loadPackages() {
		const container = document.getElementById('credit-packages');
		if (!container) return;
		container.innerHTML = '';
		container.appendChild(el('p', 'empty', T.loading || 'Loading…'));
		try {
			const packages = await window.AI.creditPackages();
			render(container, packages);
		} catch (e) {
			if (!e.auth) renderError(container);
		}
	}

	function render(container, packages) {
		container.innerHTML = '';
		if (!packages.length) {
			container.appendChild(el('p', 'empty', T.empty || 'No credit packages available at the moment.'));
			container.appendChild(retryBtn());
			return;
		}
		const grid = el('div', 'packages');
		for (const pkg of packages) grid.appendChild(packageCard(pkg));
		container.appendChild(grid);
	}

	function renderError(container) {
		container.innerHTML = '';
		container.appendChild(el('p', 'form-error', T.error || 'Could not load credit packages.'));
		container.appendChild(retryBtn());
	}

	function retryBtn() {
		const btn = el('button', 'btn btn-ghost', T.retry || 'Retry');
		btn.type = 'button';
		btn.addEventListener('click', loadPackages);
		return btn;
	}

	function packageCard(pkg) {
		const card = el('div', 'package-card');
		card.appendChild(el('h3', null, pkg.name));
		card.appendChild(el('p', 'price', pkg.value));
		const badge = el('p', 'discount-badge' + (pkg.discount_percent > 0 ? '' : ' discount-placeholder'), pkg.discount_percent > 0 ? pkg.discount_percent + (T.discount_off || '% OFF') : '\u00A0');
		card.appendChild(badge);
		const btn = el('button', 'btn btn-primary', T.purchase || 'Purchase now');
		btn.type = 'button';
		btn.addEventListener('click', () => window.open(pkg.checkout_url, '_blank'));
		card.appendChild(btn);
		return card;
	}

	loadPackages();
})();

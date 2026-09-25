(function () {
	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	function t(key) {
		return (window.SUPPORT_I18N && window.SUPPORT_I18N[key]) || key;
	}

	function init() {
		const form = document.getElementById('support-form');
		if (!form) return;

		const nameInput = form.querySelector('input[name="name"]');
		const emailInput = form.querySelector('input[name="email"]');
		const otherInput = form.querySelector('input[name="other_service"]');
		const otherWrap = document.getElementById('support-other-wrap');
		const descInput = form.querySelector('textarea[name="description"]');
		const submitBtn = form.querySelector('button[type="submit"]');
		const submitLabel = submitBtn.querySelector('.btn-label');
		const errorBox = document.getElementById('support-submit-error');
		const successBox = document.getElementById('support-success');
		const cfg = window.AI.getConfig();

		if (cfg.username) nameInput.value = cfg.username;
		try {
			const saved = localStorage.getItem('support_email');
			if (saved) emailInput.value = saved;
		} catch (e) {}

		if (!window.AI.loggedIn()) {
			const modal = document.getElementById('support-modal');
			const showModal = () => {
				if (document.activeElement) document.activeElement.blur();
				modal.hidden = false;
			};
			form.addEventListener('focusin', showModal);
			form.addEventListener('click', (e) => {
				e.preventDefault();
				showModal();
			}, true);
			document.getElementById('support-modal-close').addEventListener('click', () => {
				modal.hidden = true;
			});
			modal.addEventListener('click', (e) => {
				if (e.target === modal) modal.hidden = true;
			});
			document.addEventListener('keydown', (e) => {
				if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
			});
			document.getElementById('support-modal-login').addEventListener('click', () => {
				sessionStorage.setItem('ai_redirect_after_login', location.pathname);
			});
			return;
		}

		function setError(id, message) {
			const el = document.getElementById('support-error-' + id);
			el.textContent = message;
			el.hidden = !message;
		}

		function currentScope() {
			return form.querySelector('input[name="scope"]:checked').value;
		}

		form.querySelectorAll('input[name="scope"]').forEach((radio) => {
			radio.addEventListener('change', () => {
				otherWrap.hidden = currentScope() !== 'other';
				setError('other', '');
			});
		});

		nameInput.addEventListener('blur', () => setError('name', nameInput.value.trim() ? '' : t('required_name')));
		emailInput.addEventListener('blur', () => {
			const v = emailInput.value.trim();
			setError('email', !v ? t('required_email') : (EMAIL_RE.test(v) ? '' : t('invalid_email')));
		});
		otherInput.addEventListener('blur', () => {
			if (currentScope() === 'other') setError('other', otherInput.value.trim() ? '' : t('required_other'));
		});
		descInput.addEventListener('blur', () => setError('description', descInput.value.trim() ? '' : t('required_description')));

		function validate() {
			const email = emailInput.value.trim();
			setError('name', nameInput.value.trim() ? '' : t('required_name'));
			setError('email', !email ? t('required_email') : (EMAIL_RE.test(email) ? '' : t('invalid_email')));
			setError('other', currentScope() === 'other' && !otherInput.value.trim() ? t('required_other') : '');
			setError('description', descInput.value.trim() ? '' : t('required_description'));
			return !form.querySelector('.field-error:not([hidden])');
		}

		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			errorBox.hidden = true;
			if (!validate()) return;

			const tag = currentScope() === 'ai'
				? '[SCOPE:AI]'
				: '[SCOPE:OTHER:' + otherInput.value.trim() + ']';

			submitBtn.disabled = true;
			submitLabel.textContent = t('submitting');

			const result = await window.AI.createSupportTicket(
				tag + ' ' + descInput.value.trim(),
				emailInput.value.trim(),
				nameInput.value.trim()
			);

			submitBtn.disabled = false;
			submitLabel.textContent = t('submit');

			if (result.success) {
				try { localStorage.setItem('support_email', emailInput.value.trim()); } catch (err) {}
				const idEl = document.getElementById('support-ticket-id');
				idEl.textContent = result.ticketId != null ? '#' + result.ticketId : '';
				idEl.hidden = result.ticketId == null;
				form.reset();
				otherWrap.hidden = true;
				if (cfg.username) nameInput.value = cfg.username;
				form.hidden = true;
				successBox.hidden = false;
			} else {
				errorBox.textContent = result.missingField
					? t('missing_field') + result.missingField
					: (result.error || t('error_generic'));
				errorBox.hidden = false;
			}
		});

		document.getElementById('support-again').addEventListener('click', () => {
			successBox.hidden = true;
			form.hidden = false;
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

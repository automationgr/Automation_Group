/* ════════════════════════════════════════════════════════════════
   NEWSLETTER SIGNUP — wires every ".newsletter-form" on the page
   (there's one in the footer of every page) to the Admin Portal's
   public newsletter endpoint. Falls back silently if the API is
   unreachable; never blocks the page.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var DEFAULT_API_BASE = 'https://automation-group-admin.vercel.app';

  function getApiBase() {
    var loaderScript = document.querySelector('script[src*="cms-loader.js"]');
    var fromLoader = loaderScript ? (loaderScript.getAttribute('data-api') || '').replace(/\/$/, '') : '';
    return fromLoader || DEFAULT_API_BASE;
  }

  function wireForm(form) {
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    if (!input || !button) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.style.borderColor = '#e74c3c';
        return;
      }

      var apiBase = getApiBase();
      if (!apiBase) return;

      var origText = button.textContent;
      button.disabled = true;
      button.textContent = '...';

      fetch(apiBase + '/api/public/newsletter', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) { return res.ok; })
        .catch(function () { return false; })
        .then(function (ok) {
          button.disabled = false;
          button.textContent = ok ? 'Subscribed!' : origText;
          if (ok) {
            input.value = '';
            setTimeout(function () { button.textContent = origText; }, 3000);
          }
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.newsletter-form').forEach(wireForm);
  });
})();

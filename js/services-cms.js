/* ════════════════════════════════════════════════════════════════
   SERVICES PAGE — renders the Admin Portal-managed sections that the
   generic cms-loader.js can't handle on its own: the overview grid
   and the seven service detail sections (deliverables + industries
   lists are repeatable JSON blobs; images are handled generically by
   cms-loader.js via data-cms-media).
   Fails silently to the static fallback markup if the API is unreachable.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var SERVICE_KEYS = ['data_collection', 'gis', 'remote_sensing', 'land_admin', 'environment', 'infrastructure', 'capacity'];

  function getApiBase() {
    var loaderScript = document.querySelector('script[src*="cms-loader.js"]');
    return loaderScript ? (loaderScript.getAttribute('data-api') || '').replace(/\/$/, '') : '';
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function renderOverviewCards(cards) {
    var grid = document.getElementById('overview-grid');
    if (!grid || !cards || !cards.length) return;
    grid.innerHTML = cards.map(function (c, idx) {
      return (
        '<a href="#' + escapeHtml(c.anchor) + '" class="service-card reveal" data-delay="' + ((idx % 3) * 100 + 100) + '" style="text-decoration:none;">' +
          '<div class="service-icon">' + escapeHtml(c.icon) + '</div><div class="service-num">' + String(idx + 1).padStart(2, '0') + '</div>' +
          '<h3>' + escapeHtml(c.title) + '</h3><p>' + escapeHtml(c.description) + '</p>' +
        '</a>'
      );
    }).join('');
  }

  function renderDeliverables(key, deliverables) {
    var container = document.getElementById('svc-' + key + '-deliverables');
    if (!container || !deliverables || !deliverables.length) return;
    container.innerHTML = deliverables.map(function (d) {
      return '<div class="deliverable-item"><i class="fa-solid fa-diamond"></i> ' + escapeHtml(d.text) + '</div>';
    }).join('');
  }

  function renderIndustries(key, industries) {
    var container = document.getElementById('svc-' + key + '-industries');
    if (!container || !industries || !industries.length) return;
    container.innerHTML = industries.map(function (i) {
      return '<span class="industry-tag">' + escapeHtml(i.text) + '</span>';
    }).join('');
  }

  function renderContent(content) {
    if (!content) return;

    if (content.overview) {
      try {
        var overview = JSON.parse(content.overview);
        setText('overview-label', overview.sectionLabel);
        setText('overview-title', overview.title);
        renderOverviewCards(overview.cards);
      } catch (e) { /* keep static fallback markup */ }
    }

    SERVICE_KEYS.forEach(function (key) {
      var fieldKey = 'service_' + key;
      if (!content[fieldKey]) return;
      try {
        var svc = JSON.parse(content[fieldKey]);
        setText('svc-' + key + '-label', svc.label);
        setText('svc-' + key + '-title', svc.title);
        setText('svc-' + key + '-description', svc.description);
        renderDeliverables(key, svc.deliverables);
        renderIndustries(key, svc.industries);
      } catch (e) { /* keep static fallback markup */ }
    });

    if (content.cta) {
      try {
        var cta = JSON.parse(content.cta);
        setText('services-cta-label', cta.label);
        setText('services-cta-title', cta.title);
        setText('services-cta-paragraph', cta.paragraph);
      } catch (e) { /* keep static fallback markup */ }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var apiBase = getApiBase();
    if (!apiBase) return;

    fetch(apiBase + '/api/public/content?page=services', { mode: 'cors' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { renderContent(data && data.content); })
      .catch(function () { /* keep static fallback markup */ });
  });
})();

/* ════════════════════════════════════════════════════════════════
   PRODUCTS PAGE — fully dynamic product list (Admin Portal can add,
   remove, reorder, and mark any product available/unavailable).
   Renders the detail sections itself (rather than relying on the
   generic cms-loader.js for images), since this list can grow/shrink
   and each photo slot is keyed by a product's own id. Falls back to
   the existing static markup — the original 3 products — if the API
   is unreachable or no admin has saved a product list yet.
   ════════════════════════════════════════════════════════════════ */
(function () {
  function getApiBase() {
    var loaderScript = document.querySelector('script[src*="cms-loader.js"]');
    return loaderScript ? (loaderScript.getAttribute('data-api') || '').replace(/\/$/, '') : '';
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function buildItems(content) {
    if (content.product_items) {
      try {
        var parsed = JSON.parse(content.product_items);
        if (Array.isArray(parsed.items)) return parsed.items;
      } catch (e) { /* keep static fallback markup */ }
    }
    return null;
  }

  function mediaHtml(slot) {
    if (!slot || !slot.items || !slot.items.length) return '';
    if (slot.mode === 'SLIDER' && slot.items.length > 1) {
      return (
        '<div class="cms-slider" style="position:relative; width:100%; aspect-ratio:4/3; border-radius:var(--radius-lg); box-shadow:var(--shadow-lg); overflow:hidden;">' +
          '<div class="cms-slider-track">' +
            slot.items.map(function (item, idx) {
              return '<img class="cms-slider-img" src="' + escapeHtml(item.url) + '" alt="' + escapeHtml(item.altText || '') + '" style="opacity:' + (idx === 0 ? 1 : 0) + ';">';
            }).join('') +
          '</div>' +
        '</div>'
      );
    }
    return '<img src="' + escapeHtml(slot.items[0].url) + '" alt="" style="width:100%; height:100%; object-fit:cover; display:block;">';
  }

  function startSliders(container) {
    container.querySelectorAll('.cms-slider').forEach(function (slider) {
      var imgs = slider.querySelectorAll('.cms-slider-img');
      if (imgs.length <= 1) return;
      var current = 0;
      setInterval(function () {
        imgs[current].style.opacity = '0';
        current = (current + 1) % imgs.length;
        imgs[current].style.opacity = '1';
      }, 7000);
    });
  }

  function renderDetailSections(items, mediaSlots) {
    var container = document.getElementById('products-detail-list');
    if (!container) return;

    container.innerHTML = items.map(function (item, idx) {
      var features = (item.features || []).map(function (f) {
        var parts = f.text.split(' — ');
        return '<li>' + (parts.length > 1 ? '<strong>' + escapeHtml(parts[0]) + '</strong> — ' + escapeHtml(parts.slice(1).join(' — ')) : escapeHtml(f.text)) + '</li>';
      }).join('');
      var description = (item.description || '').split('\n\n').map(function (p) {
        return '<p>' + escapeHtml(p) + '</p>';
      }).join('');
      var slot = mediaSlots['product_' + item.key + '_image'];
      var photo = mediaHtml(slot);

      var content = (
        '<div class="product-content reveal-right">' +
          '<span class="section-label">Product ' + String(idx + 1).padStart(2, '0') + '</span>' +
          '<h2 class="section-title">' + escapeHtml(item.title) + '</h2>' +
          '<div class="gold-line"></div>' +
          description +
          (features ? '<ul style="margin:1.2rem 0 1.5rem; padding-left:1.1rem; color:var(--text-body); font-size:0.88rem; line-height:1.8;">' + features + '</ul>' : '') +
          '<a href="contact.html" class="btn-primary"><i class="fa-solid fa-paper-plane"></i> Request a Quote</a>' +
        '</div>'
      );
      var img = '<div class="product-img reveal-left">' + photo + '</div>';

      return (
        '<section class="product-detail" id="' + escapeHtml(item.anchor) + '">' +
          '<div class="container">' +
            '<div class="product-detail-grid' + (idx % 2 === 1 ? ' reverse' : '') + '">' +
              (idx % 2 === 1 ? content + img : img + content) +
            '</div>' +
          '</div>' +
        '</section>'
      );
    }).join('');

    startSliders(container);
  }

  function renderContent(content, mediaSlots) {
    if (!content) return;
    var allItems = buildItems(content);
    if (!allItems) return; // keep static fallback markup — no admin save yet
    var visibleItems = allItems.filter(function (i) { return (i.status || 'OPEN') !== 'CLOSED'; });
    renderDetailSections(visibleItems, mediaSlots || {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    var apiBase = getApiBase();
    if (!apiBase) return;

    Promise.all([
      fetch(apiBase + '/api/public/content?page=team', { mode: 'cors' }).then(function (res) { return res.ok ? res.json() : null; }).catch(function () { return null; }),
      fetch(apiBase + '/api/public/media-slots?page=team', { mode: 'cors' }).then(function (res) { return res.ok ? res.json() : null; }).catch(function () { return null; }),
    ]).then(function (results) {
      renderContent(results[0] && results[0].content, results[1] && results[1].slots);
    });
  });
})();

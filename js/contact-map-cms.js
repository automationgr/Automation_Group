/* ════════════════════════════════════════════════════════════════
   CONTACT MAP — coordinates editable from the Admin Portal (Settings:
   contact_map_lat / contact_map_lng / contact_map_zoom). Falls back to
   the original hardcoded Kigali HQ coordinates if the API is
   unreachable or no admin has set custom coordinates yet.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var DEFAULT_LAT = -1.949078;
  var DEFAULT_LNG = 30.058300;
  var DEFAULT_ZOOM = 13;

  function getApiBase() {
    var loaderScript = document.querySelector('script[src*="cms-loader.js"]');
    return loaderScript ? (loaderScript.getAttribute('data-api') || '').replace(/\/$/, '') : '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('contact-map')) return;
    var apiBase = getApiBase();

    if (!apiBase) {
      initMap('contact-map', DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM);
      return;
    }

    fetch(apiBase + '/api/public/settings', { mode: 'cors' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; })
      .then(function (json) {
        var settings = (json && json.settings) || {};
        var lat = parseFloat(settings.contact_map_lat);
        var lng = parseFloat(settings.contact_map_lng);
        var zoom = parseInt(settings.contact_map_zoom, 10);
        var popupHtml = '<b style="font-family:Georgia">AUTOMATION GROUP</b><br>' +
          (settings.contact_address || '6B KG 738 St, Kigali, Rwanda.').replace(/\n/g, '<br>') +
          '<br><a href="mailto:' + (settings.contact_email || 'info@automationgroup.tech') + '" style="color:#1A6B8A">' +
          (settings.contact_email || 'info@automationgroup.tech') + '</a>';

        initMap(
          'contact-map',
          isNaN(lat) ? DEFAULT_LAT : lat,
          isNaN(lng) ? DEFAULT_LNG : lng,
          isNaN(zoom) ? DEFAULT_ZOOM : zoom,
          popupHtml
        );
      });
  });
})();

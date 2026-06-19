/* ════════════════════════════════════════════════════════════════
   TEAM — dynamic team member listing
   Pulls published team members from the Admin Portal and replaces the
   static grid. Fails silently to the static fallback markup if the
   API is unreachable or returns no members.
   ════════════════════════════════════════════════════════════════ */
(function () {
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderTeam(members) {
    if (!members.length) return; // keep static fallback markup
    var grid = document.querySelector('.team-grid');
    if (!grid) return;

    grid.innerHTML = members.map(function (m) {
      var initials = (m.fullName || '').split(' ').map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
      var photo = m.photoUrl
        ? '<div class="team-photo-placeholder"><img src="' + escapeHtml(m.photoUrl) + '" alt="' + escapeHtml(m.fullName) + '"></div>'
        : '<div class="team-photo-placeholder">' + escapeHtml(initials) + '</div>';
      var linkedin = m.linkedinUrl
        ? '<div class="team-photo-overlay"><a href="' + escapeHtml(m.linkedinUrl) + '" target="_blank" rel="noopener" class="team-linkedin"><i class="fa-brands fa-linkedin-in"></i> LinkedIn Profile</a></div>'
        : '';
      return (
        '<div class="team-card reveal">' +
          '<div class="team-photo">' + photo + linkedin + '</div>' +
          '<div class="team-body">' +
            '<h3>' + escapeHtml(m.fullName) + '</h3>' +
            '<div class="team-title">' + escapeHtml(m.role) + '</div>' +
            '<p class="team-expertise">' + escapeHtml(m.bio) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var loaderScript = document.querySelector('script[src*="cms-loader.js"]');
    var apiBase = loaderScript ? (loaderScript.getAttribute('data-api') || '').replace(/\/$/, '') : '';
    if (!apiBase) return;

    fetch(apiBase + '/api/public/team', { mode: 'cors' })
      .then(function (res) { return res.ok ? res.json() : { items: [] }; })
      .then(function (data) { renderTeam(data.items || []); })
      .catch(function () { /* keep static fallback markup */ });
  });
})();

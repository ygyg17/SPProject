(function () {
  var container = document.getElementById('header-container');
  if (!container) return;

  var assetVersion = '20260728-1';

  fetch('header.html?v=' + assetVersion, { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('Gagal load header.html (' + res.status + ')');
      return res.text();
    })
    .then(function (html) {
      container.innerHTML = html;

      var title = document.body.getAttribute('data-header-title') || 'Marketing Desk';
      var titleElement = document.getElementById('headerTitle');
      if (titleElement) titleElement.textContent = title;

      if (window.SeminyakAuth && typeof window.SeminyakAuth.renderUserBox === 'function') {
        window.SeminyakAuth.renderUserBox();
      }

      document.dispatchEvent(new CustomEvent('header:loaded'));
    })
    .catch(function (err) {
      console.error(err);
      container.innerHTML = '<div class="topbar"><span class="topbar-title">Header gagal dimuat.</span></div>';
    });
})();

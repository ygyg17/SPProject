(function () {
  var container = document.getElementById('sidebar-container');
  if (!container) return;
  var assetVersion = '20260721-1';

  fetch('sidebar.html?v=' + assetVersion, { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('Gagal load sidebar.html (' + res.status + ')');
      return res.text();
    })
    .then(function (html) {
      container.innerHTML = html;
      initSidebar();
    })
    .catch(function (err) {
      console.error(err);
      container.innerHTML = '<div style="padding:16px;font-size:12px;color:#b91c1c;">Sidebar gagal dimuat.</div>';
    });

  function initSidebar() {
    var currentFile = document.body.getAttribute('data-active-page')
      || window.location.pathname.split('/').pop().replace('.html', '')
      || 'task';

    document.querySelectorAll('.sidebar-link').forEach(function (link) {
      if (link.getAttribute('data-page') === currentFile) {
        link.classList.add('active');
      }
    });

    var roleLinks = document.querySelectorAll('.sidebar-link[data-nav-role]');
    if (roleLinks.length && window.SeminyakAuth) {
      window.SeminyakAuth.getSession().then(function (session) {
        var role = String(session && session.user && session.user.app_metadata
          ? session.user.app_metadata.role || ''
          : '').trim().toLowerCase();
        roleLinks.forEach(function (link) {
          var allowed = String(link.getAttribute('data-nav-role') || '')
            .split(',').map(function (item) { return item.trim().toLowerCase(); }).filter(Boolean);
          link.hidden = !role || allowed.indexOf(role) === -1;
        });
      }).catch(function () {
        roleLinks.forEach(function (link) { link.hidden = true; });
      });
    }

    var sidebar = document.getElementById('sidebar');
    var menuBtn = document.getElementById('sidebarMenuBtn');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    function openSidebar() { sidebar.classList.add('open'); if (overlay) overlay.classList.add('show'); }
    function closeSidebar() { sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('show'); }

    if (menuBtn && !menuBtn.dataset.sidebarBound) {
      menuBtn.dataset.sidebarBound = 'true';
      menuBtn.addEventListener('click', function () {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
      });
    }
    if (overlay && !overlay.dataset.sidebarBound) {
      overlay.dataset.sidebarBound = 'true';
      overlay.addEventListener('click', closeSidebar);
    }

    document.querySelectorAll('.sidebar-link').forEach(function (link) {
      if (!link.dataset.sidebarBound) {
        link.dataset.sidebarBound = 'true';
        link.addEventListener('click', closeSidebar);
      }
    });
  }

  document.addEventListener('header:loaded', initSidebar);
})();

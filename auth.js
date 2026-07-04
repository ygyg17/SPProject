// auth.js — pengganti versi Apps Script/token custom, sekarang pakai Supabase Auth.
// Load supabase-js dulu SEBELUM file ini, contoh di <head>:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
//   <script src="config.js"></script>
//   <script src="auth.js"></script>

const _sb = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

const SeminyakAuth = (function () {

  async function getSession() {
    const { data } = await _sb.auth.getSession();
    return data.session; // null kalau belum login
  }

  async function requireRole(requiredRoleAttr) {
    const session = await getSession();
    if (!session) {
      redirectToLogin();
      return null;
    }
    const role = session.user.user_metadata?.role || 'user';
    // Dukung multi-role dipisah koma, contoh: data-require-role="admin,staff"
    const allowedRoles = String(requiredRoleAttr || '').split(',').map(r => r.trim()).filter(Boolean);
    if (allowedRoles.length && !allowedRoles.includes(role)) {
      showNoAccessAndGoBack();
      return null;
    }
    return session;
  }

  function showNoAccessAndGoBack() {
    // Hentikan render halaman asli, ganti dengan pesan "Tidak ada akses"
    document.title = 'Tidak ada akses';
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
        font-family:Inter,system-ui,sans-serif;background:#f6f6f4;text-align:center;padding:24px;">
        <div>
          <div style="font-size:40px;margin-bottom:12px;">🚫</div>
          <h2 style="margin-bottom:8px;color:#1c1c1e;">Tidak ada akses</h2>
          <p style="color:#6b6b72;font-size:14px;">Kamu tidak punya izin untuk membuka halaman ini.<br>Mengembalikan ke halaman sebelumnya...</p>
        </div>
      </div>`;
    setTimeout(function () {
      if (document.referrer && document.referrer !== window.location.href) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    }, 1800);
  }

  function redirectToLogin() {
    const next = encodeURIComponent(window.location.pathname);
    window.location.href = `${SUPABASE_CONFIG.LOGIN_PAGE}?next=${next}`;
  }

  // Pengganti fetch biasa: otomatis menyisipkan Authorization: Bearer <access_token>
  // dan menangani sesi habis (authError) seperti versi lama.
  async function authFetch(url, options = {}) {
    const session = await getSession();
    const headers = Object.assign({}, options.headers, {
      'Content-Type': 'text/plain;charset=utf-8',
    });
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const res = await fetch(url, Object.assign({}, options, { headers }));
    const data = await res.json().catch(() => ({}));

    if (data.authError || res.status === 401) {
      await _sb.auth.signOut();
      redirectToLogin();
      throw new Error(data.message || 'Session expired, please login again');
    }
    if (!res.ok && data.success === false) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await _sb.auth.signOut();
    window.location.href = SUPABASE_CONFIG.LOGIN_PAGE;
  }

  // Render kotak user kecil di topbar (id="authUserBox"), sama seperti versi lama.
  async function renderUserBox() {
    const box = document.getElementById('authUserBox');
    if (!box) return;
    const session = await getSession();
    if (!session) { box.innerHTML = ''; return; }
    const email = session.user.email || '';
    box.innerHTML = `<span style="font-size:12px;margin-right:8px;">${email}</span>
      <button type="button" id="logoutBtn" style="font-size:12px;">Logout</button>`;
    document.getElementById('logoutBtn').addEventListener('click', signOut);
  }

  // Jalankan otomatis: cek role yang diwajibkan lewat data-require-role di <body>
  // (persis seperti body[data-require-role="admin"] di HTML lama)
  document.addEventListener('DOMContentLoaded', async () => {
    const requiredRole = document.body.dataset.requireRole;
    if (requiredRole) await requireRole(requiredRole);
    renderUserBox();
  });

  return { getSession, requireRole, authFetch, signIn, signOut, renderUserBox };
})();

// PENTING: assign eksplisit ke window — `const` di top-level TIDAK otomatis
// menempel ke window, padahal halaman lain (mis. administration.html) mengecek
// `window.SeminyakAuth` secara langsung.
window.SeminyakAuth = SeminyakAuth;

(function () {
  const API_URL = SUPABASE_CONFIG.HEYZINE_API_URL;
  const state = { flipbooks: [], filter: '' };
  const el = {};
  let hasLoaded = false;

  function byId(id) { return document.getElementById(id); }

  function initElements() {
    el.createForm = byId('createForm');
    el.editForm = byId('editForm');
    el.editModal = byId('editModal');
    el.editBookId = byId('editBookId');
    el.rows = byId('flipbookRows');
    el.search = byId('searchInput');
    el.refresh = byId('refreshButton');
    el.summary = byId('summaryText');
    el.count = byId('countLabel');
    el.toast = byId('toast');
  }

  function showToast(message, isError) {
    el.toast.textContent = message;
    el.toast.classList.toggle('error', Boolean(isError));
    el.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { el.toast.hidden = true; }, 4200);
  }

  function formPayload(form) {
    const data = new FormData(form);
    const payload = {};

    data.forEach(function (value, key) {
      if (value === '') return;
      if (value === 'true') { payload[key] = true; return; }
      if (value === 'false') { payload[key] = false; return; }
      payload[key] = typeof value === 'string' ? value.trim() : value;
    });

    form.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
      payload[input.name] = input.checked;
    });

    return payload;
  }

  async function heyzine(action, payload) {
    if (!API_URL) throw new Error('HEYZINE_API_URL belum diisi di config.js');
    const data = await SeminyakAuth.authFetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: action, payload: payload || {} })
    });
    if (data && data.success === false) {
      throw new Error(data.message || data.error || 'Request Heyzine gagal');
    }
    return data;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function bookLink(book) {
    return (book.links && (book.links.custom || book.links.base)) || book.url || '';
  }

  function thumbnail(book) {
    return (book.links && book.links.thumbnail) || book.thumbnail || '';
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  function matches(book) {
    const q = state.filter.trim().toLowerCase();
    if (!q) return true;
    return [book.id, book.title, book.subtitle, book.description, book.tags, book.private]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  }

  function renderRows() {
    const books = state.flipbooks.filter(matches);
    el.summary.textContent = books.length + ' dari ' + state.flipbooks.length + ' flipbook ditampilkan';
    el.count.textContent = String(books.length);

    if (!books.length) {
      el.rows.innerHTML = '<tr><td colspan="5" class="state-cell">Belum ada flipbook yang cocok.</td></tr>';
      return;
    }

    el.rows.innerHTML = books.map(function (book) {
      const link = bookLink(book);
      const img = thumbnail(book);
      const title = book.title || 'Untitled flipbook';
      const subtitle = book.subtitle || book.id;
      const pages = book.pages || (book.meta && book.meta.num_pages) || '-';
      return `
        <tr data-id="${escapeHtml(book.id)}">
          <td>
            <div class="heyzine-book">
              ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy">` : '<div class="heyzine-cover-empty"></div>'}
              <div>
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(subtitle)}</span>
              </div>
            </div>
          </td>
          <td data-label="Pages">${escapeHtml(pages)}</td>
          <td data-label="Date">${escapeHtml(formatDate(book.date))}</td>
          <td data-label="Link">${link ? `<a class="mini-link" href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Open</a>` : '-'}</td>
          <td>
            <div class="heyzine-actions">
              <button type="button" class="btn-secondary" data-action="edit">Edit</button>
              <button type="button" class="btn-danger" data-action="delete">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadFlipbooks() {
    el.rows.innerHTML = '<tr><td colspan="5" class="state-cell">Loading flipbooks...</td></tr>';
    el.summary.textContent = 'Memuat daftar flipbook...';
    el.count.textContent = '...';
    const data = await heyzine('list');
    state.flipbooks = Array.isArray(data) ? data : (data.flipbooks || []);
    if (!Array.isArray(state.flipbooks)) {
      throw new Error('Format list Heyzine tidak dikenali.');
    }
    renderRows();
  }

  async function createFlipbook(event) {
    event.preventDefault();
    const button = byId('createBtn');
    button.disabled = true;
    button.textContent = 'Creating...';
    try {
      const data = await heyzine('convertAsync', formPayload(el.createForm));
      showToast(data.state === 'processed' ? 'Flipbook berhasil dibuat.' : 'Konversi dimulai. Refresh beberapa saat lagi.');
      el.createForm.reset();
      el.createForm.elements.namedItem('full_screen').checked = true;
      el.createForm.elements.namedItem('share').checked = true;
      el.createForm.elements.namedItem('prev_next').checked = true;
      await loadFlipbooks();
    } catch (error) {
      showToast(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = 'Create flipbook';
    }
  }

  function setField(form, name, value) {
    const field = form.elements.namedItem(name);
    if (field) field.value = value || '';
  }

  function openEdit(book) {
    setField(el.editForm, 'id', book.id);
    setField(el.editForm, 'title', book.title);
    setField(el.editForm, 'subtitle', book.subtitle);
    setField(el.editForm, 'description', book.description);
    setField(el.editForm, 'tags', book.tags);
    ['template', 'page_effect', 'background_color', 'download', 'full_screen', 'share', 'prev_next', 'show_info', 'rtl'].forEach(function (name) {
      setField(el.editForm, name, '');
    });
    el.editBookId.textContent = book.id || '';
    el.editModal.classList.add('open');
  }

  function closeEdit() {
    el.editModal.classList.remove('open');
  }

  async function saveFlipbook(event) {
    event.preventDefault();
    const button = byId('saveBtn');
    button.disabled = true;
    button.textContent = 'Saving...';
    try {
      await heyzine('update', formPayload(el.editForm));
      showToast('Flipbook berhasil diupdate.');
      closeEdit();
      await loadFlipbooks();
    } catch (error) {
      showToast(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = 'Save changes';
    }
  }

  async function deleteFlipbook(book) {
    if (!confirm('Hapus flipbook "' + (book.title || book.id) + '"?')) return;
    try {
      await heyzine('delete', { id: book.id });
      showToast('Flipbook berhasil dihapus.');
      await loadFlipbooks();
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function bind() {
    el.createForm.addEventListener('submit', createFlipbook);
    el.editForm.addEventListener('submit', saveFlipbook);
    el.refresh.addEventListener('click', function () {
      loadFlipbooks().catch(function (error) { showToast(error.message, true); });
    });
    el.search.addEventListener('input', function (event) {
      state.filter = event.target.value;
      renderRows();
    });
    el.rows.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const row = button.closest('tr[data-id]');
      const book = state.flipbooks.find(function (item) { return item.id === row.dataset.id; });
      if (!book) return;
      if (button.dataset.action === 'edit') openEdit(book);
      if (button.dataset.action === 'delete') deleteFlipbook(book);
    });
    document.querySelectorAll('[data-close-modal]').forEach(function (button) {
      button.addEventListener('click', closeEdit);
    });
    el.editModal.addEventListener('click', function (event) {
      if (event.target === el.editModal) closeEdit();
    });
  }

  function loadOnce() {
    if (hasLoaded || !el.rows) return;
    hasLoaded = true;
    loadFlipbooks().catch(function (error) {
      showToast(error.message, true);
      el.rows.innerHTML = '<tr><td colspan="5" class="state-cell">Gagal memuat flipbook: ' + escapeHtml(error.message) + '</td></tr>';
      el.summary.textContent = 'List Heyzine gagal dimuat';
      el.count.textContent = 'error';
    });
  }

  window.onAuthReady = loadOnce;

  document.addEventListener('DOMContentLoaded', function () {
    initElements();
    bind();
    loadOnce();
  });
})();

// pages/news.js — Новини та оголошення

registerPage('news', {
  render: function(user) {
    var isAdmin = user.role === 'admin';

    return '<div style="max-width:800px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h2 style="font-size:20px;">Новини та оголошення</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">Інформація для підрозділів</p>' +
        '</div>' +
        (isAdmin ? '<button class="btn btn-primary" onclick="openCreateNews()">+ Нове оголошення</button>' : '') +
      '</div>' +
      '<div id="news-list">Завантаження...</div>' +
    '</div>' +

    '<div id="news-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;padding:20px;overflow-y:auto;">' +
      '<div style="max-width:600px;margin:40px auto;background:var(--bg-card);border-radius:var(--r4);padding:28px;position:relative;">' +
        '<button onclick="closeNewsModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>' +
        '<div id="news-modal-content"></div>' +
      '</div>' +
    '</div>';
  },

  init: async function(user) {
    await loadNewsList(user);
  }
});

async function loadNewsList(user) {
  var container = document.getElementById('news-list');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var isAdmin = user.role === 'admin';

  var query = db.from('news').select('*, profiles:created_by(full_name)').order('created_at', { ascending: false }).limit(30);

  if (!isAdmin) {
    query = query.eq('is_published', true);
  }

  var result = await query;
  if (result.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка: ' + result.error.message + '</div>';
    return;
  }

  var items = result.data || [];

  if (items.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">' +
      (isAdmin ? 'Новин ще немає. Створіть перше оголошення.' : 'Новин поки немає.') +
    '</div></div>';
    return;
  }

  var html = '';
  items.forEach(function(n) {
    var date = n.published_at ? new Date(n.published_at).toLocaleDateString('uk-UA') : new Date(n.created_at).toLocaleDateString('uk-UA');
    var author = n.profiles ? n.profiles.full_name : '';
    var audienceLabel = n.target_audience === 'all' ? 'Для всіх' : 'Окремі підрозділи';
    var isDraft = !n.is_published;

    html += '<div class="card" style="margin-bottom:12px;' + (isDraft ? 'opacity:0.6;border-left:3px solid var(--accent);' : '') + '">' +
      '<div class="card-body" style="padding:20px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">' +
          '<div style="flex:1;">' +
            '<div style="font-weight:700;font-size:16px;margin-bottom:6px;">' + n.title + '</div>' +
            '<div style="font-size:14px;color:var(--text-secondary);line-height:1.5;white-space:pre-line;">' +
              (n.content.length > 300 ? n.content.substring(0, 300) + '...' : n.content) +
            '</div>' +
            '<div style="display:flex;gap:12px;margin-top:10px;font-size:12px;color:var(--text-muted);">' +
              '<span>' + date + '</span>' +
              (author ? '<span>' + author + '</span>' : '') +
              '<span>' + audienceLabel + '</span>' +
              (isDraft ? '<span style="color:var(--accent);font-weight:600;">Чернетка</span>' : '') +
            '</div>' +
          '</div>' +
          (isAdmin ?
            '<div style="display:flex;gap:6px;flex-shrink:0;">' +
              '<button class="btn btn-secondary" style="font-size:12px;padding:4px 10px;" onclick="openEditNews(\'' + n.id + '\')">Редагувати</button>' +
              (isDraft ?
                '<button class="btn btn-secondary" style="font-size:12px;padding:4px 10px;color:var(--green);border-color:var(--green);" onclick="publishNews(\'' + n.id + '\')">Опублікувати</button>'
              : '<button class="btn btn-secondary" style="font-size:12px;padding:4px 10px;color:var(--red);border-color:var(--red);" onclick="unpublishNews(\'' + n.id + '\')">Зняти</button>') +
            '</div>'
          : '') +
        '</div>' +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

// === СТВОРЕННЯ ===
function openCreateNews() {
  var modal = document.getElementById('news-modal');
  var content = document.getElementById('news-modal-content');
  modal.style.display = 'block';

  content.innerHTML = '<h3 style="font-size:18px;margin-bottom:20px;">Нове оголошення</h3>' +
    '<div class="form-group">' +
      '<label class="form-label">Заголовок</label>' +
      '<input class="form-input" id="news-title" placeholder="Тема оголошення">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Текст</label>' +
      '<textarea class="form-input" id="news-content" rows="6" placeholder="Текст оголошення..." style="resize:vertical;"></textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Аудиторія</label>' +
      '<select class="form-input" id="news-audience">' +
        '<option value="all">Всі підрозділи</option>' +
        '<option value="specific_departments">Обрані підрозділи</option>' +
      '</select>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="saveNews(true)">Опублікувати</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="saveNews(false)">Зберегти чернетку</button>' +
    '</div>';
}

async function saveNews(publish) {
  var title = document.getElementById('news-title').value.trim();
  var content = document.getElementById('news-content').value.trim();
  var audience = document.getElementById('news-audience').value;

  if (!title || !content) { alert('Заповніть заголовок і текст'); return; }

  var data = {
    title: title,
    content: content,
    target_audience: audience,
    is_published: publish,
    published_at: publish ? new Date().toISOString() : null,
    created_by: currentUser.id
  };

  var result = await db.from('news').insert(data);
  if (result.error) { alert('Помилка: ' + result.error.message); return; }

  closeNewsModal();
  loadNewsList(currentUser);
}

// === РЕДАГУВАННЯ ===
async function openEditNews(newsId) {
  var modal = document.getElementById('news-modal');
  var content = document.getElementById('news-modal-content');
  modal.style.display = 'block';
  content.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var result = await db.from('news').select('*').eq('id', newsId).single();
  if (result.error || !result.data) { content.innerHTML = '<div class="alert alert-error">Помилка</div>'; return; }

  var n = result.data;
  content.innerHTML = '<h3 style="font-size:18px;margin-bottom:20px;">Редагувати оголошення</h3>' +
    '<div class="form-group">' +
      '<label class="form-label">Заголовок</label>' +
      '<input class="form-input" id="news-title" value="' + n.title.replace(/"/g, '&quot;') + '">' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Текст</label>' +
      '<textarea class="form-input" id="news-content" rows="6" style="resize:vertical;">' + n.content + '</textarea>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="updateNews(\'' + n.id + '\')">Зберегти</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="deleteNews(\'' + n.id + '\')" style="color:var(--red);">Видалити</button>' +
    '</div>';
}

async function updateNews(newsId) {
  var title = document.getElementById('news-title').value.trim();
  var content = document.getElementById('news-content').value.trim();
  if (!title || !content) { alert('Заповніть заголовок і текст'); return; }

  var result = await db.from('news').update({ title: title, content: content, updated_at: new Date().toISOString() }).eq('id', newsId);
  if (result.error) { alert('Помилка: ' + result.error.message); return; }
  closeNewsModal();
  loadNewsList(currentUser);
}

async function publishNews(newsId) {
  await db.from('news').update({ is_published: true, published_at: new Date().toISOString() }).eq('id', newsId);
  loadNewsList(currentUser);
}

async function unpublishNews(newsId) {
  await db.from('news').update({ is_published: false }).eq('id', newsId);
  loadNewsList(currentUser);
}

async function deleteNews(newsId) {
  if (!confirm('Видалити це оголошення?')) return;
  await db.from('news').delete().eq('id', newsId);
  closeNewsModal();
  loadNewsList(currentUser);
}

function closeNewsModal() {
  document.getElementById('news-modal').style.display = 'none';
}

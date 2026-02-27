// pages/activities.js — Список заходів користувача

registerPage('activities', {
  render: function(user) {
    return '' +
      '<div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
          '<div>' +
            '<h2 style="font-size:20px;">Мої заходи</h2>' +
            '<p style="color:var(--text-muted);font-size:14px;">Заходи вашого підрозділу</p>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="navigateTo(\'new-activity\')">➕ Новий захід</button>' +
        '</div>' +

        // Фільтри
        '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;" id="activity-filters">' +
          '<button class="btn btn-secondary filter-active" data-status="all" onclick="filterActivities(\'all\',this)" style="font-size:13px;padding:6px 14px;">Всі</button>' +
          '<button class="btn btn-secondary" data-status="draft" onclick="filterActivities(\'draft\',this)" style="font-size:13px;padding:6px 14px;">Чернетки</button>' +
          '<button class="btn btn-secondary" data-status="submitted" onclick="filterActivities(\'submitted\',this)" style="font-size:13px;padding:6px 14px;">На перевірці</button>' +
          '<button class="btn btn-secondary" data-status="verified" onclick="filterActivities(\'verified\',this)" style="font-size:13px;padding:6px 14px;">Верифіковані</button>' +
          '<button class="btn btn-secondary" data-status="rejected" onclick="filterActivities(\'rejected\',this)" style="font-size:13px;padding:6px 14px;">Відхилені</button>' +
        '</div>' +

        // Список
        '<div id="activities-list">Завантаження...</div>' +
      '</div>';
  },

  init: async function(user) {
    await loadActivities(user, 'all');
  }
});

var activitiesCache = [];

async function loadActivities(user, statusFilter) {
  var container = document.getElementById('activities-list');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var query = db
    .from('activities')
    .select('*, activity_types(name, base_weight), institutions(name, city)')
    .eq('department_id', user.department_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  var result = await query;

  if (result.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка завантаження: ' + result.error.message + '</div>';
    return;
  }

  activitiesCache = result.data || [];
  renderActivitiesList(activitiesCache);
}

function renderActivitiesList(items) {
  var container = document.getElementById('activities-list');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;">' +
      '<p style="font-size:36px;margin-bottom:8px;">📭</p>' +
      '<p style="color:var(--text-muted);">Заходів поки немає</p>' +
      '<button class="btn btn-primary" style="margin-top:12px;" onclick="navigateTo(\'new-activity\')">Створити перший захід</button>' +
    '</div></div>';
    return;
  }

  var html = '';
  items.forEach(function(item) {
    var typeName = item.activity_types ? item.activity_types.name : (item.custom_activity_name || '—');
    var instName = item.institutions ? item.institutions.name : (item.custom_institution_name || '—');
    var date = item.event_date ? formatDateShort(item.event_date) : '—';
    var score = item.status === 'verified' ? (item.final_score || item.preliminary_score) : item.preliminary_score;
    var statusClass = 'badge-' + item.status;
    var statusLabels = { draft: 'Чернетка', submitted: 'На перевірці', verified: 'Верифіковано', rejected: 'Відхилено' };
    var statusText = statusLabels[item.status] || item.status;

    html += '<div class="card" style="margin-bottom:10px;cursor:pointer;transition:box-shadow 0.15s;" ' +
      'onmouseover="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,0.06)\'" onmouseout="this.style.boxShadow=\'\'">' +
      '<div class="card-body" style="padding:14px 18px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:200px;">' +
            '<div style="font-weight:600;font-size:14px;margin-bottom:2px;">' + typeName + '</div>' +
            '<div style="font-size:13px;color:var(--text-muted);">' + instName + ' · ' + date + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="text-align:right;">' +
              '<div style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:16px;color:var(--accent-deep);">' + (score || 0) + '</div>' +
              '<div style="font-size:11px;color:var(--text-muted);">балів</div>' +
            '</div>' +
            '<span class="badge ' + statusClass + '">' + statusText + '</span>' +
          '</div>' +
        '</div>';

    // Коментар відхилення
    if (item.status === 'rejected' && item.rejection_comment) {
      html += '<div style="margin-top:8px;padding:8px 12px;background:var(--red-soft);border-radius:8px;font-size:13px;color:var(--red);">' +
        '⚠️ ' + item.rejection_comment +
      '</div>';
    }

    html += '</div></div>';
  });

  container.innerHTML = html;
}

function filterActivities(status, btn) {
  // Оновити стиль кнопок
  document.querySelectorAll('#activity-filters button').forEach(function(b) {
    b.classList.remove('filter-active');
    b.style.background = '';
    b.style.color = '';
  });
  btn.classList.add('filter-active');
  btn.style.background = 'var(--accent)';
  btn.style.color = '#fff';

  loadActivities(currentUser, status);
}

function formatDateShort(d) {
  if (!d) return '—';
  var parts = d.split('-');
  return parts[2] + '.' + parts[1];
}

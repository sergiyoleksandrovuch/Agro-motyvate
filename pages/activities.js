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
          '<button class="btn btn-primary" onclick="navigateTo(\'new-activity\')">+ Новий захід</button>' +
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
var isAdminUser = false;

async function loadActivities(user, statusFilter) {
  isAdminUser = user.role === 'admin';
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
      '<div style="margin-bottom:12px;"><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" width="48" height="48"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>' +
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

    html += '<div class="card" style="margin-bottom:10px;transition:box-shadow 0.15s;" ' +
      'onmouseover="this.style.boxShadow=\'var(--shadow-md)\'" onmouseout="this.style.boxShadow=\'\'">' +
      '<div class="card-body" style="padding:14px 18px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:200px;">' +
            activityAvatar(typeName) +
            '<div>' +
              '<div style="font-weight:600;font-size:14px;margin-bottom:2px;">' + typeName + '</div>' +
              '<div style="font-size:13px;color:var(--text-muted);">' + instName + ' · ' + date + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="text-align:right;">' +
              '<div style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:16px;color:var(--accent-deep);">' + (score || 0) + '</div>' +
              '<div style="font-size:11px;color:var(--text-muted);">балів</div>' +
            '</div>' +
            '<span class="badge ' + statusClass + '">' + statusText + '</span>' +
            (isAdminUser ? '<button onclick="event.stopPropagation();deleteActivity(\'' + item.id + '\',\'' + typeName.replace(/'/g, '') + '\')" style="background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;color:var(--text-muted);transition:all 0.2s;" onmouseover="this.style.color=\'var(--red)\';this.style.background=\'var(--red-soft)\'" onmouseout="this.style.color=\'var(--text-muted)\';this.style.background=\'none\'" title="Видалити"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : '') +
          '</div>' +
        '</div>';

    // Коментар відхилення
    if (item.status === 'rejected' && item.rejection_comment) {
      html += '<div style="margin-top:8px;padding:8px 12px;background:var(--red-soft);border-radius:8px;font-size:13px;color:var(--red);">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' + item.rejection_comment +
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

// Видалення заходу (тільки admin)
async function deleteActivity(id, name) {
  if (!confirm('Видалити захід "' + name + '"?\n\nЦя дія незворотна. Всі пов\'язані дані (фото, бали) будуть втрачені.')) return;

  // Видалити вкладення
  try { await db.from('attachments').delete().eq('entity_id', id).eq('entity_type', 'activity'); } catch(e) {}

  var result = await db.from('activities').delete().eq('id', id);
  if (result.error) { alert('Помилка: ' + result.error.message); return; }

  loadActivities(currentUser, 'all');
}

// Аватар типу заходу
function activityAvatar(typeName) {
  var lower = typeName.toLowerCase();
  var icon, bg;

  if (lower.indexOf('ліцей') >= 0 || lower.indexOf('ліцеї') >= 0 || lower.indexOf('пту') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M2 22h20"/><path d="M6 18V8l6-4 6 4v10"/><path d="M10 22v-4h4v4"/><rect x="10" y="10" width="4" height="3" rx="1"/></svg>';
    bg = 'linear-gradient(135deg, #3B82F6, #2563EB)';
  } else if (lower.indexOf('коледж') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>';
    bg = 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
  } else if (lower.indexOf('гімназі') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>';
    bg = 'linear-gradient(135deg, #10B981, #059669)';
  } else if (lower.indexOf('онлайн') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>';
    bg = 'linear-gradient(135deg, #06B6D4, #0891B2)';
  } else if (lower.indexOf('день відкритих') >= 0 || lower.indexOf('екскурсі') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    bg = 'linear-gradient(135deg, #F0AA33, #E8941A)';
  } else if (lower.indexOf('майстер') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
    bg = 'linear-gradient(135deg, #F97316, #EA580C)';
  } else if (lower.indexOf('зовнішн') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    bg = 'linear-gradient(135deg, #EF4444, #DC2626)';
  } else if (lower.indexOf('область') >= 0) {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    bg = 'linear-gradient(135deg, #8B5CF6, #6D28D9)';
  } else {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    bg = 'linear-gradient(135deg, #94A3B8, #64748B)';
  }

  return '<div style="width:40px;height:40px;border-radius:12px;background:' + bg + ';display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;">' + icon + '</div>';
}

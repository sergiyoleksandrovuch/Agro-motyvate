// pages/verify.js — Верифікація заходів (admin/verifier)

registerPage('verify', {
  render: function(user) {
    return '' +
      '<div>' +
        '<div style="margin-bottom:20px;">' +
          '<h2 style="font-size:20px;">На перевірку</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">Заходи, подані на верифікацію</p>' +
        '</div>' +

        '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;" id="verify-filters">' +
          '<button class="btn btn-secondary filter-active" onclick="filterVerify(\'submitted\',this)" style="font-size:13px;padding:6px 14px;">Очікують</button>' +
          '<button class="btn btn-secondary" onclick="filterVerify(\'verified\',this)" style="font-size:13px;padding:6px 14px;">Підтверджені</button>' +
          '<button class="btn btn-secondary" onclick="filterVerify(\'rejected\',this)" style="font-size:13px;padding:6px 14px;">Відхилені</button>' +
          '<button class="btn btn-secondary" onclick="filterVerify(\'all\',this)" style="font-size:13px;padding:6px 14px;">Всі</button>' +
        '</div>' +

        '<div id="verify-list">Завантаження...</div>' +
      '</div>' +

      // Модальне вікно деталей
      '<div id="verify-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;padding:20px;overflow-y:auto;">' +
        '<div style="max-width:600px;margin:40px auto;background:var(--bg-card);border-radius:var(--r4);padding:28px;position:relative;">' +
          '<button onclick="closeVerifyModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>' +
          '<div id="verify-modal-content"></div>' +
        '</div>' +
      '</div>';
  },

  init: async function(user) {
    await loadVerifyList('submitted');
  }
});

async function loadVerifyList(statusFilter) {
  var container = document.getElementById('verify-list');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var query = db
    .from('activities')
    .select('*, activity_types(name, base_weight), institutions(name, city), departments(name, short_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  } else {
    query = query.in('status', ['submitted', 'verified', 'rejected']);
  }

  var result = await query;

  if (result.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка: ' + result.error.message + '</div>';
    return;
  }

  var items = result.data || [];

  if (items.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;">' +
      '<p style="font-size:36px;margin-bottom:8px;">✅</p>' +
      '<p style="color:var(--text-muted);">Немає заходів для перевірки</p>' +
    '</div></div>';
    return;
  }

  var html = '';
  items.forEach(function(item) {
    var typeName = item.activity_types ? item.activity_types.name : (item.custom_activity_name || '—');
    var instName = item.institutions ? (item.institutions.name + (item.institutions.city ? ', ' + item.institutions.city : '')) : (item.custom_institution_name || '—');
    var deptName = item.departments ? item.departments.short_name : '—';
    var date = item.event_date ? formatDateShort(item.event_date) : '—';
    var score = item.preliminary_score || 0;
    var statusClass = 'badge-' + item.status;
    var statusLabels = { submitted: 'Очікує', verified: 'Підтверджено', rejected: 'Відхилено' };
    var statusText = statusLabels[item.status] || item.status;

    html += '<div class="card" style="margin-bottom:10px;cursor:pointer;" onclick="openVerifyDetail(\'' + item.id + '\')">' +
      '<div class="card-body" style="padding:14px 18px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:200px;">' +
            '<div style="font-weight:600;font-size:14px;margin-bottom:2px;">' + typeName + '</div>' +
            '<div style="font-size:13px;color:var(--text-muted);">' + deptName + ' · ' + instName + ' · ' + date + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="text-align:right;">' +
              '<div style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:16px;color:var(--accent-deep);">' + score + '</div>' +
              '<div style="font-size:11px;color:var(--text-muted);">балів</div>' +
            '</div>' +
            '<span class="badge ' + statusClass + '">' + statusText + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

function filterVerify(status, btn) {
  document.querySelectorAll('#verify-filters button').forEach(function(b) {
    b.classList.remove('filter-active');
    b.style.background = '';
    b.style.color = '';
  });
  btn.classList.add('filter-active');
  btn.style.background = 'var(--accent)';
  btn.style.color = '#fff';
  loadVerifyList(status);
}

async function openVerifyDetail(activityId) {
  var modal = document.getElementById('verify-modal');
  var content = document.getElementById('verify-modal-content');
  modal.style.display = 'block';
  content.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var result = await db
    .from('activities')
    .select('*, activity_types(name, base_weight, multipliers), institutions(name, city, type), departments(name, short_name)')
    .eq('id', activityId)
    .single();

  if (result.error || !result.data) {
    content.innerHTML = '<div class="alert alert-error">Помилка завантаження</div>';
    return;
  }

  var a = result.data;
  var typeName = a.activity_types ? a.activity_types.name : (a.custom_activity_name || '—');
  var instName = a.institutions ? a.institutions.name : (a.custom_institution_name || '—');
  var instCity = a.institutions && a.institutions.city ? ', ' + a.institutions.city : '';
  var deptName = a.departments ? a.departments.short_name : '—';

  var html = '<h3 style="font-size:18px;margin-bottom:16px;">Деталі заходу</h3>' +

    '<div style="display:grid;gap:12px;margin-bottom:20px;">' +
      detailRow('Тип', typeName) +
      detailRow('Підрозділ', (a.departments ? a.departments.name : '—') + ' (' + deptName + ')') +
      detailRow('Заклад', instName + instCity) +
      detailRow('Дата', a.event_date || '—') +
      detailRow('Учасники', a.participants_count || 0) +
      detailRow('Анкети (пап./ел.)', (a.paper_forms_count || 0) + ' / ' + (a.electronic_forms_count || 0)) +
      detailRow('Контактна особа', a.contact_person_name ? (a.contact_person_name + (a.contact_person_phone ? ', ' + a.contact_person_phone : '')) : '—') +
      detailRow('Примітка', a.notes || '—') +
      detailRow('Попередній бал', '<span style="font-weight:700;color:var(--accent-deep);">' + (a.preliminary_score || 0) + '</span>') +
    '</div>';

  if (a.status === 'submitted') {
    html += '<div style="border-top:1px solid var(--border);padding-top:16px;">' +
      '<div style="margin-bottom:12px;">' +
        '<label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Коментар (для відхилення)</label>' +
        '<textarea id="verify-comment" class="form-input" rows="2" placeholder="Вкажіть причину відхилення..." style="resize:vertical;"></textarea>' +
      '</div>' +
      '<div style="display:flex;gap:10px;">' +
        '<button class="btn btn-primary" style="flex:1;background:var(--green);border-color:var(--green);" onclick="verifyAction(\'' + a.id + '\',\'verified\')">✓ Підтвердити</button>' +
        '<button class="btn btn-secondary" style="flex:1;color:var(--red);border-color:var(--red);" onclick="verifyAction(\'' + a.id + '\',\'rejected\')">✗ Відхилити</button>' +
      '</div>' +
    '</div>';
  } else if (a.status === 'verified') {
    html += '<div style="padding:12px;background:var(--green-soft);border-radius:var(--r2);color:var(--green);font-size:14px;">✓ Підтверджено' +
      (a.final_score ? ' · Бал: ' + a.final_score : '') + '</div>';
  } else if (a.status === 'rejected') {
    html += '<div style="padding:12px;background:var(--red-soft);border-radius:var(--r2);color:var(--red);font-size:14px;">✗ Відхилено' +
      (a.rejection_comment ? ': ' + a.rejection_comment : '') + '</div>';
  }

  content.innerHTML = html;
}

function detailRow(label, value) {
  return '<div style="display:flex;gap:8px;font-size:14px;">' +
    '<span style="min-width:130px;color:var(--text-muted);">' + label + '</span>' +
    '<span style="font-weight:500;">' + value + '</span>' +
  '</div>';
}

async function verifyAction(activityId, newStatus) {
  var comment = '';
  if (newStatus === 'rejected') {
    comment = document.getElementById('verify-comment').value.trim();
    if (!comment) {
      alert('Вкажіть причину відхилення');
      return;
    }
  }

  // Спочатку отримаємо дані для розрахунку фінального балу
  var actResult = await db.from('activities')
    .select('*, activity_types(base_weight, multipliers)')
    .eq('id', activityId)
    .single();

  var finalScore = null;
  if (newStatus === 'verified' && actResult.data) {
    finalScore = actResult.data.preliminary_score;
  }

  var updateData = {
    status: newStatus,
    verified_by: currentUser.id,
    verified_at: new Date().toISOString()
  };

  if (newStatus === 'verified') {
    updateData.final_score = finalScore;
  }

  if (newStatus === 'rejected') {
    updateData.rejection_comment = comment;
  }

  var result = await db
    .from('activities')
    .update(updateData)
    .eq('id', activityId);

  if (result.error) {
    alert('Помилка: ' + result.error.message);
    return;
  }

  closeVerifyModal();
  loadVerifyList('submitted');
  loadVerifyCount();
}

function closeVerifyModal() {
  document.getElementById('verify-modal').style.display = 'none';
}

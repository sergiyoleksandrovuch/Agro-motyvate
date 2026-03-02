// pages/kpi.js — KPI-плани (цільові бали на період)

registerPage('kpi', {
  render: function(user) {
    var isAdmin = user.role === 'admin' || user.role === 'rectorate';

    return '<div style="max-width:900px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h2 style="font-size:20px;">KPI-плани</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">Цільові бали для підрозділів на період</p>' +
        '</div>' +
        (isAdmin ? '<button class="btn btn-primary" onclick="openCreateKpi()">+ Встановити KPI</button>' : '') +
      '</div>' +
      '<div id="kpi-content">Завантаження...</div>' +
    '</div>' +

    '<div id="kpi-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;padding:20px;overflow-y:auto;">' +
      '<div style="max-width:500px;margin:40px auto;background:var(--bg-card);border-radius:var(--r4);padding:28px;position:relative;">' +
        '<button onclick="closeKpiModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>' +
        '<div id="kpi-modal-content"></div>' +
      '</div>' +
    '</div>';
  },

  init: async function(user) {
    await loadKpiList(user);
  }
});

var kpiFaculties = [];

async function loadKpiList(user) {
  var container = document.getElementById('kpi-content');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var isAdmin = user.role === 'admin' || user.role === 'rectorate';

  // Завантажити факультети
  var facResult = await db.from('departments').select('id, name, short_name, staff_count').eq('type', 'faculty').eq('is_active', true).order('name');
  kpiFaculties = facResult.data || [];

  // Завантажити KPI
  var kpiQuery = db.from('kpi_plans').select('*, departments(name, short_name)').order('period_start', { ascending: false });
  if (!isAdmin) {
    kpiQuery = kpiQuery.eq('department_id', user.department_id);
  }
  var kpiResult = await kpiQuery;
  var plans = kpiResult.data || [];

  // Завантажити поточні бали верифікованих заходів по факультетах
  var actResult = await db.from('activities').select('department_id, final_score, preliminary_score, departments!inner(parent_id)').eq('status', 'verified');
  var activities = actResult.data || [];

  var facScores = {};
  kpiFaculties.forEach(function(f) { facScores[f.id] = 0; });
  activities.forEach(function(a) {
    var s = parseFloat(a.final_score || a.preliminary_score || 0);
    var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
    if (facScores[fId] !== undefined) facScores[fId] += s;
  });

  var FCOLORS = { 'ФОіФ': '#F0AA33', 'ФМіМ': '#6B2FA4', 'АФ': '#1B8C4E', 'ІТФ': '#A0673C', 'ФВМ': '#2B62A0', 'БФ': '#B82025', 'ФВІіЕ': '#1A9EBF' };

  if (plans.length === 0 && !isAdmin) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">KPI для вашого підрозділу ще не встановлено</div></div>';
    return;
  }

  // Показати прогрес по факультетах (для адміна) або по своєму підрозділу
  var html = '';

  if (isAdmin) {
    html += '<div style="font-weight:600;font-size:15px;margin-bottom:12px;">Прогрес виконання KPI</div>';
    html += '<div style="display:grid;gap:12px;margin-bottom:24px;">';

    kpiFaculties.forEach(function(f) {
      var currentScore = Math.round((facScores[f.id] || 0) * 10) / 10;
      var plan = plans.find(function(p) { return p.department_id === f.id; });
      var target = plan ? parseFloat(plan.target_score) : 0;
      var pct = target > 0 ? Math.min(Math.round((currentScore / target) * 100), 100) : 0;
      var color = FCOLORS[f.short_name] || '#939A9D';
      var barBg = pct >= 100 ? 'var(--green)' : color;

      html += '<div class="card"><div class="card-body" style="padding:14px 18px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<div style="width:10px;height:10px;border-radius:3px;background:' + color + ';"></div>' +
            '<span style="font-weight:600;font-size:14px;">' + f.short_name + '</span>' +
          '</div>' +
          '<div style="font-size:13px;">' +
            '<span style="font-weight:700;color:' + (pct >= 100 ? 'var(--green)' : 'var(--text-primary)') + ';">' + currentScore + '</span>' +
            (target > 0 ? ' <span style="color:var(--text-muted);">/ ' + target + ' (' + pct + '%)</span>' : ' <span style="color:var(--text-muted);">— KPI не встановлено</span>') +
          '</div>' +
        '</div>' +
        '<div style="height:8px;background:var(--bg-warm);border-radius:4px;overflow:hidden;">' +
          '<div style="height:100%;width:' + pct + '%;background:' + barBg + ';border-radius:4px;transition:width 0.6s;"></div>' +
        '</div>' +
      '</div></div>';
    });

    html += '</div>';
  } else {
    // Для звичайного учасника — тільки свій підрозділ
    var myFac = kpiFaculties.find(function(f) { return f.id === user.department_id; });
    if (myFac) {
      var myScore = Math.round((facScores[myFac.id] || 0) * 10) / 10;
      var myPlan = plans.find(function(p) { return p.department_id === myFac.id; });
      var myTarget = myPlan ? parseFloat(myPlan.target_score) : 0;
      var myPct = myTarget > 0 ? Math.min(Math.round((myScore / myTarget) * 100), 100) : 0;

      html += '<div class="card" style="margin-bottom:20px;"><div class="card-body" style="padding:20px;">' +
        '<div style="text-align:center;margin-bottom:12px;">' +
          '<div style="font-size:36px;font-weight:800;color:' + (myPct >= 100 ? 'var(--green)' : 'var(--accent-deep)') + ';">' + myPct + '%</div>' +
          '<div style="font-size:14px;color:var(--text-muted);">Виконання KPI</div>' +
        '</div>' +
        '<div style="height:12px;background:var(--bg-warm);border-radius:6px;overflow:hidden;margin-bottom:8px;">' +
          '<div style="height:100%;width:' + myPct + '%;background:' + (myPct >= 100 ? 'var(--green)' : 'var(--accent)') + ';border-radius:6px;"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);">' +
          '<span>Набрано: ' + myScore + '</span>' +
          '<span>Ціль: ' + (myTarget || 'не встановлено') + '</span>' +
        '</div>' +
      '</div></div>';
    }
  }

  // Таблиця KPI (для адміна)
  if (isAdmin && plans.length > 0) {
    html += '<div style="font-weight:600;font-size:15px;margin-bottom:12px;">Встановлені KPI</div>';
    html += '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
        '<thead><tr style="border-bottom:2px solid var(--border);">' +
          '<th style="padding:10px 16px;text-align:left;font-size:12px;color:var(--text-muted);">Підрозділ</th>' +
          '<th style="padding:10px 16px;text-align:center;font-size:12px;color:var(--text-muted);">Період</th>' +
          '<th style="padding:10px 16px;text-align:center;font-size:12px;color:var(--text-muted);">Цільовий бал</th>' +
          '<th style="padding:10px 16px;text-align:center;font-size:12px;color:var(--text-muted);">Дії</th>' +
        '</tr></thead><tbody>';

    plans.forEach(function(p) {
      var dName = p.departments ? p.departments.short_name : '—';
      html += '<tr style="border-bottom:1px solid var(--border-light);">' +
        '<td style="padding:10px 16px;font-weight:600;">' + dName + '</td>' +
        '<td style="padding:10px 16px;text-align:center;font-size:13px;">' + p.period_start + ' — ' + p.period_end + '</td>' +
        '<td style="padding:10px 16px;text-align:center;font-weight:700;color:var(--accent-deep);">' + p.target_score + '</td>' +
        '<td style="padding:10px 16px;text-align:center;">' +
          '<button class="btn btn-secondary" style="font-size:12px;padding:4px 10px;" onclick="openEditKpi(\'' + p.id + '\', ' + p.target_score + ')">Змінити</button>' +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table></div></div>';
  }

  container.innerHTML = html || '<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">Немає даних</div></div>';
}

// === СТВОРЕННЯ KPI ===
function openCreateKpi() {
  var modal = document.getElementById('kpi-modal');
  var content = document.getElementById('kpi-modal-content');
  modal.style.display = 'block';

  var now = new Date();
  var yearStart = now.getFullYear() + '-09-01';
  var yearEnd = (now.getFullYear() + 1) + '-06-30';
  if (now.getMonth() < 8) {
    yearStart = (now.getFullYear() - 1) + '-09-01';
    yearEnd = now.getFullYear() + '-06-30';
  }

  var deptOptions = '';
  deptOptions += '<option value="__all__">Всі факультети (однаковий KPI)</option>';
  kpiFaculties.forEach(function(f) {
    deptOptions += '<option value="' + f.id + '">' + f.short_name + ' — ' + f.name + '</option>';
  });

  content.innerHTML = '<h3 style="font-size:18px;margin-bottom:20px;">Встановити KPI</h3>' +
    '<div class="form-group">' +
      '<label class="form-label">Підрозділ</label>' +
      '<select class="form-input" id="kpi-dept">' + deptOptions + '</select>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="form-group">' +
        '<label class="form-label">Початок періоду</label>' +
        '<input class="form-input" type="date" id="kpi-start" value="' + yearStart + '">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Кінець періоду</label>' +
        '<input class="form-input" type="date" id="kpi-end" value="' + yearEnd + '">' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">Цільовий бал</label>' +
      '<input class="form-input" type="number" id="kpi-target" placeholder="Наприклад: 500" min="0" step="10">' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="saveKpi()">Зберегти</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="closeKpiModal()">Скасувати</button>' +
    '</div>';
}

async function saveKpi() {
  var deptId = document.getElementById('kpi-dept').value;
  var start = document.getElementById('kpi-start').value;
  var end = document.getElementById('kpi-end').value;
  var target = parseFloat(document.getElementById('kpi-target').value);

  if (!start || !end || isNaN(target) || target <= 0) {
    alert('Заповніть всі поля. Цільовий бал має бути більше 0.');
    return;
  }

  var departments = [];
  if (deptId === '__all__') {
    departments = kpiFaculties.map(function(f) { return f.id; });
  } else {
    departments = [deptId];
  }

  for (var i = 0; i < departments.length; i++) {
    // Upsert: якщо є план на цей період — оновити
    var existing = await db.from('kpi_plans').select('id')
      .eq('department_id', departments[i]).eq('period_start', start).eq('period_end', end);

    if (existing.data && existing.data.length > 0) {
      await db.from('kpi_plans').update({ target_score: target, updated_at: new Date().toISOString() }).eq('id', existing.data[0].id);
    } else {
      await db.from('kpi_plans').insert({
        department_id: departments[i], period_start: start, period_end: end,
        target_score: target, created_by: currentUser.id
      });
    }
  }

  closeKpiModal();
  loadKpiList(currentUser);
}

async function openEditKpi(kpiId, currentTarget) {
  var newTarget = prompt('Новий цільовий бал (зараз: ' + currentTarget + '):', currentTarget);
  if (newTarget === null) return;
  newTarget = parseFloat(newTarget);
  if (isNaN(newTarget) || newTarget <= 0) { alert('Некоректне значення'); return; }

  await db.from('kpi_plans').update({ target_score: newTarget, updated_at: new Date().toISOString() }).eq('id', kpiId);
  loadKpiList(currentUser);
}

function closeKpiModal() {
  document.getElementById('kpi-modal').style.display = 'none';
}

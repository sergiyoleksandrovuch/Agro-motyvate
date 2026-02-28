// pages/dashboard.js — Головна сторінка (оновлена, Фаза 2)

registerPage('dashboard', {
  render: function(user) {
    var name = user.full_name.split(' ')[0];
    var dept = user.departments ? user.departments.short_name : '';

    return '<div style="max-width:900px;">' +

      // Вітання
      '<div style="background:linear-gradient(135deg,#F0AA33,#E09418,#CC8410);border-radius:20px;padding:28px 32px;color:#fff;margin-bottom:24px;position:relative;overflow:hidden;">' +
        '<div style="position:absolute;top:-50%;right:-8%;width:260px;height:260px;background:rgba(255,255,255,0.07);border-radius:50%;"></div>' +
        '<h2 style="color:#fff;font-size:22px;font-weight:800;margin-bottom:4px;">Вітаємо, ' + name + '! 👋</h2>' +
        '<p style="opacity:0.88;font-size:14px;">Ви увійшли як ' + ROLE_LABELS[user.role] + (dept ? ' · ' + dept : '') + '</p>' +
      '</div>' +

      // Статистика
      '<div id="dash-stats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:24px;"></div>' +

      // Швидкі дії
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:24px;">' +
        '<button class="btn btn-primary btn-lg" onclick="navigateTo(\'new-activity\')" style="padding:16px;flex-direction:column;gap:4px;">' +
          '<span style="font-size:22px;">➕</span>' +
          '<span style="font-size:13px;">Новий захід</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-lg" onclick="navigateTo(\'activities\')" style="padding:16px;flex-direction:column;gap:4px;">' +
          '<span style="font-size:22px;">📋</span>' +
          '<span style="font-size:13px;">Мої заходи</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-lg" onclick="navigateTo(\'smm\')" style="padding:16px;flex-direction:column;gap:4px;">' +
          '<span style="font-size:22px;">📱</span>' +
          '<span style="font-size:13px;">SMM</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-lg" onclick="navigateTo(\'other-metrics\')" style="padding:16px;flex-direction:column;gap:4px;">' +
          '<span style="font-size:22px;">📊</span>' +
          '<span style="font-size:13px;">Інші показники</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-lg" onclick="navigateTo(\'ranking\')" style="padding:16px;flex-direction:column;gap:4px;">' +
          '<span style="font-size:22px;">🏆</span>' +
          '<span style="font-size:13px;">Рейтинг</span>' +
        '</button>' +
      '</div>' +

      // Останні заходи
      '<div id="dash-recent"></div>' +

    '</div>';
  },

  init: async function(user) {
    await loadDashStats(user);
    await loadDashRecent(user);
  }
});

async function loadDashStats(user) {
  var container = document.getElementById('dash-stats');
  if (!container) return;

  // Заходи підрозділу
  var actResult = await db
    .from('activities')
    .select('status, preliminary_score, final_score')
    .eq('department_id', user.department_id);

  var activities = actResult.data || [];
  var totalActivities = activities.length;
  var verified = activities.filter(function(a) { return a.status === 'verified'; });
  var totalScore = 0;
  verified.forEach(function(a) {
    totalScore += parseFloat(a.final_score || a.preliminary_score || 0);
  });
  totalScore = Math.round(totalScore * 10) / 10;

  var pending = activities.filter(function(a) { return a.status === 'submitted'; }).length;

  // SMM бали
  var smmScore = 0;
  try {
    var profResult = await db
      .from('smm_profiles')
      .select('id, platform')
      .eq('department_id', user.department_id);

    var profiles = profResult.data || [];
    if (profiles.length > 0) {
      var profileIds = profiles.map(function(p) { return p.id; });
      var metrResult = await db
        .from('smm_metrics')
        .select('profile_id, score')
        .in('profile_id', profileIds)
        .order('report_date', { ascending: false });

      var seen = {};
      (metrResult.data || []).forEach(function(m) {
        if (!seen[m.profile_id]) {
          smmScore += parseFloat(m.score || 0);
          seen[m.profile_id] = true;
        }
      });
    }
  } catch(e) { /* таблиці ще не створені */ }
  smmScore = Math.round(smmScore * 10) / 10;

  // Інші показники
  var omScore = 0;
  try {
    var omResult = await db
      .from('other_metrics')
      .select('score')
      .eq('department_id', user.department_id)
      .eq('status', 'verified');

    (omResult.data || []).forEach(function(o) {
      omScore += parseFloat(o.score || 0);
    });
  } catch(e) { /* таблиці ще не створені */ }
  omScore = Math.round(omScore * 10) / 10;

  var grandTotal = Math.round((totalScore + smmScore + omScore) * 10) / 10;

  container.innerHTML =
    statCard('Загальний бал', grandTotal, 'var(--accent-deep)', '🏅') +
    statCard('Заходи', verified.length + ' / ' + totalActivities, 'var(--green)', '📋') +
    statCard('SMM бали', smmScore, '#E1306C', '📱') +
    statCard('Інші показники', omScore, 'var(--blue)', '📊') +
    (pending > 0 ? statCard('На перевірці', pending, 'var(--accent)', '⏳') : '');
}

function statCard(label, value, color, icon) {
  return '<div class="card">' +
    '<div class="card-body" style="padding:16px;text-align:center;">' +
      '<div style="font-size:22px;margin-bottom:4px;">' + icon + '</div>' +
      '<div style="font-family:\'Plus Jakarta Sans\';font-weight:800;font-size:22px;color:' + color + ';">' + value + '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + label + '</div>' +
    '</div>' +
  '</div>';
}

async function loadDashRecent(user) {
  var container = document.getElementById('dash-recent');
  if (!container) return;

  var result = await db
    .from('activities')
    .select('*, activity_types(name), institutions(name)')
    .eq('department_id', user.department_id)
    .order('created_at', { ascending: false })
    .limit(5);

  var items = result.data || [];

  if (items.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:32px;">' +
      '<p style="font-size:36px;margin-bottom:8px;">🚀</p>' +
      '<p style="color:var(--text-muted);font-size:14px;">Почніть додавати заходи — тут з\'явиться ваша активність</p>' +
    '</div></div>';
    return;
  }

  var html = '<h3 style="font-size:16px;margin-bottom:12px;">Останні заходи</h3>';
  var statusLabels = { draft: 'Чернетка', submitted: 'На перевірці', verified: 'Підтверджено', rejected: 'Відхилено' };

  items.forEach(function(item) {
    var typeName = item.activity_types ? item.activity_types.name : (item.custom_activity_name || '—');
    var instName = item.institutions ? item.institutions.name : (item.custom_institution_name || '');
    var score = item.status === 'verified' ? (item.final_score || item.preliminary_score) : item.preliminary_score;

    html += '<div class="card" style="margin-bottom:8px;">' +
      '<div class="card-body" style="padding:12px 16px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + typeName + '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">' + (instName ? instName + ' · ' : '') + (item.event_date || '') + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">' +
            '<span style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:14px;color:var(--accent-deep);">' + (score || 0) + '</span>' +
            '<span class="badge badge-' + item.status + '" style="font-size:11px;">' + (statusLabels[item.status] || '') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

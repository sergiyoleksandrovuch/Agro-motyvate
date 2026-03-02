// pages/dashboard.js — Розширений аналітичний дашборд

var dashCharts = {};

registerPage('dashboard', {
  render: function(user) {
    var name = user.full_name.split(' ')[0];
    var dept = user.departments ? user.departments.short_name : '';
    var isAdmin = user.role === 'admin' || user.role === 'rectorate';

    return '<div style="max-width:1100px;">' +

      // Вітання
      '<div style="background:linear-gradient(135deg,#F0AA33,#E09418,#CC8410);border-radius:20px;padding:28px 32px;color:#fff;margin-bottom:24px;position:relative;overflow:hidden;">' +
        '<div style="position:absolute;top:-50%;right:-8%;width:260px;height:260px;background:rgba(255,255,255,0.07);border-radius:50%;"></div>' +
        '<h2 style="color:#fff;font-size:22px;font-weight:800;margin-bottom:4px;">Вітаємо, ' + name + '!</h2>' +
        '<p style="opacity:0.88;font-size:14px;">Ви увійшли як ' + ROLE_LABELS[user.role] + (dept ? ' · ' + dept : '') + '</p>' +
      '</div>' +

      // KPI-картки
      '<div id="dash-stats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:24px;"></div>' +

      // Швидкі дії
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:28px;">' +
        quickAction('new-activity', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', 'Новий захід', true) +
        quickAction('activities', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', 'Мої заходи', false) +
        quickAction('smm', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>', 'SMM', false) +
        quickAction('other-metrics', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', 'Показники', false) +
        quickAction('ranking', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', 'Рейтинг', false) +
      '</div>' +

      // Рядок 1: Активність по місяцях + Павукоподібна діаграма
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;" class="dash-grid-2">' +
        chartCard('Динаміка активності по місяцях', 'chart-monthly', 240) +
        chartCard('Профіль активності підрозділу', 'chart-radar', 240) +
      '</div>' +

      // Рядок 2: Розподіл по типах + Рейтинг факультетів
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;" class="dash-grid-2">' +
        chartCard('Розподіл по типах заходів', 'chart-types', 240) +
        '<div class="card"><div class="card-body" style="padding:16px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<div style="font-weight:600;font-size:14px;">Рейтинг факультетів</div>' +
            '<a style="font-size:12px;cursor:pointer;color:var(--accent);" onclick="navigateTo(\'ranking\')">Детальніше →</a>' +
          '</div>' +
          '<div style="position:relative;height:240px;width:100%;"><canvas id="chart-ranking"></canvas></div>' +
        '</div></div>' +
      '</div>' +

      // Рядок 3: Топ-співробітники + Статуси заходів (для адміна)
      (isAdmin ?
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;" class="dash-grid-2">' +
          '<div class="card"><div class="card-body" style="padding:16px;">' +
            '<div style="font-weight:600;font-size:14px;margin-bottom:12px;">Найактивніші співробітники</div>' +
            '<div id="dash-top-users" style="min-height:200px;">Завантаження...</div>' +
          '</div></div>' +
          chartCard('Статуси заходів (всі підрозділи)', 'chart-statuses', 220) +
        '</div>'
      :
        '<div style="display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:16px;">' +
          '<div class="card"><div class="card-body" style="padding:16px;">' +
            '<div style="font-weight:600;font-size:14px;margin-bottom:12px;">Найактивніші співробітники підрозділу</div>' +
            '<div id="dash-top-users" style="min-height:180px;">Завантаження...</div>' +
          '</div></div>' +
        '</div>'
      ) +

      // Рядок 4: Порівняння факультетів (павук) — тільки для адмінів
      (isAdmin ?
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;" class="dash-grid-2">' +
          chartCard('Порівняння факультетів (профілі)', 'chart-faculty-radar', 280) +
          chartCard('Продуктивність: заходи на співробітника', 'chart-efficiency', 280) +
        '</div>'
      : '') +

      // Новини (останні)
      '<div id="dash-news"></div>' +

      // Бейджі
      '<div id="dash-badges"></div>' +

      // Останні заходи
      '<div id="dash-recent"></div>' +

    '</div>' +

    '<style>' +
      '@media(max-width:768px){.dash-grid-2{grid-template-columns:1fr !important;}}' +
    '</style>';
  },

  init: async function(user) {
    Object.keys(dashCharts).forEach(function(k) {
      if (dashCharts[k]) { dashCharts[k].destroy(); dashCharts[k] = null; }
    });
    dashCharts = {};

    await loadDashStats(user);
    setTimeout(async function() {
      await loadAllCharts(user);
      await loadTopUsers(user);
      await loadDashNews();
      await loadDashBadges(user);
      await loadDashRecent(user);
    }, 150);
  }
});

function chartCard(title, canvasId, height) {
  return '<div class="card"><div class="card-body" style="padding:16px;">' +
    '<div style="font-weight:600;font-size:14px;margin-bottom:12px;">' + title + '</div>' +
    '<div style="position:relative;height:' + height + 'px;width:100%;"><canvas id="' + canvasId + '"></canvas></div>' +
  '</div></div>';
}

function quickAction(page, icon, label, primary) {
  var cls = primary ? 'btn btn-primary btn-lg' : 'btn btn-secondary btn-lg';
  return '<button class="' + cls + '" onclick="navigateTo(\'' + page + '\')" style="padding:14px 8px;flex-direction:column;gap:6px;">' +
    '<span style="opacity:0.85;">' + icon + '</span>' +
    '<span style="font-size:12px;">' + label + '</span>' +
  '</button>';
}

// ===================== KPI КАРТКИ =====================

async function loadDashStats(user) {
  var container = document.getElementById('dash-stats');
  if (!container) return;

  var actResult = await db.from('activities').select('status, preliminary_score, final_score').eq('department_id', user.department_id);
  var activities = actResult.data || [];
  var verified = activities.filter(function(a) { return a.status === 'verified'; });
  var totalScore = 0;
  verified.forEach(function(a) { totalScore += parseFloat(a.final_score || a.preliminary_score || 0); });
  totalScore = Math.round(totalScore * 10) / 10;
  var pending = activities.filter(function(a) { return a.status === 'submitted'; }).length;

  var smmScore = 0;
  try {
    var profResult = await db.from('smm_profiles').select('id').eq('department_id', user.department_id);
    if (profResult.data && profResult.data.length > 0) {
      var pIds = profResult.data.map(function(p) { return p.id; });
      var metrResult = await db.from('smm_metrics').select('profile_id, score').in('profile_id', pIds).order('report_date', { ascending: false });
      var seen = {};
      (metrResult.data || []).forEach(function(m) { if (!seen[m.profile_id]) { smmScore += parseFloat(m.score || 0); seen[m.profile_id] = true; } });
    }
  } catch(e) {}

  var omScore = 0;
  try {
    var omResult = await db.from('other_metrics').select('score').eq('department_id', user.department_id).eq('status', 'verified');
    (omResult.data || []).forEach(function(o) { omScore += parseFloat(o.score || 0); });
  } catch(e) {}

  smmScore = Math.round(smmScore * 10) / 10;
  omScore = Math.round(omScore * 10) / 10;
  var grandTotal = Math.round((totalScore + smmScore + omScore) * 10) / 10;

  container.innerHTML =
    statCard('Загальний бал', grandTotal, 'var(--accent-deep)') +
    statCard('Заходів проведено', activities.length, 'var(--green)') +
    statCard('Верифіковано', verified.length, '#049249') +
    statCard('SMM бали', smmScore, '#E1306C') +
    statCard('Інші показники', omScore, 'var(--blue)') +
    (pending > 0 ? statCard('На перевірці', pending, 'var(--accent)') : '');
}

function statCard(label, value, color) {
  return '<div class="card"><div class="card-body" style="padding:14px;text-align:center;">' +
    '<div style="font-family:\'Plus Jakarta Sans\';font-weight:800;font-size:22px;color:' + color + ';">' + value + '</div>' +
    '<div style="font-size:11px;color:var(--text-muted);margin-top:3px;">' + label + '</div>' +
  '</div></div>';
}

// ===================== ВСІ ГРАФІКИ =====================

var FCOLORS = { 'ФОіФ': '#F0AA33', 'ФМіМ': '#6B2FA4', 'АФ': '#1B8C4E', 'ІТФ': '#A0673C', 'ФВМ': '#2B62A0', 'БФ': '#B82025', 'ФВІіЕ': '#1A9EBF' };
var PALETTE = ['#F0AA33', '#6B2FA4', '#1B8C4E', '#A0673C', '#2B62A0', '#B82025', '#1A9EBF', '#049249', '#E1306C', '#939A9D'];

async function loadAllCharts(user) {
  var isAdmin = user.role === 'admin' || user.role === 'rectorate';

  await renderMonthlyChart(user);
  await renderRadarChart(user);
  await renderTypesChart(user);
  await renderRankingChart();

  if (isAdmin) {
    await renderStatusesChart();
    await renderFacultyRadar();
    await renderEfficiencyChart();
  }
}

// --- 1. Динаміка по місяцях ---
async function renderMonthlyChart(user) {
  var canvas = document.getElementById('chart-monthly');
  if (!canvas) return;

  var result = await db.from('activities')
    .select('event_date, preliminary_score, final_score, status')
    .eq('department_id', user.department_id)
    .not('event_date', 'is', null);

  var items = result.data || [];
  var months = ['Вер', 'Жов', 'Лис', 'Гру', 'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'];
  var monthNums = ['09', '10', '11', '12', '01', '02', '03', '04', '05', '06'];
  var monthData = {};
  monthNums.forEach(function(m) { monthData[m] = { count: 0, score: 0 }; });

  items.forEach(function(a) {
    var m = a.event_date.substring(5, 7);
    if (monthData[m]) {
      monthData[m].count++;
      monthData[m].score += parseFloat(a.status === 'verified' ? (a.final_score || a.preliminary_score || 0) : (a.preliminary_score || 0));
    }
  });

  dashCharts.monthly = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Заходів', data: monthNums.map(function(m) { return monthData[m].count; }), backgroundColor: 'rgba(240,170,51,0.7)', borderRadius: 6, yAxisID: 'y' },
        { label: 'Балів', data: monthNums.map(function(m) { return Math.round(monthData[m].score * 10) / 10; }), type: 'line', borderColor: '#049249', backgroundColor: 'rgba(4,146,73,0.1)', fill: true, tension: 0.3, pointRadius: 3, yAxisID: 'y1' }
      ]
    },
    options: chartOpts({ y: { beginAtZero: true, position: 'left', grid: { display: false } }, y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } }, x: { grid: { display: false } } })
  });
}

// --- 2. Павукоподібна (Radar) — профіль підрозділу ---
async function renderRadarChart(user) {
  var canvas = document.getElementById('chart-radar');
  if (!canvas) return;

  var result = await db.from('activities')
    .select('activity_types(name, category)')
    .eq('department_id', user.department_id);

  var items = result.data || [];

  // Групуємо по категоріях
  var catLabels = { field_visit: 'Виїзні зустрічі', online: 'Онлайн', internal: 'Внутрішні', external_event: 'Зовнішні', memorandum: 'Меморандуми', other: 'Інше' };
  var catCounts = {};
  Object.keys(catLabels).forEach(function(k) { catCounts[k] = 0; });

  items.forEach(function(a) {
    var cat = (a.activity_types && a.activity_types.category) ? a.activity_types.category : 'other';
    if (!catCounts[cat] && catCounts[cat] !== 0) catCounts[cat] = 0;
    catCounts[cat]++;
  });

  // Тільки категорії з даними або базові
  var labels = [];
  var data = [];
  Object.keys(catLabels).forEach(function(k) {
    labels.push(catLabels[k]);
    data.push(catCounts[k] || 0);
  });

  dashCharts.radar = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Кількість заходів',
        data: data,
        backgroundColor: 'rgba(240,170,51,0.2)',
        borderColor: '#F0AA33',
        borderWidth: 2,
        pointBackgroundColor: '#F0AA33',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 10 }, backdropColor: 'transparent' },
          pointLabels: { font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.06)' },
          angleLines: { color: 'rgba(0,0,0,0.06)' }
        }
      }
    }
  });
}

// --- 3. Doughnut — розподіл по типах ---
async function renderTypesChart(user) {
  var canvas = document.getElementById('chart-types');
  if (!canvas) return;

  var result = await db.from('activities').select('activity_types(name)').eq('department_id', user.department_id);
  var items = result.data || [];
  var typeCounts = {};
  items.forEach(function(a) {
    var name = a.activity_types ? a.activity_types.name : 'Інше';
    if (name.length > 22) name = name.substring(0, 20) + '..';
    typeCounts[name] = (typeCounts[name] || 0) + 1;
  });

  var labels = Object.keys(typeCounts);
  var data = labels.map(function(l) { return typeCounts[l]; });
  if (!labels.length) { labels = ['Немає даних']; data = [1]; }

  dashCharts.types = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: data, backgroundColor: PALETTE.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 6 } } } }
  });
}

// --- 4. Рейтинг факультетів (горизонтальний bar) ---
async function renderRankingChart() {
  var canvas = document.getElementById('chart-ranking');
  if (!canvas) return;

  var facData = await getFacultyScores();

  dashCharts.ranking = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: facData.map(function(f) { return f.short_name; }),
      datasets: [{ data: facData.map(function(f) { return f.score; }), backgroundColor: facData.map(function(f) { return FCOLORS[f.short_name] || '#939A9D'; }), borderRadius: 8, barThickness: 26 }]
    },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return ctx.parsed.x + ' балів'; } } } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' } } } } }
  });
}

// --- 5. Статуси заходів (Polar Area) — тільки адмін ---
async function renderStatusesChart() {
  var canvas = document.getElementById('chart-statuses');
  if (!canvas) return;

  var result = await db.from('activities').select('status');
  var items = result.data || [];
  var statusCounts = { draft: 0, submitted: 0, verified: 0, rejected: 0 };
  items.forEach(function(a) { if (statusCounts[a.status] !== undefined) statusCounts[a.status]++; });

  dashCharts.statuses = new Chart(canvas, {
    type: 'polarArea',
    data: {
      labels: ['Чернетки', 'На перевірці', 'Підтверджені', 'Відхилені'],
      datasets: [{ data: [statusCounts.draft, statusCounts.submitted, statusCounts.verified, statusCounts.rejected], backgroundColor: ['rgba(147,154,157,0.6)', 'rgba(240,170,51,0.6)', 'rgba(4,146,73,0.6)', 'rgba(184,32,37,0.6)'], borderWidth: 1, borderColor: '#fff' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }, scales: { r: { ticks: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' } } } }
  });
}

// --- 6. Порівняння факультетів (Radar) — адмін ---
async function renderFacultyRadar() {
  var canvas = document.getElementById('chart-faculty-radar');
  if (!canvas) return;

  var facResult = await db.from('departments').select('id, short_name').eq('type', 'faculty').eq('is_active', true);
  var faculties = facResult.data || [];

  // Зібрати дані по категоріях для кожного факультету
  var actResult = await db.from('activities').select('department_id, activity_types(category), departments!inner(parent_id)').eq('status', 'verified');
  var activities = actResult.data || [];

  var catLabels = { field_visit: 'Виїзні', online: 'Онлайн', internal: 'Внутрішні', external_event: 'Зовнішні', other: 'Інше' };
  var catKeys = Object.keys(catLabels);

  var facCatData = {};
  faculties.forEach(function(f) {
    facCatData[f.id] = {};
    catKeys.forEach(function(c) { facCatData[f.id][c] = 0; });
  });

  activities.forEach(function(a) {
    var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
    var cat = (a.activity_types && a.activity_types.category) ? a.activity_types.category : 'other';
    if (!catKeys.includes(cat)) cat = 'other';
    if (facCatData[fId]) facCatData[fId][cat]++;
  });

  // Топ-4 факультети за загальною кількістю
  var facSorted = faculties.map(function(f) {
    var total = 0;
    catKeys.forEach(function(c) { total += facCatData[f.id][c]; });
    return { id: f.id, short_name: f.short_name, total: total };
  }).sort(function(a, b) { return b.total - a.total; }).slice(0, 4);

  var datasets = facSorted.map(function(f, i) {
    var color = FCOLORS[f.short_name] || PALETTE[i];
    return {
      label: f.short_name,
      data: catKeys.map(function(c) { return facCatData[f.id][c]; }),
      backgroundColor: color + '20',
      borderColor: color,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: color
    };
  });

  dashCharts.facultyRadar = new Chart(canvas, {
    type: 'radar',
    data: { labels: catKeys.map(function(k) { return catLabels[k]; }), datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
      scales: { r: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 9 }, backdropColor: 'transparent' }, pointLabels: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.06)' } } }
    }
  });
}

// --- 7. Ефективність: заходи на співробітника ---
async function renderEfficiencyChart() {
  var canvas = document.getElementById('chart-efficiency');
  if (!canvas) return;

  var facResult = await db.from('departments').select('id, short_name, staff_count').eq('type', 'faculty').eq('is_active', true);
  var faculties = facResult.data || [];

  var actResult = await db.from('activities').select('department_id, departments!inner(parent_id)').eq('status', 'verified');
  var activities = actResult.data || [];

  var facCounts = {};
  faculties.forEach(function(f) { facCounts[f.id] = 0; });
  activities.forEach(function(a) {
    var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
    if (facCounts[fId] !== undefined) facCounts[fId]++;
  });

  // Розрахувати ефективність
  var effData = faculties.map(function(f) {
    var staff = f.staff_count || 1;
    return { short_name: f.short_name, total: facCounts[f.id] || 0, perStaff: Math.round(((facCounts[f.id] || 0) / staff) * 100) / 100 };
  }).sort(function(a, b) { return b.perStaff - a.perStaff; });

  dashCharts.efficiency = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: effData.map(function(f) { return f.short_name; }),
      datasets: [
        { label: 'Заходів на 1 співробітника', data: effData.map(function(f) { return f.perStaff; }), backgroundColor: effData.map(function(f) { return FCOLORS[f.short_name] || '#939A9D'; }), borderRadius: 6, order: 1 },
        { label: 'Загалом заходів', data: effData.map(function(f) { return f.total; }), type: 'line', borderColor: '#049249', backgroundColor: 'transparent', pointRadius: 4, pointBackgroundColor: '#049249', borderWidth: 2, order: 0 }
      ]
    },
    options: chartOpts({ y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } })
  });
}

// --- Топ-співробітники ---
async function loadTopUsers(user) {
  var container = document.getElementById('dash-top-users');
  if (!container) return;

  var isAdmin = user.role === 'admin' || user.role === 'rectorate';

  var query = db.from('activities')
    .select('created_by, preliminary_score, final_score, profiles!activities_created_by_fkey(full_name, departments(short_name))')
    .eq('status', 'verified');

  if (!isAdmin) {
    query = query.eq('department_id', user.department_id);
  }

  var result = await query;
  var items = result.data || [];

  var userScores = {};
  items.forEach(function(a) {
    var uid = a.created_by;
    if (!uid) return;
    if (!userScores[uid]) {
      var p = a.profiles || {};
      var dept = p.departments ? p.departments.short_name : '';
      userScores[uid] = { name: p.full_name || 'Невідомий', dept: dept, score: 0, count: 0 };
    }
    userScores[uid].score += parseFloat(a.final_score || a.preliminary_score || 0);
    userScores[uid].count++;
  });

  var sorted = Object.values(userScores).sort(function(a, b) { return b.score - a.score; }).slice(0, 7);

  if (sorted.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">Поки немає даних</div>';
    return;
  }

  var maxScore = sorted[0].score || 1;
  var medals = ['🥇', '🥈', '🥉'];

  var html = '';
  sorted.forEach(function(u, i) {
    var pct = Math.round((u.score / maxScore) * 100);
    var barColor = i < 3 ? PALETTE[i] : '#939A9D';
    var medal = i < 3 ? '<span style="font-size:16px;margin-right:4px;">' + medals[i] + '</span>' : '<span style="display:inline-block;width:24px;text-align:center;color:var(--text-muted);font-size:12px;">' + (i + 1) + '.</span>';

    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
      medal +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:2px;">' +
          '<span style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + u.name + '</span>' +
          '<span style="font-size:12px;color:var(--text-muted);flex-shrink:0;margin-left:8px;">' + (isAdmin && u.dept ? u.dept + ' · ' : '') + u.count + ' заходів</span>' +
        '</div>' +
        '<div style="height:6px;background:var(--bg-warm);border-radius:3px;overflow:hidden;">' +
          '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:3px;transition:width 0.6s;"></div>' +
        '</div>' +
      '</div>' +
      '<span style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:13px;color:var(--accent-deep);min-width:40px;text-align:right;">' + Math.round(u.score * 10) / 10 + '</span>' +
    '</div>';
  });

  container.innerHTML = html;
}

// --- Допоміжні функції ---

function chartOpts(scales) {
  var opts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
    scales: {}
  };
  Object.keys(scales).forEach(function(k) {
    opts.scales[k] = Object.assign({ ticks: { font: { size: 10 } } }, scales[k]);
  });
  return opts;
}

async function getFacultyScores() {
  var facResult = await db.from('departments').select('id, short_name').eq('type', 'faculty').eq('is_active', true);
  var faculties = facResult.data || [];

  var actResult = await db.from('activities').select('department_id, final_score, preliminary_score, departments!inner(parent_id)').eq('status', 'verified');
  var activities = actResult.data || [];

  var scores = {};
  faculties.forEach(function(f) { scores[f.id] = 0; });
  activities.forEach(function(a) {
    var s = parseFloat(a.final_score || a.preliminary_score || 0);
    var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
    if (scores[fId] !== undefined) scores[fId] += s;
  });

  return faculties.map(function(f) {
    return { id: f.id, short_name: f.short_name, score: Math.round((scores[f.id] || 0) * 10) / 10 };
  }).sort(function(a, b) { return b.score - a.score; });
}

// --- Бейджі на дашборді ---
async function loadDashBadges(user) {
  var container = document.getElementById('dash-badges');
  if (!container) return;

  try {
    var defResult = await db.from('badge_definitions').select('id, name, icon, color').eq('is_active', true).order('sort_order');
    var defs = defResult.data || [];

    var earnedResult = await db.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id).order('earned_at', { ascending: false });
    var earned = earnedResult.data || [];
    var earnedIds = earned.map(function(e) { return e.badge_id; });

    var earnedCount = earned.length;
    var totalCount = defs.length;

    if (totalCount === 0) { container.innerHTML = ''; return; }

    var html = '<div style="font-weight:600;font-size:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">' +
      '<span>Досягнення (' + earnedCount + '/' + totalCount + ')</span>' +
      '<a style="font-size:12px;cursor:pointer;color:var(--accent);" onclick="navigateTo(\'badges\')">Всі досягнення &rarr;</a>' +
    '</div>';

    html += '<div class="card"><div class="card-body" style="padding:16px;">' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">';

    defs.forEach(function(d) {
      var isEarned = earnedIds.indexOf(d.id) >= 0;
      html += '<div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;' +
        (isEarned ? 'background:' + d.color + '15;border:1px solid ' + d.color + '30;' : 'background:var(--bg-warm);filter:grayscale(1);opacity:0.3;') +
        '" title="' + d.name + '">' + d.icon + '</div>';
    });

    html += '</div></div></div>';
    container.innerHTML = html;

    // Автоперевірка бейджів при кожному відкритті дашборду
    if (typeof checkAndAwardBadges === 'function') {
      checkAndAwardBadges(user.id);
    }
  } catch(e) {
    container.innerHTML = '';
  }
}

// --- Новини на дашборді ---
async function loadDashNews() {
  var container = document.getElementById('dash-news');
  if (!container) return;

  try {
    var result = await db.from('news').select('id, title, content, published_at')
      .eq('is_published', true).order('published_at', { ascending: false }).limit(3);

    var items = result.data || [];
    if (items.length === 0) { container.innerHTML = ''; return; }

    var html = '<div style="font-weight:600;font-size:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">' +
      '<span>Новини</span>' +
      '<a style="font-size:12px;cursor:pointer;color:var(--accent);" onclick="navigateTo(\'news\')">Всі новини →</a>' +
    '</div>';

    items.forEach(function(n) {
      var date = n.published_at ? new Date(n.published_at).toLocaleDateString('uk-UA') : '';
      var preview = n.content.length > 120 ? n.content.substring(0, 120) + '...' : n.content;

      html += '<div class="card" style="margin-bottom:8px;border-left:3px solid var(--accent);"><div class="card-body" style="padding:12px 16px;">' +
        '<div style="font-weight:600;font-size:14px;margin-bottom:4px;">' + n.title + '</div>' +
        '<div style="font-size:13px;color:var(--text-secondary);line-height:1.4;">' + preview + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">' + date + '</div>' +
      '</div></div>';
    });

    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '';
  }
}

// --- Останні заходи ---
async function loadDashRecent(user) {
  var container = document.getElementById('dash-recent');
  if (!container) return;

  var result = await db.from('activities')
    .select('*, activity_types(name), institutions(name)')
    .eq('department_id', user.department_id)
    .order('created_at', { ascending: false }).limit(5);

  var items = result.data || [];
  var statusLabels = { draft: 'Чернетка', submitted: 'На перевірці', verified: 'Підтверджено', rejected: 'Відхилено' };

  if (items.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">Почніть додавати заходи</div></div>';
    return;
  }

  var html = '<div style="font-weight:600;font-size:14px;margin-bottom:10px;">Останні заходи</div>';
  items.forEach(function(item) {
    var typeName = item.activity_types ? item.activity_types.name : (item.custom_activity_name || '—');
    var instName = item.institutions ? item.institutions.name : (item.custom_institution_name || '');
    var score = item.status === 'verified' ? (item.final_score || item.preliminary_score) : item.preliminary_score;

    html += '<div class="card" style="margin-bottom:6px;"><div class="card-body" style="padding:10px 14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + typeName + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">' + (instName ? instName + ' · ' : '') + (item.event_date || '') + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
          '<span style="font-weight:700;font-size:13px;color:var(--accent-deep);">' + (score || 0) + '</span>' +
          '<span class="badge badge-' + item.status + '" style="font-size:10px;">' + (statusLabels[item.status] || '') + '</span>' +
        '</div>' +
      '</div>' +
    '</div></div>';
  });

  container.innerHTML = html;
}

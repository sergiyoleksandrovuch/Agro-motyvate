// pages/ranking.js — Рейтинг факультетів

var FACULTY_COLORS = {
  'ФОіФ': '#F0AA33',
  'ФМіМ': '#6B2FA4',
  'АФ': '#1B8C4E',
  'ІТФ': '#A0673C',
  'ФВМ': '#2B62A0',
  'БФ': '#B82025',
  'ФВІіЕ': '#1A9EBF'
};

registerPage('ranking', {
  render: function(user) {
    return '' +
      '<div style="max-width:900px;">' +
        '<div style="margin-bottom:20px;">' +
          '<h2 style="font-size:20px;">Рейтинг факультетів</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">За верифікованими заходами</p>' +
        '</div>' +
        '<div id="ranking-content">Завантаження...</div>' +
      '</div>';
  },

  init: async function(user) {
    await loadRanking();
  }
});

async function loadRanking() {
  var container = document.getElementById('ranking-content');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  // Отримати всі факультети
  var facResult = await db
    .from('departments')
    .select('id, name, short_name, staff_count')
    .eq('type', 'faculty')
    .eq('is_active', true)
    .order('name');

  if (facResult.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка: ' + facResult.error.message + '</div>';
    return;
  }

  var faculties = facResult.data || [];

  // Отримати верифіковані заходи з балами
  var actResult = await db
    .from('activities')
    .select('department_id, final_score, preliminary_score, departments!inner(parent_id)')
    .eq('status', 'verified');

  var activities = actResult.data || [];

  // Порахувати бали по факультетах
  // Заходи можуть бути від кафедр (department_id = кафедра), треба зібрати по parent_id (факультет)
  var facultyScores = {};
  var facultyActivityCounts = {};

  faculties.forEach(function(f) {
    facultyScores[f.id] = 0;
    facultyActivityCounts[f.id] = 0;
  });

  activities.forEach(function(a) {
    var score = a.final_score || a.preliminary_score || 0;
    var deptId = a.department_id;
    var parentId = a.departments ? a.departments.parent_id : null;

    // Якщо захід від кафедри — бал йде факультету (parent_id)
    var facultyId = parentId || deptId;

    if (facultyScores[facultyId] !== undefined) {
      facultyScores[facultyId] += parseFloat(score);
      facultyActivityCounts[facultyId]++;
    }
  });

  // Сортувати за балами
  faculties.sort(function(a, b) {
    return (facultyScores[b.id] || 0) - (facultyScores[a.id] || 0);
  });

  var maxScore = faculties.length > 0 ? (facultyScores[faculties[0].id] || 1) : 1;
  if (maxScore === 0) maxScore = 1;

  var html = '';

  // Топ-3 подіум
  if (faculties.length >= 3) {
    html += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:12px;margin-bottom:32px;padding:20px 0;">';

    // 2 місце
    html += rankPodium(faculties[1], 2, facultyScores[faculties[1].id], facultyActivityCounts[faculties[1].id], '100px');
    // 1 місце
    html += rankPodium(faculties[0], 1, facultyScores[faculties[0].id], facultyActivityCounts[faculties[0].id], '130px');
    // 3 місце
    html += rankPodium(faculties[2], 3, facultyScores[faculties[2].id], facultyActivityCounts[faculties[2].id], '80px');

    html += '</div>';
  }

  // Повна таблиця
  html += '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
      '<thead><tr style="border-bottom:2px solid var(--border);">' +
        '<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;text-transform:uppercase;">#</th>' +
        '<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Факультет</th>' +
        '<th style="padding:12px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Заходів</th>' +
        '<th style="padding:12px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Бали</th>' +
        '<th style="padding:12px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:12px;text-transform:uppercase;min-width:200px;"></th>' +
      '</tr></thead><tbody>';

  faculties.forEach(function(f, i) {
    var score = Math.round((facultyScores[f.id] || 0) * 10) / 10;
    var count = facultyActivityCounts[f.id] || 0;
    var color = FACULTY_COLORS[f.short_name] || 'var(--accent)';
    var barWidth = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    html += '<tr style="border-bottom:1px solid var(--border-light);">' +
      '<td style="padding:12px 16px;font-weight:700;color:var(--text-muted);">' + (i + 1) + '</td>' +
      '<td style="padding:12px 16px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:10px;height:10px;border-radius:3px;background:' + color + ';flex-shrink:0;"></div>' +
          '<div>' +
            '<div style="font-weight:600;">' + f.short_name + '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">' + f.name + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' + count + '</td>' +
      '<td style="padding:12px 16px;text-align:right;font-family:\'Plus Jakarta Sans\';font-weight:700;color:' + color + ';">' + score + '</td>' +
      '<td style="padding:12px 16px;">' +
        '<div style="height:8px;background:var(--border-light);border-radius:4px;overflow:hidden;">' +
          '<div style="height:100%;width:' + barWidth + '%;background:' + color + ';border-radius:4px;transition:width 0.5s;"></div>' +
        '</div>' +
      '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div></div>';

  container.innerHTML = html;
}

function rankPodium(faculty, place, score, count, height) {
  var color = FACULTY_COLORS[faculty.short_name] || 'var(--accent)';
  var medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  score = Math.round((score || 0) * 10) / 10;

  return '<div style="text-align:center;flex:1;max-width:160px;">' +
    '<div style="font-size:28px;margin-bottom:4px;">' + medals[place] + '</div>' +
    '<div style="font-weight:700;font-size:15px;margin-bottom:2px;">' + faculty.short_name + '</div>' +
    '<div style="font-family:\'Plus Jakarta Sans\';font-weight:800;font-size:20px;color:' + color + ';">' + score + '</div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">' + (count || 0) + ' заходів</div>' +
    '<div style="height:' + height + ';background:linear-gradient(180deg,' + color + ',' + color + 'CC);border-radius:12px 12px 0 0;"></div>' +
  '</div>';
}

// pages/ranking.js — Рейтинг факультетів з нормалізацією

var FACULTY_COLORS = {
  'ФОіФ': '#F0AA33', 'ФМіМ': '#6B2FA4', 'АФ': '#1B8C4E',
  'ІТФ': '#A0673C', 'ФВМ': '#2B62A0', 'БФ': '#B82025', 'ФВІіЕ': '#1A9EBF'
};

var rankingMode = 'absolute'; // absolute | normalized

registerPage('ranking', {
  render: function(user) {
    return '<div style="max-width:900px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h2 style="font-size:20px;">Рейтинг факультетів</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">За верифікованими заходами</p>' +
        '</div>' +
        '<div style="display:flex;gap:4px;background:var(--bg-warm);border-radius:10px;padding:3px;" id="ranking-mode-toggle">' +
          '<button class="btn btn-secondary filter-active" onclick="setRankingMode(\'absolute\',this)" style="font-size:13px;padding:6px 14px;border-radius:8px;">Абсолютний</button>' +
          '<button class="btn btn-secondary" onclick="setRankingMode(\'normalized\',this)" style="font-size:13px;padding:6px 14px;border-radius:8px;">На 1 співробітника</button>' +
        '</div>' +
      '</div>' +
      '<div id="ranking-content">Завантаження...</div>' +
    '</div>';
  },

  init: async function(user) {
    rankingMode = 'absolute';
    await loadRanking();
  }
});

function setRankingMode(mode, btn) {
  rankingMode = mode;
  document.querySelectorAll('#ranking-mode-toggle button').forEach(function(b) { b.classList.remove('filter-active'); });
  btn.classList.add('filter-active');
  loadRanking();
}

var rankingData = null;

async function loadRanking() {
  var container = document.getElementById('ranking-content');
  if (!container) return;

  // Кешуємо дані
  if (!rankingData) {
    container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

    var facResult = await db.from('departments').select('id, name, short_name, staff_count')
      .eq('type', 'faculty').eq('is_active', true).order('name');
    var faculties = facResult.data || [];

    var actResult = await db.from('activities')
      .select('department_id, final_score, preliminary_score, participants_count, paper_forms_count, electronic_forms_count, departments!inner(parent_id)')
      .eq('status', 'verified');
    var activities = actResult.data || [];

    var scores = {}, counts = {}, participants = {}, forms = {};
    faculties.forEach(function(f) { scores[f.id] = 0; counts[f.id] = 0; participants[f.id] = 0; forms[f.id] = 0; });

    activities.forEach(function(a) {
      var s = parseFloat(a.final_score || a.preliminary_score || 0);
      var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
      if (scores[fId] !== undefined) {
        scores[fId] += s;
        counts[fId]++;
        participants[fId] += (a.participants_count || 0);
        forms[fId] += (a.paper_forms_count || 0) + (a.electronic_forms_count || 0);
      }
    });

    rankingData = {
      faculties: faculties,
      scores: scores,
      counts: counts,
      participants: participants,
      forms: forms
    };
  }

  renderRanking(container);
}

function renderRanking(container) {
  var rd = rankingData;
  var isNorm = rankingMode === 'normalized';

  // Формуємо масив з сортуванням
  var items = rd.faculties.map(function(f) {
    var raw = Math.round((rd.scores[f.id] || 0) * 10) / 10;
    var staff = f.staff_count || 1;
    var norm = Math.round((raw / staff) * 100) / 100;
    return {
      id: f.id, name: f.name, short_name: f.short_name,
      score: raw, normalized: norm, staff: staff,
      count: rd.counts[f.id] || 0,
      participants: rd.participants[f.id] || 0,
      forms: rd.forms[f.id] || 0,
      display: isNorm ? norm : raw
    };
  });

  items.sort(function(a, b) { return b.display - a.display; });

  var maxDisplay = items.length > 0 ? (items[0].display || 1) : 1;
  if (maxDisplay === 0) maxDisplay = 1;

  var html = '';

  // Подіум
  if (items.length >= 3) {
    html += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:12px;margin-bottom:32px;padding:20px 0;">';
    html += rankPodium(items[1], 2, isNorm, '100px');
    html += rankPodium(items[0], 1, isNorm, '130px');
    html += rankPodium(items[2], 3, isNorm, '80px');
    html += '</div>';
  }

  // Таблиця
  html += '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
      '<thead><tr style="border-bottom:2px solid var(--border);">' +
        thCell('#', 'left') +
        thCell('Факультет', 'left') +
        thCell('Заходів', 'center') +
        thCell('Учасників', 'center') +
        thCell('Анкет', 'center') +
        thCell(isNorm ? 'Бал/співр.' : 'Бали', 'right') +
        (isNorm ? thCell('Абсол. бал', 'right') : thCell('Штат', 'center')) +
        thCell('', 'right') +
      '</tr></thead><tbody>';

  items.forEach(function(f, i) {
    var color = FACULTY_COLORS[f.short_name] || 'var(--accent)';
    var barWidth = Math.round((f.display / maxDisplay) * 100);

    html += '<tr style="border-bottom:1px solid var(--border-light);">' +
      '<td style="padding:12px 16px;font-weight:700;color:var(--text-muted);width:36px;">' + (i + 1) + '</td>' +
      '<td style="padding:12px 16px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:10px;height:10px;border-radius:3px;background:' + color + ';flex-shrink:0;"></div>' +
          '<div>' +
            '<div style="font-weight:600;">' + f.short_name + '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">' + f.name + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' + f.count + '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' + f.participants + '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' + f.forms + '</td>' +
      '<td style="padding:12px 16px;text-align:right;font-weight:700;color:' + color + ';">' + f.display + '</td>' +
      (isNorm ?
        '<td style="padding:12px 16px;text-align:right;font-size:12px;color:var(--text-muted);">' + f.score + '</td>'
      :
        '<td style="padding:12px 16px;text-align:center;font-size:12px;color:var(--text-muted);">' + f.staff + '</td>'
      ) +
      '<td style="padding:12px 16px;min-width:120px;">' +
        '<div style="height:8px;background:var(--border-light);border-radius:4px;overflow:hidden;">' +
          '<div style="height:100%;width:' + barWidth + '%;background:' + color + ';border-radius:4px;transition:width 0.4s;"></div>' +
        '</div>' +
      '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div></div>';

  // Пояснення нормалізації
  if (isNorm) {
    html += '<div style="margin-top:12px;padding:12px 16px;background:var(--accent-glow);border-radius:10px;font-size:13px;color:var(--text-secondary);">' +
      'Нормалізований бал = загальний бал / кількість штатних співробітників. Це дозволяє справедливо порівнювати великі та малі факультети.' +
    '</div>';
  }

  container.innerHTML = html;
}

function thCell(text, align) {
  return '<th style="padding:12px 16px;text-align:' + align + ';font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase;">' + text + '</th>';
}

function rankPodium(item, place, isNorm, height) {
  var color = FACULTY_COLORS[item.short_name] || 'var(--accent)';
  var medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  var displayVal = item.display;

  return '<div style="text-align:center;flex:1;max-width:160px;">' +
    '<div style="font-size:28px;margin-bottom:4px;">' + medals[place] + '</div>' +
    '<div style="font-weight:700;font-size:15px;margin-bottom:2px;">' + item.short_name + '</div>' +
    '<div style="font-weight:800;font-size:20px;color:' + color + ';">' + displayVal + '</div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">' +
      (isNorm ? 'бал/співр.' : item.count + ' заходів') +
    '</div>' +
    (isNorm ? '<div style="font-size:11px;color:var(--text-muted);">абсол: ' + item.score + ' | штат: ' + item.staff + '</div>' : '') +
    '<div style="height:' + height + ';background:linear-gradient(180deg,' + color + ',' + color + 'CC);border-radius:12px 12px 0 0;margin-top:6px;"></div>' +
  '</div>';
}

// pages/ranking.js — Рейтинг факультетів з інфографікою

var FACULTY_COLORS = {
  'ФОіФ': '#F0AA33', 'ФМіМ': '#8B5CF6', 'АФ': '#10B981',
  'ІТФ': '#F97316', 'ФВМ': '#3B82F6', 'БФ': '#EF4444', 'ФВІіЕ': '#06B6D4'
};

var rankingMode = 'absolute';
var rankingDataCache = null;

registerPage('ranking', {
  render: function(user) {
    return '<div style="max-width:960px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h2 style="font-size:22px;letter-spacing:-0.03em;">Рейтинг факультетів</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">За верифікованими заходами</p>' +
        '</div>' +
        '<div style="display:flex;background:var(--bg-warm);border-radius:12px;padding:3px;gap:2px;" id="ranking-mode-toggle">' +
          '<button class="btn filter-active" onclick="setRankingMode(\'absolute\',this)" style="font-size:13px;padding:8px 18px;border-radius:10px;">Абсолютний</button>' +
          '<button class="btn btn-secondary" onclick="setRankingMode(\'normalized\',this)" style="font-size:13px;padding:8px 18px;border-radius:10px;border:none;">На 1 співробітника</button>' +
        '</div>' +
      '</div>' +
      '<div id="ranking-chart" style="margin-bottom:24px;"></div>' +
      '<div id="ranking-table"></div>' +
    '</div>';
  },
  init: async function(user) {
    rankingMode = 'absolute';
    rankingDataCache = null;
    await loadRankingData();
  }
});

function setRankingMode(mode, btn) {
  rankingMode = mode;
  document.querySelectorAll('#ranking-mode-toggle button').forEach(function(b) {
    b.classList.remove('filter-active');
    b.className = 'btn btn-secondary';
    b.style.border = 'none';
  });
  btn.classList.add('filter-active');
  btn.className = 'btn filter-active';
  renderRankingAll();
}

async function loadRankingData() {
  var chartEl = document.getElementById('ranking-chart');
  if (chartEl) chartEl.innerHTML = '<div style="text-align:center;padding:40px;"><span class="spinner"></span></div>';

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
      scores[fId] += s; counts[fId]++;
      participants[fId] += (a.participants_count || 0);
      forms[fId] += (a.paper_forms_count || 0) + (a.electronic_forms_count || 0);
    }
  });

  rankingDataCache = { faculties: faculties, scores: scores, counts: counts, participants: participants, forms: forms };
  renderRankingAll();
}

function getSortedItems() {
  var rd = rankingDataCache;
  var isNorm = rankingMode === 'normalized';
  return rd.faculties.map(function(f) {
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
  }).sort(function(a, b) { return b.display - a.display; });
}

function renderRankingAll() {
  renderRankingChart();
  renderRankingTable();
}

function renderRankingChart() {
  var container = document.getElementById('ranking-chart');
  if (!container || !rankingDataCache) return;

  var items = getSortedItems();
  var isNorm = rankingMode === 'normalized';
  var maxDisplay = items.length > 0 ? (items[0].display || 1) : 1;
  if (maxDisplay === 0) maxDisplay = 1;

  var html = '<div class="card"><div class="card-body" style="padding:28px;">';

  // Подіум для топ-3
  if (items.length >= 3) {
    var medals = ['🥇', '🥈', '🥉'];
    var heights = ['140px', '110px', '85px'];
    var order = [1, 0, 2]; // silver, gold, bronze display order

    html += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:16px;margin-bottom:32px;padding-top:12px;">';
    order.forEach(function(idx) {
      var item = items[idx];
      var color = FACULTY_COLORS[item.short_name] || '#94A3B8';
      var isFirst = idx === 0;

      html += '<div style="text-align:center;flex:1;max-width:170px;">' +
        '<div style="font-size:' + (isFirst ? '32' : '26') + 'px;margin-bottom:6px;">' + medals[idx] + '</div>' +
        '<div style="font-weight:700;font-size:' + (isFirst ? '16' : '14') + 'px;margin-bottom:3px;">' + item.short_name + '</div>' +
        '<div style="font-weight:800;font-size:' + (isFirst ? '24' : '18') + 'px;color:' + color + ';letter-spacing:-0.03em;">' + item.display + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">' + (isNorm ? 'бал/співр.' : item.count + ' заходів') + '</div>' +
        '<div style="height:' + heights[idx] + ';background:linear-gradient(180deg,' + color + ',' + color + 'BB);border-radius:14px 14px 0 0;position:relative;overflow:hidden;">' +
          '<div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15),transparent);"></div>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
  }

  // Горизонтальна діаграма для ВСІХ 7 факультетів
  html += '<div style="display:flex;flex-direction:column;gap:14px;">';

  items.forEach(function(item, i) {
    var color = FACULTY_COLORS[item.short_name] || '#94A3B8';
    var pct = Math.round((item.display / maxDisplay) * 100);

    html += '<div style="display:flex;align-items:center;gap:14px;">' +
      '<div style="width:18px;font-weight:800;font-size:14px;color:var(--text-muted);text-align:right;flex-shrink:0;">' + (i + 1) + '</div>' +
      '<div style="width:52px;flex-shrink:0;">' +
        '<div style="width:38px;height:38px;border-radius:12px;background:' + color + '15;display:flex;align-items:center;justify-content:center;">' +
          '<div style="width:14px;height:14px;border-radius:4px;background:' + color + ';"></div>' +
        '</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px;">' +
          '<span style="font-weight:600;font-size:14px;">' + item.short_name + '</span>' +
          '<span style="font-weight:800;font-size:16px;color:' + color + ';letter-spacing:-0.02em;">' + item.display + '</span>' +
        '</div>' +
        '<div style="height:10px;background:var(--bg-warm);border-radius:6px;overflow:hidden;">' +
          '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + color + ',' + color + 'CC);border-radius:6px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1);"></div>' +
        '</div>' +
        '<div style="display:flex;gap:16px;margin-top:4px;font-size:11px;color:var(--text-muted);">' +
          '<span>' + item.count + ' заходів</span>' +
          '<span>' + item.participants + ' учасників</span>' +
          '<span>' + item.forms + ' анкет</span>' +
          (isNorm ? '<span>абсол: ' + item.score + '</span>' : '<span>штат: ' + item.staff + '</span>') +
        '</div>' +
      '</div>' +
    '</div>';
  });

  html += '</div>';
  html += '</div></div>';

  container.innerHTML = html;
}

function renderRankingTable() {
  var container = document.getElementById('ranking-table');
  if (!container || !rankingDataCache) return;

  var items = getSortedItems();
  var isNorm = rankingMode === 'normalized';

  var html = '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
    '<thead><tr style="border-bottom:2px solid var(--border);">';

  ['#', 'Факультет', 'Заходів', 'Учасників', 'Анкет', isNorm ? 'Бал/співр.' : 'Бали', isNorm ? 'Абсол.' : 'Штат'].forEach(function(h, i) {
    var align = i < 2 ? 'left' : (i >= 5 ? 'right' : 'center');
    html += '<th style="padding:12px 16px;text-align:' + align + ';font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase;">' + h + '</th>';
  });

  html += '</tr></thead><tbody>';

  items.forEach(function(f, i) {
    var color = FACULTY_COLORS[f.short_name] || 'var(--accent)';
    html += '<tr style="border-bottom:1px solid var(--border-light);">' +
      '<td style="padding:12px 16px;font-weight:700;color:var(--text-muted);width:36px;">' + (i + 1) + '</td>' +
      '<td style="padding:12px 16px;"><div style="display:flex;align-items:center;gap:10px;"><div style="width:10px;height:10px;border-radius:3px;background:' + color + ';"></div><div><div style="font-weight:600;">' + f.short_name + '</div><div style="font-size:12px;color:var(--text-muted);">' + f.name + '</div></div></div></td>' +
      '<td style="padding:12px 16px;text-align:center;">' + f.count + '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' + f.participants + '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' + f.forms + '</td>' +
      '<td style="padding:12px 16px;text-align:right;font-weight:700;color:' + color + ';">' + f.display + '</td>' +
      '<td style="padding:12px 16px;text-align:right;font-size:12px;color:var(--text-muted);">' + (isNorm ? f.score : f.staff) + '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div></div>';

  if (isNorm) {
    html += '<div style="margin-top:12px;padding:14px 18px;background:var(--blue-soft);border-radius:var(--r2);font-size:13px;color:var(--blue);border-left:4px solid var(--blue);">' +
      'Нормалізований бал = загальний бал \u00f7 кількість штатних співробітників. Дозволяє справедливо порівнювати великі та малі факультети. Штат можна налаштувати в розділі Адміністрування \u2192 Налаштування \u2192 Штат факультетів.' +
    '</div>';
  }

  container.innerHTML = html;
}

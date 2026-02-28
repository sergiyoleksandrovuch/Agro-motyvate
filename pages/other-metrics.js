// pages/other-metrics.js — Інші показники (Фаза 2)

var METRIC_LABELS = {
  prep_department_students: { name: 'Слухачі підготовчого відділення', points: 20, unit: 'осіб' },
  prep_department_teachers: { name: 'Викладачі підготовчого відділення', points: 10, unit: 'осіб' },
  man_participants: { name: 'Учасники МАН', points: 4, unit: 'осіб' },
  ut_tagged_forms: { name: 'Анкети з UT-міткою', points: 1, unit: 'шт' },
  ut_tagged_flyers: { name: 'Флаєри з UT-міткою (верифіковані)', points: 1, unit: 'шт' }
};

registerPage('other-metrics', {
  render: function(user) {
    return '' +
      '<div style="max-width:800px;">' +
        '<div style="margin-bottom:20px;">' +
          '<h2 style="font-size:20px;">Інші показники</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">МАН, підготовче відділення, UT-мітки</p>' +
        '</div>' +

        // Підказка по балах
        '<div class="card" style="margin-bottom:16px;border-left:4px solid var(--accent);">' +
          '<div class="card-body" style="padding:14px 18px;">' +
            '<div style="font-weight:600;font-size:14px;margin-bottom:8px;">Як нараховуються бали:</div>' +
            '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">' +
              'Слухач підготовчого відділення — 20 б/особу · ' +
              'Викладач підготовчого — 10 б/особу · ' +
              'Учасник МАН — 4 б/особу · ' +
              'Анкета з UT-міткою — 1 б/шт · ' +
              'Флаєр з UT-міткою — 1 б/шт' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Форма
        '<div class="card" style="margin-bottom:16px;">' +
          '<div class="card-body">' +
            '<h3 style="font-size:16px;margin-bottom:16px;">Внести показники</h3>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
              '<div class="form-group">' +
                '<label class="form-label">Початок періоду</label>' +
                '<input class="form-input" type="date" id="om-date-start">' +
              '</div>' +
              '<div class="form-group">' +
                '<label class="form-label">Кінець періоду</label>' +
                '<input class="form-input" type="date" id="om-date-end">' +
              '</div>' +
            '</div>' +

            buildMetricInput('prep_department_students') +
            buildMetricInput('prep_department_teachers') +
            buildMetricInput('man_participants') +
            buildMetricInput('ut_tagged_forms') +
            buildMetricInput('ut_tagged_flyers') +

            '<div id="om-score-preview" style="padding:12px;background:var(--accent-glow);border-radius:var(--r2);margin-bottom:16px;display:none;"></div>' +

            '<div style="display:flex;gap:10px;">' +
              '<button class="btn btn-primary" onclick="calculateOmPreview()">Розрахувати бал</button>' +
              '<button class="btn btn-primary" onclick="saveOtherMetrics()" style="background:var(--green);border-color:var(--green);">Зберегти</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Історія
        '<div id="om-history"></div>' +
      '</div>';
  },

  init: async function(user) {
    // Встановити дати за замовчуванням (поточний місяць)
    var now = new Date();
    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    var lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    var startInput = document.getElementById('om-date-start');
    var endInput = document.getElementById('om-date-end');
    if (startInput) startInput.value = firstDay;
    if (endInput) endInput.value = lastDay;

    await loadOmHistory(user);
  }
});

function buildMetricInput(key) {
  var m = METRIC_LABELS[key];
  return '<div class="form-group">' +
    '<label class="form-label">' + m.name + ' <span style="color:var(--text-muted);font-weight:400;">(' + m.points + ' б/' + m.unit.replace('осіб','особу').replace('шт','шт') + ')</span></label>' +
    '<input class="form-input" type="number" id="om-' + key + '" min="0" value="0" oninput="calculateOmPreview()">' +
  '</div>';
}

function calculateOmPreview() {
  var total = 0;
  var details = [];

  Object.keys(METRIC_LABELS).forEach(function(key) {
    var m = METRIC_LABELS[key];
    var val = parseInt(document.getElementById('om-' + key).value) || 0;
    var points = val * m.points;
    total += points;
    if (val > 0) {
      details.push(m.name.split(' ')[0] + ': ' + val + ' × ' + m.points + ' = ' + points);
    }
  });

  total = Math.round(total * 100) / 100;

  var preview = document.getElementById('om-score-preview');
  preview.style.display = 'block';
  preview.innerHTML = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
    '<div style="font-family:\'Plus Jakarta Sans\';font-weight:800;font-size:24px;color:var(--accent-deep);">' + total + ' балів</div>' +
    '<div style="font-size:12px;color:var(--text-secondary);">' + (details.join(' · ') || 'Введіть показники') + '</div>' +
  '</div>';

  return total;
}

async function saveOtherMetrics() {
  var dateStart = document.getElementById('om-date-start').value;
  var dateEnd = document.getElementById('om-date-end').value;

  if (!dateStart || !dateEnd) {
    alert('Вкажіть період');
    return;
  }

  var score = calculateOmPreview();

  var data = {
    department_id: currentUser.department_id,
    report_period_start: dateStart,
    report_period_end: dateEnd,
    prep_department_students: parseInt(document.getElementById('om-prep_department_students').value) || 0,
    prep_department_teachers: parseInt(document.getElementById('om-prep_department_teachers').value) || 0,
    man_participants: parseInt(document.getElementById('om-man_participants').value) || 0,
    ut_tagged_forms: parseInt(document.getElementById('om-ut_tagged_forms').value) || 0,
    ut_tagged_flyers: parseInt(document.getElementById('om-ut_tagged_flyers').value) || 0,
    score: score,
    status: 'submitted',
    created_by: currentUser.id
  };

  var result = await db.from('other_metrics').insert(data);

  if (result.error) {
    alert('Помилка: ' + result.error.message);
    return;
  }

  // Очистити
  Object.keys(METRIC_LABELS).forEach(function(key) {
    document.getElementById('om-' + key).value = '0';
  });
  document.getElementById('om-score-preview').style.display = 'none';

  alert('Показники збережено та подано на верифікацію!');
  await loadOmHistory(currentUser);
}

async function loadOmHistory(user) {
  var container = document.getElementById('om-history');
  if (!container) return;

  var result = await db
    .from('other_metrics')
    .select('*')
    .eq('department_id', user.department_id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (result.error || !result.data || result.data.length === 0) {
    container.innerHTML = '';
    return;
  }

  var statusLabels = { draft: 'Чернетка', submitted: 'На перевірці', verified: 'Підтверджено', rejected: 'Відхилено' };

  var html = '<h3 style="font-size:16px;margin-bottom:12px;">Історія показників</h3>';

  result.data.forEach(function(item) {
    var statusClass = 'badge-' + item.status;
    var statusText = statusLabels[item.status] || item.status;
    var period = item.report_period_start + ' — ' + item.report_period_end;

    var metrics = [];
    if (item.prep_department_students) metrics.push('Слухачі ПВ: ' + item.prep_department_students);
    if (item.prep_department_teachers) metrics.push('Викладачі ПВ: ' + item.prep_department_teachers);
    if (item.man_participants) metrics.push('МАН: ' + item.man_participants);
    if (item.ut_tagged_forms) metrics.push('UT-анкети: ' + item.ut_tagged_forms);
    if (item.ut_tagged_flyers) metrics.push('UT-флаєри: ' + item.ut_tagged_flyers);

    html += '<div class="card" style="margin-bottom:10px;">' +
      '<div class="card-body" style="padding:14px 18px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:200px;">' +
            '<div style="font-weight:600;font-size:14px;margin-bottom:2px;">Період: ' + period + '</div>' +
            '<div style="font-size:13px;color:var(--text-muted);">' + metrics.join(' · ') + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="text-align:right;">' +
              '<div style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:16px;color:var(--accent-deep);">' + (item.score || 0) + '</div>' +
              '<div style="font-size:11px;color:var(--text-muted);">балів</div>' +
            '</div>' +
            '<span class="badge ' + statusClass + '">' + statusText + '</span>' +
          '</div>' +
        '</div>';

    if (item.status === 'rejected' && item.rejection_comment) {
      html += '<div style="margin-top:8px;padding:8px 12px;background:var(--red-soft);border-radius:8px;font-size:13px;color:var(--red);">⚠️ ' + item.rejection_comment + '</div>';
    }

    html += '</div></div>';
  });

  container.innerHTML = html;
}

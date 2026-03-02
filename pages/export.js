// pages/export.js — Експорт звітів PDF/Excel

registerPage('export', {
  render: function(user) {
    var isAdmin = user.role === 'admin' || user.role === 'rectorate';

    return '<div style="max-width:800px;">' +
      '<div style="margin-bottom:20px;">' +
        '<h2 style="font-size:20px;">Експорт звітів</h2>' +
        '<p style="color:var(--text-muted);font-size:14px;">Завантажте дані у форматі Excel або PDF</p>' +
      '</div>' +

      // Фільтри
      '<div class="card" style="margin-bottom:16px;"><div class="card-body" style="padding:16px;">' +
        '<div style="font-weight:600;font-size:14px;margin-bottom:12px;">Параметри звіту</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;" class="export-filters">' +
          '<div class="form-group" style="margin:0;">' +
            '<label class="form-label" style="font-size:12px;">Період від</label>' +
            '<input class="form-input" type="date" id="export-from" value="' + academicYearStart() + '">' +
          '</div>' +
          '<div class="form-group" style="margin:0;">' +
            '<label class="form-label" style="font-size:12px;">Період до</label>' +
            '<input class="form-input" type="date" id="export-to" value="' + todayDate() + '">' +
          '</div>' +
          (isAdmin ?
            '<div class="form-group" style="margin:0;">' +
              '<label class="form-label" style="font-size:12px;">Підрозділ</label>' +
              '<select class="form-input" id="export-dept"><option value="all">Всі підрозділи</option></select>' +
            '</div>'
          :
            '<div class="form-group" style="margin:0;">' +
              '<label class="form-label" style="font-size:12px;">Статус</label>' +
              '<select class="form-input" id="export-status">' +
                '<option value="all">Всі статуси</option>' +
                '<option value="verified">Верифіковані</option>' +
                '<option value="submitted">На перевірці</option>' +
                '<option value="draft">Чернетки</option>' +
              '</select>' +
            '</div>'
          ) +
        '</div>' +
      '</div></div>' +

      // Типи звітів
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" class="export-filters">' +

        exportCard('activities-excel', 'Заходи (Excel)',
          'Повний список заходів з балами, закладами, статусами', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', 'Excel .xlsx') +

        exportCard('activities-pdf', 'Заходи (PDF)',
          'Зведена таблиця заходів для друку', '📄', 'PDF') +

        exportCard('ranking-excel', 'Рейтинг факультетів (Excel)',
          'Зведений рейтинг з балами по категоріях', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', 'Excel .xlsx') +

        exportCard('ranking-pdf', 'Рейтинг факультетів (PDF)',
          'Рейтингова таблиця для звітності', '🏅', 'PDF') +

        (isAdmin ?
          exportCard('users-excel', 'Користувачі (Excel)',
            'Список користувачів з ролями та підрозділами', '👥', 'Excel .xlsx') +
          exportCard('summary-pdf', 'Зведений звіт (PDF)',
            'Загальний звіт з KPI, рейтингом та статистикою', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>', 'PDF')
        : '') +

      '</div>' +

      '<div id="export-status-msg" style="margin-top:16px;"></div>' +

    '</div>' +
    '<style>@media(max-width:768px){.export-filters{grid-template-columns:1fr !important;}}</style>';
  },

  init: async function(user) {
    if (user.role === 'admin' || user.role === 'rectorate') {
      await loadExportDepts();
    }
  }
});

function exportCard(action, title, desc, icon, format) {
  return '<div class="card" style="cursor:pointer;transition:transform 0.15s;" onclick="runExport(\'' + action + '\')" ' +
    'onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'\'">' +
    '<div class="card-body" style="padding:20px;text-align:center;">' +
      '<div style="font-size:36px;margin-bottom:8px;">' + icon + '</div>' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:4px;">' + title + '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">' + desc + '</div>' +
      '<span style="font-size:11px;padding:3px 10px;background:var(--accent-glow);color:var(--accent-deep);border-radius:8px;font-weight:600;">' + format + '</span>' +
    '</div>' +
  '</div>';
}

function academicYearStart() {
  var now = new Date();
  var y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return y + '-09-01';
}

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

async function loadExportDepts() {
  var select = document.getElementById('export-dept');
  if (!select) return;
  var result = await db.from('departments').select('id, short_name, name').eq('type', 'faculty').order('name');
  (result.data || []).forEach(function(d) {
    var opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.short_name + ' — ' + d.name;
    select.appendChild(opt);
  });
}

function showExportMsg(msg, isError) {
  var el = document.getElementById('export-status-msg');
  if (el) el.innerHTML = '<div class="alert ' + (isError ? 'alert-error' : 'alert-success') + '">' + msg + '</div>';
  if (!isError) setTimeout(function() { if (el) el.innerHTML = ''; }, 4000);
}

async function runExport(action) {
  showExportMsg('Формування звіту...', false);

  try {
    var from = document.getElementById('export-from').value;
    var to = document.getElementById('export-to').value;
    var deptId = document.getElementById('export-dept') ? document.getElementById('export-dept').value : null;
    var status = document.getElementById('export-status') ? document.getElementById('export-status').value : 'all';

    if (action === 'activities-excel') await exportActivitiesExcel(from, to, deptId, status);
    else if (action === 'activities-pdf') await exportActivitiesPDF(from, to, deptId, status);
    else if (action === 'ranking-excel') await exportRankingExcel(from, to);
    else if (action === 'ranking-pdf') await exportRankingPDF(from, to);
    else if (action === 'users-excel') await exportUsersExcel();
    else if (action === 'summary-pdf') await exportSummaryPDF(from, to);

    showExportMsg('Звіт завантажено!', false);
  } catch(e) {
    showExportMsg('Помилка: ' + e.message, true);
  }
}

// ===== ЗАВАНТАЖЕННЯ ДАНИХ =====

async function fetchActivities(from, to, deptId, status) {
  var query = db.from('activities')
    .select('*, activity_types(name, category), institutions(name, city), departments(name, short_name), profiles:created_by(full_name)')
    .gte('event_date', from).lte('event_date', to)
    .order('event_date', { ascending: false });

  if (deptId && deptId !== 'all') query = query.eq('department_id', deptId);
  if (status && status !== 'all') query = query.eq('status', status);

  var result = await query;
  return result.data || [];
}

// ===== EXCEL EXPORTS =====

async function exportActivitiesExcel(from, to, deptId, status) {
  var data = await fetchActivities(from, to, deptId, status);
  var statusLabels = { draft: 'Чернетка', submitted: 'На перевірці', verified: 'Підтверджено', rejected: 'Відхилено' };

  var rows = data.map(function(a) {
    return {
      'Дата': a.event_date,
      'Тип заходу': a.activity_types ? a.activity_types.name : (a.custom_activity_name || ''),
      'Заклад': a.institutions ? a.institutions.name : (a.custom_institution_name || ''),
      'Місто': a.institutions ? a.institutions.city || '' : '',
      'Підрозділ': a.departments ? a.departments.short_name : '',
      'Учасників': a.participants_count || 0,
      'Паперові анкети': a.paper_forms_count || 0,
      'Електронні анкети': a.electronic_forms_count || 0,
      'Попередній бал': a.preliminary_score || 0,
      'Фінальний бал': a.final_score || '',
      'Статус': statusLabels[a.status] || a.status,
      'Виконавець': a.profiles ? a.profiles.full_name : '',
      'Примітка': a.notes || ''
    };
  });

  downloadExcel(rows, 'Заходи', 'zahodы_' + from + '_' + to + '.xlsx');
}

async function exportRankingExcel(from, to) {
  var facResult = await db.from('departments').select('id, name, short_name, staff_count').eq('type', 'faculty').eq('is_active', true);
  var faculties = facResult.data || [];

  var actResult = await db.from('activities')
    .select('department_id, final_score, preliminary_score, status, departments!inner(parent_id)')
    .eq('status', 'verified').gte('event_date', from).lte('event_date', to);
  var activities = actResult.data || [];

  var scores = {};
  var counts = {};
  faculties.forEach(function(f) { scores[f.id] = 0; counts[f.id] = 0; });
  activities.forEach(function(a) {
    var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
    if (scores[fId] !== undefined) {
      scores[fId] += parseFloat(a.final_score || a.preliminary_score || 0);
      counts[fId]++;
    }
  });

  var rows = faculties.map(function(f) {
    var score = Math.round((scores[f.id] || 0) * 10) / 10;
    var staff = f.staff_count || 1;
    return {
      'Факультет': f.short_name,
      'Повна назва': f.name,
      'Заходів': counts[f.id] || 0,
      'Загальний бал': score,
      'Штат': staff,
      'Бал на співробітника': Math.round((score / staff) * 100) / 100
    };
  }).sort(function(a, b) { return b['Загальний бал'] - a['Загальний бал']; });

  // Додати номер місця
  rows.forEach(function(r, i) { r['Місце'] = i + 1; });

  downloadExcel(rows, 'Рейтинг', 'reytyng_' + from + '_' + to + '.xlsx');
}

async function exportUsersExcel() {
  var result = await db.from('profiles').select('*, departments(name, short_name)').order('full_name');
  var users = result.data || [];
  var roleLabels = { admin: 'Адміністратор', verifier: 'Верифікатор', rectorate: 'Ректорат', participant: 'Учасник' };

  var rows = users.map(function(u) {
    return {
      'ПІБ': u.full_name,
      'Email': u.email || '',
      'Посада': u.position || '',
      'Роль': roleLabels[u.role] || u.role,
      'Підрозділ': u.departments ? u.departments.short_name : '',
      'Статус': u.is_active !== false ? 'Активний' : 'Деактивований'
    };
  });

  downloadExcel(rows, 'Користувачі', 'korystuvachi.xlsx');
}

function downloadExcel(rows, sheetName, fileName) {
  var ws = XLSX.utils.json_to_sheet(rows);

  // Ширина стовпців
  var colWidths = {};
  rows.forEach(function(r) {
    Object.keys(r).forEach(function(k) {
      var len = String(r[k]).length;
      colWidths[k] = Math.max(colWidths[k] || k.length, len);
    });
  });
  ws['!cols'] = Object.keys(colWidths).map(function(k) { return { wch: Math.min(colWidths[k] + 2, 40) }; });

  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

// ===== PDF EXPORTS =====

function createPDF(landscape) {
  var jsPDF = window.jspdf.jsPDF;
  return new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
}

function pdfHeader(doc, title, period) {
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('DDAEU | #Agro_motivashka | ' + period, 14, 22);
  doc.setTextColor(0);
  return 28;
}

async function exportActivitiesPDF(from, to, deptId, status) {
  var data = await fetchActivities(from, to, deptId, status);
  var statusLabels = { draft: 'Чернетка', submitted: 'На перевірці', verified: 'Підтверджено', rejected: 'Відхилено' };

  var doc = createPDF(true);
  var y = pdfHeader(doc, 'Zvit: Zahody proforientaciyi', from + ' — ' + to);

  var tableData = data.map(function(a, i) {
    return [
      i + 1,
      a.event_date || '',
      (a.activity_types ? a.activity_types.name : '').substring(0, 30),
      (a.institutions ? a.institutions.name : (a.custom_institution_name || '')).substring(0, 25),
      a.departments ? a.departments.short_name : '',
      a.participants_count || 0,
      (a.paper_forms_count || 0) + (a.electronic_forms_count || 0),
      a.final_score || a.preliminary_score || 0,
      statusLabels[a.status] || ''
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['#', 'Data', 'Typ zahodu', 'Zaklad', 'Pidrozdil', 'Uchasn.', 'Ankety', 'Bal', 'Status']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 170, 51], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { cellWidth: 8 }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center', fontStyle: 'bold' } }
  });

  // Підсумок
  var totalScore = 0;
  data.forEach(function(a) { totalScore += parseFloat(a.final_score || a.preliminary_score || 0); });
  var finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.text('Vsogo zahodiv: ' + data.length + '  |  Zagalnyj bal: ' + Math.round(totalScore * 10) / 10, 14, finalY);

  doc.save('zahody_' + from + '_' + to + '.pdf');
}

async function exportRankingPDF(from, to) {
  var facResult = await db.from('departments').select('id, name, short_name, staff_count').eq('type', 'faculty').eq('is_active', true);
  var faculties = facResult.data || [];

  var actResult = await db.from('activities')
    .select('department_id, final_score, preliminary_score, departments!inner(parent_id)')
    .eq('status', 'verified').gte('event_date', from).lte('event_date', to);
  var activities = actResult.data || [];

  var scores = {}, counts = {};
  faculties.forEach(function(f) { scores[f.id] = 0; counts[f.id] = 0; });
  activities.forEach(function(a) {
    var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
    if (scores[fId] !== undefined) { scores[fId] += parseFloat(a.final_score || a.preliminary_score || 0); counts[fId]++; }
  });

  var sorted = faculties.map(function(f) {
    return { name: f.short_name, full: f.name, score: Math.round((scores[f.id] || 0) * 10) / 10, count: counts[f.id] || 0, staff: f.staff_count || 1 };
  }).sort(function(a, b) { return b.score - a.score; });

  var doc = createPDF(false);
  var y = pdfHeader(doc, 'Reytyng fakultetiv DDAEU', from + ' — ' + to);

  var tableData = sorted.map(function(f, i) {
    return [i + 1, f.name, f.full, f.count, f.score, f.staff, Math.round((f.score / f.staff) * 100) / 100];
  });

  doc.autoTable({
    startY: y,
    head: [['Misce', 'Fakultet', 'Nazva', 'Zahodiv', 'Bal', 'Shtat', 'Bal/shtat']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [240, 170, 51], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 4: { halign: 'center', fontStyle: 'bold' }, 6: { halign: 'center' } }
  });

  doc.save('reytyng_' + from + '_' + to + '.pdf');
}

async function exportSummaryPDF(from, to) {
  var doc = createPDF(false);
  var y = pdfHeader(doc, 'Zvedenyj zvit: proforiyentaciya DDAEU', from + ' — ' + to);

  // Загальна статистика
  var actResult = await db.from('activities').select('status, preliminary_score, final_score').gte('event_date', from).lte('event_date', to);
  var acts = actResult.data || [];
  var total = acts.length;
  var verified = acts.filter(function(a) { return a.status === 'verified'; });
  var totalScore = 0;
  verified.forEach(function(a) { totalScore += parseFloat(a.final_score || a.preliminary_score || 0); });

  doc.setFontSize(12);
  doc.text('Zagalna statystyka', 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.text('Vsogo zahodiv: ' + total, 14, y); y += 5;
  doc.text('Veryfikovanyh: ' + verified.length, 14, y); y += 5;
  doc.text('Zagalnyj bal: ' + Math.round(totalScore * 10) / 10, 14, y); y += 10;

  // Рейтинг
  var facResult = await db.from('departments').select('id, short_name, staff_count').eq('type', 'faculty').eq('is_active', true);
  var faculties = facResult.data || [];

  var facActs = await db.from('activities')
    .select('department_id, final_score, preliminary_score, departments!inner(parent_id)')
    .eq('status', 'verified').gte('event_date', from).lte('event_date', to);

  var scores = {}, counts = {};
  faculties.forEach(function(f) { scores[f.id] = 0; counts[f.id] = 0; });
  (facActs.data || []).forEach(function(a) {
    var fId = (a.departments ? a.departments.parent_id : null) || a.department_id;
    if (scores[fId] !== undefined) { scores[fId] += parseFloat(a.final_score || a.preliminary_score || 0); counts[fId]++; }
  });

  var sorted = faculties.map(function(f) {
    return { name: f.short_name, score: Math.round((scores[f.id] || 0) * 10) / 10, count: counts[f.id] || 0, staff: f.staff_count || 1 };
  }).sort(function(a, b) { return b.score - a.score; });

  doc.setFontSize(12);
  doc.text('Reytyng fakultetiv', 14, y); y += 2;

  doc.autoTable({
    startY: y,
    head: [['#', 'Fakultet', 'Zahodiv', 'Bal', 'Bal/shtat']],
    body: sorted.map(function(f, i) { return [i + 1, f.name, f.count, f.score, Math.round((f.score / f.staff) * 100) / 100]; }),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 170, 51], textColor: 255 },
    columnStyles: { 0: { cellWidth: 10 }, 3: { fontStyle: 'bold' } }
  });

  // KPI
  var kpiResult = await db.from('kpi_plans').select('*, departments(short_name)').order('department_id');
  var kpis = kpiResult.data || [];

  if (kpis.length > 0) {
    var ky = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Vykonannya KPI', 14, ky); ky += 2;

    doc.autoTable({
      startY: ky,
      head: [['Fakultet', 'Cil', 'Faktychno', '%']],
      body: kpis.map(function(k) {
        var fac = sorted.find(function(f) { return f.name === (k.departments ? k.departments.short_name : ''); });
        var actual = fac ? fac.score : 0;
        var pct = k.target_score > 0 ? Math.round((actual / k.target_score) * 100) : 0;
        return [k.departments ? k.departments.short_name : '', k.target_score, actual, pct + '%'];
      }),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [4, 146, 73], textColor: 255 }
    });
  }

  doc.save('zvit_' + from + '_' + to + '.pdf');
}

// pages/settings.js — Налаштування (admin) — з довільними категоріями

registerPage('settings', {
  render: function(user) {
    if (user.role !== 'admin') {
      return '<div style="padding:40px;text-align:center;color:var(--text-muted);">Доступ лише для адміністратора</div>';
    }

    return '' +
      '<div style="max-width:900px;">' +
        '<div style="margin-bottom:20px;">' +
          '<h2 style="font-size:20px;">Налаштування</h2>' +
          '<p style="color:var(--text-muted);font-size:14px;">Ваги активностей та системні параметри</p>' +
        '</div>' +

        '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;" id="settings-tabs">' +
          '<button class="btn btn-secondary filter-active" onclick="settingsTab(\'weights\',this)" style="font-size:13px;padding:6px 14px;">Ваги активностей</button>' +
          '<button class="btn btn-secondary" onclick="settingsTab(\'departments\',this)" style="font-size:13px;padding:6px 14px;">Підрозділи</button>' +
        '</div>' +

        '<div id="settings-content">Завантаження...</div>' +
      '</div>' +

      '<div id="weight-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;padding:20px;overflow-y:auto;">' +
        '<div style="max-width:520px;margin:40px auto;background:var(--bg-card);border-radius:var(--r4);padding:28px;position:relative;">' +
          '<button onclick="closeWeightModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>' +
          '<div id="weight-modal-content"></div>' +
        '</div>' +
      '</div>';
  },

  init: async function(user) {
    if (user.role === 'admin') await loadWeightsTab();
  }
});

var CATEGORY_PRESETS = {
  field_visit: 'Виїзні зустрічі',
  online: 'Онлайн',
  internal: 'Внутрішні заходи',
  external_event: 'Зовнішні заходи',
  memorandum: 'Меморандуми',
  other: 'Інше'
};

function settingsTab(tab, btn) {
  document.querySelectorAll('#settings-tabs button').forEach(function(b) {
    b.classList.remove('filter-active');
    b.style.background = '';
    b.style.color = '';
  });
  btn.classList.add('filter-active');
  if (tab === 'weights') loadWeightsTab();
  if (tab === 'departments') loadDepartmentsTab();
}

// === ВАГИ АКТИВНОСТЕЙ ===

var allCategories = {}; // зберігаємо всі категорії (включно з довільними)

async function loadWeightsTab() {
  var container = document.getElementById('settings-content');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var result = await db.from('activity_types').select('*').order('sort_order');
  if (result.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка: ' + result.error.message + '</div>';
    return;
  }

  var types = result.data || [];

  // Зібрати всі категорії (включно з довільними, що вже є в БД)
  allCategories = Object.assign({}, CATEGORY_PRESETS);
  types.forEach(function(t) {
    if (t.category && !allCategories[t.category]) {
      allCategories[t.category] = t.category; // довільна категорія
    }
  });

  var html = '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">' +
    '<button class="btn btn-primary" onclick="openCreateActivityType()">+ Новий тип активності</button>' +
  '</div>';

  html += '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
      '<thead><tr style="border-bottom:2px solid var(--border);">' +
        '<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;">Тип активності</th>' +
        '<th style="padding:12px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:12px;">Вага</th>' +
        '<th style="padding:12px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:12px;">Мультиплікатори</th>' +
        '<th style="padding:12px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:12px;">Статус</th>' +
        '<th style="padding:12px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:12px;">Дії</th>' +
      '</tr></thead><tbody>';

  types.forEach(function(t) {
    var multiplierText = '—';
    if (t.multipliers && t.multipliers.ranges) {
      multiplierText = t.multipliers.ranges.map(function(r) {
        var range = r.min + (r.max ? '-' + r.max : '+');
        return range + ': x' + r.multiplier;
      }).join(', ');
    }

    var catLabel = allCategories[t.category] || t.category || '—';

    html += '<tr style="border-bottom:1px solid var(--border-light);">' +
      '<td style="padding:12px 16px;">' +
        '<div style="font-weight:600;font-size:13px;">' + t.name + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);">' + catLabel + '</div>' +
      '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' +
        '<span style="font-family:\'Plus Jakarta Sans\';font-weight:700;font-size:16px;color:var(--accent-deep);">' + t.base_weight + '</span>' +
      '</td>' +
      '<td style="padding:12px 16px;text-align:center;font-size:12px;color:var(--text-secondary);">' + multiplierText + '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' +
        '<span style="color:' + (t.is_active ? 'var(--green)' : 'var(--red)') + ';">' + (t.is_active ? 'Активний' : 'Вимкнений') + '</span>' +
      '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' +
        '<button class="btn btn-secondary" style="font-size:12px;padding:4px 12px;" onclick="openEditWeight(\'' + t.id + '\')">Змінити</button>' +
      '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div></div>';
  container.innerHTML = html;
}

// === СТВОРЕННЯ ТИПУ АКТИВНОСТІ ===

function buildCategorySelect(selectedKey, selectId) {
  var html = '<select class="form-input" id="' + selectId + '" onchange="onCategoryChange(\'' + selectId + '\')">';
  Object.keys(allCategories).forEach(function(key) {
    html += '<option value="' + key + '"' + (key === selectedKey ? ' selected' : '') + '>' + allCategories[key] + '</option>';
  });
  html += '<option value="__custom__">+ Додати свою категорію...</option>';
  html += '</select>' +
    '<input class="form-input" id="' + selectId + '-custom" placeholder="Назва нової категорії" style="display:none;margin-top:6px;">';
  return html;
}

function onCategoryChange(selectId) {
  var select = document.getElementById(selectId);
  var customInput = document.getElementById(selectId + '-custom');
  if (select.value === '__custom__') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
    customInput.value = '';
  }
}

function getSelectedCategory(selectId) {
  var select = document.getElementById(selectId);
  if (select.value === '__custom__') {
    var customInput = document.getElementById(selectId + '-custom');
    var customVal = customInput.value.trim();
    if (!customVal) return null;
    // Конвертувати в snake_case для збереження
    return customVal.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zа-яіїєґ0-9_]/g, '');
  }
  return select.value;
}

function openCreateActivityType() {
  var modal = document.getElementById('weight-modal');
  var content = document.getElementById('weight-modal-content');
  modal.style.display = 'block';

  content.innerHTML = '<h3 style="font-size:18px;margin-bottom:20px;">Новий тип активності</h3>' +

    '<div class="form-group">' +
      '<label class="form-label">Назва</label>' +
      '<input class="form-input" id="new-type-name" placeholder="Наприклад: Укладення меморандуму про співпрацю">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Опис/підказка</label>' +
      '<input class="form-input" id="new-type-desc" placeholder="Короткий опис для підказки при виборі">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Категорія</label>' +
      buildCategorySelect('field_visit', 'new-type-category') +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Базова вага (балів)</label>' +
      '<input class="form-input" type="number" step="0.5" id="new-type-weight" value="5" min="0">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Чи потрібно вказувати заклад?</label>' +
      '<select class="form-input" id="new-type-requires-inst">' +
        '<option value="true">Так</option>' +
        '<option value="false">Ні</option>' +
      '</select>' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Мультиплікатори за кількістю учасників</label>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Діапазон "Від — До : множник". Порожнє "До" означає "і більше".</div>' +
      '<div id="new-type-ranges">' +
        rangeRow('new', 0, 1, 9, 1.0) +
        rangeRow('new', 1, 10, 19, 1.2) +
        rangeRow('new', 2, 20, '', 1.5) +
      '</div>' +
    '</div>' +

    '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="createActivityType()">Створити</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="closeWeightModal()">Скасувати</button>' +
    '</div>';
}

function rangeRow(prefix, index, min, max, mult) {
  return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">' +
    '<span style="font-size:13px;color:var(--text-muted);min-width:24px;">' + (index + 1) + '.</span>' +
    '<input class="form-input" type="number" id="' + prefix + '-range-min-' + index + '" value="' + min + '" style="width:60px;padding:6px;" placeholder="Від">' +
    '<span>—</span>' +
    '<input class="form-input" type="number" id="' + prefix + '-range-max-' + index + '" value="' + max + '" style="width:60px;padding:6px;" placeholder="До">' +
    '<span style="font-size:13px;">: x</span>' +
    '<input class="form-input" type="number" step="0.1" id="' + prefix + '-range-mult-' + index + '" value="' + mult + '" style="width:70px;padding:6px;">' +
  '</div>';
}

function collectRanges(prefix) {
  var ranges = [];
  for (var i = 0; i < 10; i++) {
    var minEl = document.getElementById(prefix + '-range-min-' + i);
    if (!minEl) break;
    var maxEl = document.getElementById(prefix + '-range-max-' + i);
    var multEl = document.getElementById(prefix + '-range-mult-' + i);
    var min = parseInt(minEl.value);
    var max = maxEl.value ? parseInt(maxEl.value) : null;
    var mult = parseFloat(multEl.value);
    if (!isNaN(min) && !isNaN(mult)) {
      ranges.push({ min: min, max: max, multiplier: mult });
    }
  }
  return ranges;
}

async function createActivityType() {
  var name = document.getElementById('new-type-name').value.trim();
  var desc = document.getElementById('new-type-desc').value.trim();
  var category = getSelectedCategory('new-type-category');
  var weight = parseFloat(document.getElementById('new-type-weight').value);
  var requiresInst = document.getElementById('new-type-requires-inst').value === 'true';

  if (!name) { alert('Вкажіть назву типу активності'); return; }
  if (!category) { alert('Вкажіть категорію'); return; }
  if (isNaN(weight) || weight < 0) { alert('Вкажіть коректну вагу'); return; }

  var ranges = collectRanges('new');

  var countResult = await db.from('activity_types').select('id', { count: 'exact', head: true });
  var sortOrder = (countResult.count || 0) + 1;

  var data = {
    name: name,
    description: desc,
    category: category,
    base_weight: weight,
    requires_institution: requiresInst,
    multipliers: { ranges: ranges },
    sort_order: sortOrder,
    is_active: true,
    is_custom: true
  };

  var result = await db.from('activity_types').insert(data);
  if (result.error) { alert('Помилка: ' + result.error.message); return; }

  closeWeightModal();
  loadWeightsTab();
}

// === РЕДАГУВАННЯ ТИПУ ===

async function openEditWeight(typeId) {
  var modal = document.getElementById('weight-modal');
  var content = document.getElementById('weight-modal-content');
  modal.style.display = 'block';
  content.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var result = await db.from('activity_types').select('*').eq('id', typeId).single();
  if (result.error || !result.data) {
    content.innerHTML = '<div class="alert alert-error">Помилка завантаження</div>';
    return;
  }

  var t = result.data;
  var ranges = (t.multipliers && t.multipliers.ranges) || [];

  var rangesHtml = '';
  ranges.forEach(function(r, i) {
    rangesHtml += rangeRow('edit', i, r.min, r.max || '', r.multiplier);
  });

  content.innerHTML = '<h3 style="font-size:18px;margin-bottom:20px;">Редагувати тип активності</h3>' +

    '<div class="form-group">' +
      '<label class="form-label">Назва</label>' +
      '<input class="form-input" id="edit-type-name" value="' + t.name + '">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Категорія</label>' +
      buildCategorySelect(t.category, 'edit-type-category') +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Базова вага</label>' +
      '<input class="form-input" type="number" step="0.5" id="edit-weight-base" value="' + t.base_weight + '">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Мультиплікатори</label>' +
      '<div id="weight-ranges">' + rangesHtml + '</div>' +
    '</div>' +

    '<div class="form-group">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
        '<input type="checkbox" id="edit-weight-active"' + (t.is_active ? ' checked' : '') + '>' +
        '<span class="form-label" style="margin:0;">Активний</span>' +
      '</label>' +
    '</div>' +

    '<input type="hidden" id="edit-weight-ranges-count" value="' + ranges.length + '">' +

    '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="saveWeight(\'' + t.id + '\')">Зберегти</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="closeWeightModal()">Скасувати</button>' +
    '</div>';
}

async function saveWeight(typeId) {
  var name = document.getElementById('edit-type-name').value.trim();
  var category = getSelectedCategory('edit-type-category');
  var baseWeight = parseFloat(document.getElementById('edit-weight-base').value);
  var isActive = document.getElementById('edit-weight-active').checked;

  if (!name) { alert('Вкажіть назву'); return; }
  if (isNaN(baseWeight) || baseWeight < 0) { alert('Вкажіть коректну вагу'); return; }

  var rangesCount = parseInt(document.getElementById('edit-weight-ranges-count').value);
  var ranges = [];
  for (var i = 0; i < rangesCount; i++) {
    var min = parseInt(document.getElementById('edit-range-min-' + i).value);
    var max = document.getElementById('edit-range-max-' + i).value;
    var mult = parseFloat(document.getElementById('edit-range-mult-' + i).value);
    if (!isNaN(min) && !isNaN(mult)) {
      ranges.push({ min: min, max: max ? parseInt(max) : null, multiplier: mult });
    }
  }

  var updateData = {
    name: name,
    base_weight: baseWeight,
    is_active: isActive,
    multipliers: { ranges: ranges },
    updated_at: new Date().toISOString()
  };
  if (category) updateData.category = category;

  var result = await db.from('activity_types').update(updateData).eq('id', typeId);
  if (result.error) { alert('Помилка: ' + result.error.message); return; }

  closeWeightModal();
  loadWeightsTab();
}

function closeWeightModal() {
  document.getElementById('weight-modal').style.display = 'none';
}

// === ПІДРОЗДІЛИ ===

async function loadDepartmentsTab() {
  var container = document.getElementById('settings-content');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var result = await db.from('departments').select('*').order('type, name');
  if (result.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка: ' + result.error.message + '</div>';
    return;
  }

  var depts = result.data || [];
  var faculties = depts.filter(function(d) { return d.type === 'faculty'; });
  var departments = depts.filter(function(d) { return d.type === 'department'; });
  var units = depts.filter(function(d) { return d.type === 'unit'; });

  var FCOLORS = { 'ФОіФ': '#F0AA33', 'ФМіМ': '#6B2FA4', 'АФ': '#1B8C4E', 'ІТФ': '#A0673C', 'ФВМ': '#2B62A0', 'БФ': '#B82025', 'ФВІіЕ': '#1A9EBF' };

  var html = '<div class="card" style="margin-bottom:16px;"><div class="card-body">' +
    '<h3 style="font-size:16px;margin-bottom:12px;">Факультети (' + faculties.length + ')</h3>' +
    '<div style="display:grid;gap:8px;">';

  faculties.forEach(function(f) {
    var color = FCOLORS[f.short_name] || 'var(--text-secondary)';
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-warm);border-radius:var(--r2);">' +
      '<div style="width:12px;height:12px;border-radius:4px;background:' + color + ';"></div>' +
      '<div style="flex:1;"><span style="font-weight:600;">' + f.short_name + '</span> — ' + f.name + '</div>' +
      '<span style="font-size:13px;color:var(--text-muted);">Штат: ' + (f.staff_count || '—') + '</span>' +
    '</div>';
  });
  html += '</div></div></div>';

  html += '<div class="card" style="margin-bottom:16px;"><div class="card-body">' +
    '<h3 style="font-size:16px;margin-bottom:12px;">Кафедри (' + departments.length + ')</h3>' +
    '<div style="font-size:13px;color:var(--text-secondary);">';

  faculties.forEach(function(f) {
    var kafedry = departments.filter(function(d) { return d.parent_id === f.id; });
    if (kafedry.length > 0) {
      html += '<div style="margin-bottom:12px;">' +
        '<div style="font-weight:600;color:var(--text-primary);margin-bottom:4px;">' + f.short_name + ':</div>';
      kafedry.forEach(function(k) {
        html += '<div style="padding:2px 0 2px 16px;">· ' + k.name + '</div>';
      });
      html += '</div>';
    }
  });
  html += '</div></div></div>';

  if (units.length > 0) {
    html += '<div class="card"><div class="card-body">' +
      '<h3 style="font-size:16px;margin-bottom:12px;">Інші підрозділи (' + units.length + ')</h3>';
    units.forEach(function(u) { html += '<div style="padding:4px 0;">' + u.name + '</div>'; });
    html += '</div></div>';
  }

  container.innerHTML = html;
}

// pages/new-activity.js — Форма "Новий захід" (wizard)

var wizardData = {};
var activityTypes = [];
var currentStep = 1;
var totalSteps = 4;

registerPage('new-activity', {
  render: function(user) {
    return '' +
      '<div style="max-width:680px;">' +
        '<h2 style="font-size:20px;margin-bottom:4px;">Новий захід</h2>' +
        '<p style="color:var(--text-muted);font-size:14px;margin-bottom:24px;">Заповніть інформацію про профорієнтаційну активність</p>' +

        // Індикатор кроків
        '<div class="wizard-steps" id="wizard-steps">' +
          wizardStepHTML(1, 'Тип заходу', true, false) +
          '<div class="wizard-step-line"></div>' +
          wizardStepHTML(2, 'Заклад', false, false) +
          '<div class="wizard-step-line"></div>' +
          wizardStepHTML(3, 'Деталі', false, false) +
          '<div class="wizard-step-line"></div>' +
          wizardStepHTML(4, 'Перегляд', false, false) +
        '</div>' +

        // Контент кроків
        '<div id="wizard-content" class="card"><div class="card-body">Завантаження...</div></div>' +

        // Кнопки навігації
        '<div style="display:flex;justify-content:space-between;margin-top:16px;" id="wizard-nav">' +
          '<button class="btn btn-secondary" id="wizard-prev" onclick="wizardPrev()" style="display:none">← Назад</button>' +
          '<div style="flex:1"></div>' +
          '<button class="btn btn-primary" id="wizard-next" onclick="wizardNext()">Далі →</button>' +
        '</div>' +
      '</div>';
  },

  init: async function(user) {
    wizardData = {
      department_id: user.department_id,
      created_by: user.id
    };
    currentStep = 1;

    // Завантажити типи активностей
    var result = await db
      .from('activity_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!result.error) {
      activityTypes = result.data;
    }

    renderWizardStep();
  }
});

function wizardStepHTML(num, label, active, done) {
  var cls = 'wizard-step';
  if (active) cls += ' active';
  if (done) cls += ' done';
  return '<div class="' + cls + '" id="wstep-' + num + '">' +
    '<div class="wizard-step-num">' + (done ? '✓' : num) + '</div>' +
    '<span class="wizard-step-label">' + label + '</span>' +
  '</div>';
}

function updateWizardSteps() {
  var labels = ['Тип заходу', 'Заклад', 'Деталі', 'Перегляд'];
  for (var i = 1; i <= totalSteps; i++) {
    var el = document.getElementById('wstep-' + i);
    if (!el) continue;
    el.className = 'wizard-step';
    if (i < currentStep) el.classList.add('done');
    if (i === currentStep) el.classList.add('active');
    el.querySelector('.wizard-step-num').textContent = (i < currentStep) ? '✓' : i;
    el.querySelector('.wizard-step-label').textContent = labels[i - 1];
  }

  // Кнопки
  var prevBtn = document.getElementById('wizard-prev');
  var nextBtn = document.getElementById('wizard-next');
  if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
  if (nextBtn) {
    if (currentStep === totalSteps) {
      nextBtn.textContent = '✓ Зберегти як чернетку';
      nextBtn.className = 'btn btn-success';
    } else {
      nextBtn.textContent = 'Далі →';
      nextBtn.className = 'btn btn-primary';
    }
  }
}

function renderWizardStep() {
  var container = document.getElementById('wizard-content');
  if (!container) return;

  var html = '<div class="card-body">';

  if (currentStep === 1) {
    html += stepActivityType();
  } else if (currentStep === 2) {
    html += stepInstitution();
  } else if (currentStep === 3) {
    html += stepDetails();
  } else if (currentStep === 4) {
    html += stepReview();
  }

  html += '</div>';
  container.innerHTML = html;
  updateWizardSteps();

  // Відновити вибрані значення
  if (currentStep === 1 && wizardData.activity_type_id) {
    var radio = document.querySelector('input[name="activity_type"][value="' + wizardData.activity_type_id + '"]');
    if (radio) radio.checked = true;
  }
}

// ===== КРОК 1: Тип заходу =====
function stepActivityType() {
  var html = '<h3 style="font-size:16px;margin-bottom:16px;">Оберіть тип заходу</h3>';

  if (activityTypes.length === 0) {
    html += '<div class="alert alert-info">Типи активностей не завантажені. Перевірте підключення до бази даних.</div>';
    return html;
  }

  // Групування за категорією
  var categories = {
    'field_visit': { label: '🏫 Виїзні зустрічі', items: [] },
    'online': { label: '💻 Онлайн', items: [] },
    'internal': { label: '🎓 В університеті', items: [] },
    'external_event': { label: '🎪 Зовнішні заходи', items: [] },
    'other': { label: '📌 Інше', items: [] }
  };

  activityTypes.forEach(function(t) {
    var cat = categories[t.category] || categories['other'];
    cat.items.push(t);
  });

  Object.keys(categories).forEach(function(key) {
    var cat = categories[key];
    if (cat.items.length === 0) return;

    html += '<div style="margin-bottom:16px;">' +
      '<div style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">' + cat.label + '</div>';

    cat.items.forEach(function(t) {
      var checked = wizardData.activity_type_id === t.id ? ' checked' : '';
      html += '<label style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--border-light);border-radius:10px;margin-bottom:6px;cursor:pointer;transition:all 0.15s;" ' +
        'onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-light)\'">' +
        '<input type="radio" name="activity_type" value="' + t.id + '"' + checked + ' ' +
          'onchange="selectActivityType(this.value)" style="accent-color:var(--accent);width:18px;height:18px;">' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:500;">' + t.name + '</div>' +
          (t.description ? '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + t.description + '</div>' : '') +
        '</div>' +
        '<div style="font-size:12px;color:var(--accent-deep);font-weight:700;background:var(--accent-glow);padding:2px 8px;border-radius:8px;">' +
          t.base_weight + ' б.' +
        '</div>' +
      '</label>';
    });

    html += '</div>';
  });

  return html;
}

function selectActivityType(typeId) {
  wizardData.activity_type_id = typeId;
  var type = activityTypes.find(function(t) { return t.id === typeId; });
  if (type) {
    wizardData._typeName = type.name;
    wizardData._baseWeight = type.base_weight;
    wizardData._requiresInstitution = type.requires_institution;
    wizardData._multipliers = type.multipliers;
  }
}

// ===== КРОК 2: Заклад =====
function stepInstitution() {
  var html = '<h3 style="font-size:16px;margin-bottom:16px;">Заклад освіти</h3>';

  if (!wizardData._requiresInstitution) {
    html += '<div class="alert alert-info">Для цього типу заходу заклад не обов\'язковий. Можете пропустити або вказати для звітності.</div>';
  }

  html += '<div class="form-group">' +
    '<label class="form-label">Оберіть зі списку або введіть вручну</label>' +
    '<input class="form-input" type="text" id="institution-search" placeholder="Почніть вводити назву закладу..." ' +
      'oninput="searchInstitutions(this.value)" autocomplete="off"' +
      (wizardData.custom_institution_name ? ' value="' + wizardData.custom_institution_name + '"' : '') + '>' +
    '<div class="form-hint">Якщо закладу немає у списку — просто впишіть назву</div>' +
  '</div>' +

  '<div id="institution-results" style="margin-bottom:16px;"></div>' +

  // Чекбокс для меморандуму
  '<div style="margin-top:16px;padding:14px;background:var(--accent-glow);border:1px solid rgba(240,170,51,0.2);border-radius:12px;">' +
    '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">' +
      '<input type="checkbox" id="has-memorandum" style="accent-color:var(--accent);width:18px;height:18px;margin-top:2px;"' +
        (wizardData.has_memorandum ? ' checked' : '') +
        ' onchange="wizardData.has_memorandum = this.checked">' +
      '<div>' +
        '<div style="font-size:14px;font-weight:600;">📝 Укладено меморандум про співпрацю</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Додатковий бал за укладення меморандуму із закладом освіти</div>' +
      '</div>' +
    '</label>' +
  '</div>';

  return html;
}

async function searchInstitutions(query) {
  var container = document.getElementById('institution-results');
  if (!container) return;

  if (query.length < 2) {
    container.innerHTML = '';
    wizardData.institution_id = null;
    wizardData.custom_institution_name = query;
    return;
  }

  var result = await db
    .from('institutions')
    .select('id, name, city, type')
    .ilike('name', '%' + query + '%')
    .limit(5);

  if (result.error || !result.data || result.data.length === 0) {
    container.innerHTML = '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;">Закладів не знайдено — буде збережено як введено</div>';
    wizardData.institution_id = null;
    wizardData.custom_institution_name = query;
    return;
  }

  var html = '';
  result.data.forEach(function(inst) {
    html += '<div style="padding:8px 12px;border:1px solid var(--border-light);border-radius:8px;margin-bottom:4px;cursor:pointer;font-size:14px;transition:background 0.15s;" ' +
      'onclick="pickInstitution(\'' + inst.id + '\', \'' + inst.name.replace(/'/g, "\\'") + '\')" ' +
      'onmouseover="this.style.background=\'var(--accent-glow)\'" onmouseout="this.style.background=\'transparent\'">' +
      '<div style="font-weight:500;">' + inst.name + '</div>' +
      (inst.city ? '<div style="font-size:12px;color:var(--text-muted);">' + inst.city + '</div>' : '') +
    '</div>';
  });

  container.innerHTML = html;
}

function pickInstitution(id, name) {
  wizardData.institution_id = id;
  wizardData.custom_institution_name = null;
  wizardData._institutionName = name;
  document.getElementById('institution-search').value = name;
  document.getElementById('institution-results').innerHTML =
    '<div style="font-size:13px;color:var(--green);padding:4px 0;">✓ Обрано: ' + name + '</div>';
}

// ===== КРОК 3: Деталі =====
function stepDetails() {
  var html = '<h3 style="font-size:16px;margin-bottom:16px;">Деталі заходу</h3>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

    '<div class="form-group">' +
      '<label class="form-label">Дата заходу</label>' +
      '<input class="form-input" type="date" id="event-date" value="' + (wizardData.event_date || today()) + '" onchange="wizardData.event_date=this.value;calcScore()">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Кількість учасників</label>' +
      '<input class="form-input" type="number" id="participants" min="0" value="' + (wizardData.participants_count || '') + '" placeholder="0" onchange="wizardData.participants_count=parseInt(this.value)||0;calcScore()">' +
    '</div>' +

  '</div>' +

  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

    '<div class="form-group">' +
      '<label class="form-label">Паперові анкети</label>' +
      '<input class="form-input" type="number" id="paper-forms" min="0" value="' + (wizardData.paper_forms_count || 0) + '" onchange="wizardData.paper_forms_count=parseInt(this.value)||0;calcScore()">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Електронні анкети</label>' +
      '<input class="form-input" type="number" id="electronic-forms" min="0" value="' + (wizardData.electronic_forms_count || 0) + '" onchange="wizardData.electronic_forms_count=parseInt(this.value)||0;calcScore()">' +
    '</div>' +

  '</div>' +

  // Контактна особа
  '<div style="border-top:1px solid var(--border-light);padding-top:16px;margin-top:8px;">' +
    '<div style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:10px;">Контактна особа закладу (необов\'язково)</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="form-group">' +
        '<input class="form-input" type="text" id="contact-name" placeholder="ПІБ" value="' + (wizardData.contact_person_name || '') + '" onchange="wizardData.contact_person_name=this.value">' +
      '</div>' +
      '<div class="form-group">' +
        '<input class="form-input" type="tel" id="contact-phone" placeholder="Телефон" value="' + (wizardData.contact_person_phone || '') + '" onchange="wizardData.contact_person_phone=this.value">' +
      '</div>' +
    '</div>' +
  '</div>' +

  // Примітка
  '<div class="form-group">' +
    '<label class="form-label">Примітка (необов\'язково)</label>' +
    '<textarea class="form-textarea" id="notes" placeholder="Додаткова інформація..." onchange="wizardData.notes=this.value">' + (wizardData.notes || '') + '</textarea>' +
  '</div>' +

  // Попередній бал
  '<div class="score-preview" id="score-preview">' +
    '<div>' +
      '<div class="score-preview-label">Попередній бал</div>' +
      '<div class="score-preview-hint" id="score-formula"></div>' +
    '</div>' +
    '<div class="score-preview-value" id="score-value">—</div>' +
  '</div>';

  return html;
}

function calcScore() {
  var type = activityTypes.find(function(t) { return t.id === wizardData.activity_type_id; });
  if (!type) return;

  var base = type.base_weight;
  var participants = wizardData.participants_count || 0;
  var paper = wizardData.paper_forms_count || 0;
  var electronic = wizardData.electronic_forms_count || 0;

  // Визначити мультиплікатор
  var mult = 1;
  if (type.multipliers && type.multipliers.ranges) {
    type.multipliers.ranges.forEach(function(r) {
      if (participants >= r.min && (r.max === null || participants <= r.max)) {
        mult = r.multiplier;
      }
    });
  }

  var score = base * mult + paper * 0.2 + electronic * 0.2;
  score = Math.round(score * 10) / 10;

  wizardData.preliminary_score = score;

  var scoreEl = document.getElementById('score-value');
  var formulaEl = document.getElementById('score-formula');
  if (scoreEl) scoreEl.textContent = score;
  if (formulaEl) formulaEl.textContent = base + ' × ' + mult + ' + (' + paper + ' + ' + electronic + ') × 0.2';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ===== КРОК 4: Перегляд =====
function stepReview() {
  calcScore();

  var instName = wizardData._institutionName || wizardData.custom_institution_name || '—';
  var html = '<h3 style="font-size:16px;margin-bottom:16px;">Перевірте дані</h3>';

  html += '<div style="display:flex;flex-direction:column;gap:8px;">';

  html += reviewRow('Тип заходу', wizardData._typeName || '—');
  html += reviewRow('Заклад', instName);
  if (wizardData.has_memorandum) {
    html += reviewRow('Меморандум', '✅ Укладено');
  }
  html += reviewRow('Дата', formatDate(wizardData.event_date));
  html += reviewRow('Учасників', wizardData.participants_count || 0);
  html += reviewRow('Паперові анкети', wizardData.paper_forms_count || 0);
  html += reviewRow('Електронні анкети', wizardData.electronic_forms_count || 0);
  if (wizardData.contact_person_name) {
    html += reviewRow('Контактна особа', wizardData.contact_person_name + (wizardData.contact_person_phone ? ', ' + wizardData.contact_person_phone : ''));
  }
  if (wizardData.notes) {
    html += reviewRow('Примітка', wizardData.notes);
  }

  html += '</div>';

  // Бал
  html += '<div class="score-preview" style="margin-top:20px;">' +
    '<div><div class="score-preview-label">Попередній бал</div></div>' +
    '<div class="score-preview-value">' + (wizardData.preliminary_score || '—') + '</div>' +
  '</div>';

  // Кнопка "Подати на перевірку"
  html += '<div style="margin-top:16px;text-align:center;">' +
    '<button class="btn btn-success btn-lg" onclick="submitActivity()" style="gap:6px;">📤 Зберегти і подати на перевірку</button>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Або натисніть "Зберегти як чернетку" щоб зберегти без подачі</div>' +
  '</div>';

  return html;
}

function reviewRow(label, value) {
  return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:14px;">' +
    '<span style="color:var(--text-muted);">' + label + '</span>' +
    '<span style="font-weight:600;">' + value + '</span>' +
  '</div>';
}

function formatDate(d) {
  if (!d) return '—';
  var parts = d.split('-');
  return parts[2] + '.' + parts[1] + '.' + parts[0];
}

// ===== НАВІГАЦІЯ =====
function wizardNext() {
  // Валідація поточного кроку
  if (currentStep === 1 && !wizardData.activity_type_id) {
    alert('Оберіть тип заходу');
    return;
  }

  if (currentStep === 3) {
    if (!wizardData.event_date) wizardData.event_date = today();
    calcScore();
  }

  if (currentStep === totalSteps) {
    saveDraft();
    return;
  }

  currentStep++;
  renderWizardStep();
  window.scrollTo(0, 0);
}

function wizardPrev() {
  if (currentStep > 1) {
    currentStep--;
    renderWizardStep();
  }
}

// ===== ЗБЕРЕЖЕННЯ =====
async function saveDraft() {
  await saveActivity('draft');
}

async function submitActivity() {
  await saveActivity('submitted');
}

async function saveActivity(status) {
  var btn = event.target || document.querySelector('#wizard-nav .btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }

  var record = {
    department_id: wizardData.department_id,
    activity_type_id: wizardData.activity_type_id,
    institution_id: wizardData.institution_id || null,
    custom_institution_name: wizardData.institution_id ? null : (wizardData.custom_institution_name || null),
    event_date: wizardData.event_date || today(),
    participants_count: wizardData.participants_count || 0,
    paper_forms_count: wizardData.paper_forms_count || 0,
    electronic_forms_count: wizardData.electronic_forms_count || 0,
    contact_person_name: wizardData.contact_person_name || null,
    contact_person_phone: wizardData.contact_person_phone || null,
    notes: wizardData.notes || null,
    status: status,
    preliminary_score: wizardData.preliminary_score || 0,
    created_by: wizardData.created_by
  };

  var result = await db
    .from('activities')
    .insert(record)
    .select()
    .single();

  if (result.error) {
    alert('Помилка збереження: ' + result.error.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Спробувати ще'; }
    return;
  }

  // Успіх — перейти на список заходів
  var msg = status === 'submitted' ? 'подано на перевірку' : 'збережено як чернетку';
  alert('Захід успішно ' + msg + '!');
  navigateTo('activities');
}

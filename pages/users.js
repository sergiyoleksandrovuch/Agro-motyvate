// pages/users.js — Управління користувачами (admin) — оновлено

registerPage('users', {
  render: function(user) {
    if (user.role !== 'admin') {
      return '<div style="padding:40px;text-align:center;color:var(--text-muted);">Доступ лише для адміністратора</div>';
    }

    return '' +
      '<div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
          '<div>' +
            '<h2 style="font-size:20px;">Користувачі</h2>' +
            '<p style="color:var(--text-muted);font-size:14px;">Управління акаунтами системи</p>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="openCreateUser()">+ Додати користувача</button>' +
        '</div>' +
        '<div id="users-list">Завантаження...</div>' +
      '</div>' +

      // Модальне вікно редагування
      '<div id="user-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;padding:20px;overflow-y:auto;">' +
        '<div style="max-width:480px;margin:40px auto;background:var(--bg-card);border-radius:var(--r4);padding:28px;position:relative;">' +
          '<button onclick="closeUserModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>' +
          '<div id="user-modal-content"></div>' +
        '</div>' +
      '</div>';
  },

  init: async function(user) {
    if (user.role === 'admin') {
      await loadUsers();
    }
  }
});

var allDepartments = [];

async function loadUsers() {
  var container = document.getElementById('users-list');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var result = await db
    .from('profiles')
    .select('*, departments(name, short_name)')
    .order('full_name');

  // Завантажити підрозділи для форм
  var deptResult = await db.from('departments')
    .select('id, name, short_name, type')
    .eq('is_active', true)
    .order('type, name');

  allDepartments = deptResult.data || [];

  if (result.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка: ' + result.error.message + '</div>';
    return;
  }

  var users = result.data || [];

  if (users.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;">' +
      '<p style="color:var(--text-muted);">Користувачів не знайдено</p>' +
    '</div></div>';
    return;
  }

  var html = '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
      '<thead><tr style="border-bottom:2px solid var(--border);">' +
        '<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;">ПІБ</th>' +
        '<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;">Роль</th>' +
        '<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;">Підрозділ</th>' +
        '<th style="padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:12px;">Посада</th>' +
        '<th style="padding:12px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:12px;">Дії</th>' +
      '</tr></thead><tbody>';

  var roleLabels = { admin: 'Адмін', verifier: 'Верифікатор', rectorate: 'Ректорат', participant: 'Учасник' };
  var roleColors = { admin: 'var(--accent-deep)', verifier: 'var(--blue)', rectorate: 'var(--green)', participant: 'var(--text-secondary)' };

  users.forEach(function(u) {
    var deptName = u.departments ? u.departments.short_name : '—';
    var roleName = roleLabels[u.role] || u.role;
    var roleColor = roleColors[u.role] || 'var(--text-secondary)';

    html += '<tr style="border-bottom:1px solid var(--border-light);">' +
      '<td style="padding:12px 16px;">' +
        '<div style="font-weight:600;">' + u.full_name + '</div>' +
      '</td>' +
      '<td style="padding:12px 16px;">' +
        '<span style="font-size:12px;font-weight:600;color:' + roleColor + ';background:' + roleColor + '15;padding:3px 8px;border-radius:6px;">' + roleName + '</span>' +
      '</td>' +
      '<td style="padding:12px 16px;color:var(--text-secondary);">' + deptName + '</td>' +
      '<td style="padding:12px 16px;color:var(--text-secondary);font-size:13px;">' + (u.position || '—') + '</td>' +
      '<td style="padding:12px 16px;text-align:center;">' +
        '<button class="btn btn-secondary" style="font-size:12px;padding:4px 12px;" onclick="openEditUser(\'' + u.id + '\')">Редагувати</button>' +
      '</td>' +
    '</tr>';
  });

  html += '</tbody></table></div></div>';
  container.innerHTML = html;
}

function buildDeptOptions(selectedId) {
  var options = '';
  var currentGroup = '';
  var typeLabels = { faculty: 'Факультети', department: 'Кафедри', unit: 'Інші' };

  allDepartments.forEach(function(d) {
    var groupLabel = typeLabels[d.type] || 'Інші';
    if (groupLabel !== currentGroup) {
      if (currentGroup) options += '</optgroup>';
      options += '<optgroup label="' + groupLabel + '">';
      currentGroup = groupLabel;
    }
    options += '<option value="' + d.id + '"' + (d.id === selectedId ? ' selected' : '') + '>' +
      (d.short_name ? d.short_name + ' — ' : '') + d.name + '</option>';
  });
  if (currentGroup) options += '</optgroup>';
  return options;
}

// === СТВОРЕННЯ НОВОГО КОРИСТУВАЧА ===

function openCreateUser() {
  var modal = document.getElementById('user-modal');
  var content = document.getElementById('user-modal-content');
  modal.style.display = 'block';

  content.innerHTML = '<h3 style="font-size:18px;margin-bottom:20px;">Новий користувач</h3>' +

    '<div class="form-group">' +
      '<label class="form-label">Email (для входу в систему)</label>' +
      '<input class="form-input" id="new-user-email" type="email" placeholder="example@dsaeu.edu.ua">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Пароль</label>' +
      '<div style="display:flex;gap:8px;">' +
        '<input class="form-input" id="new-user-password" type="text" value="" style="flex:1;">' +
        '<button class="btn btn-secondary" onclick="generatePassword()" style="white-space:nowrap;font-size:12px;">Згенерувати</button>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Мінімум 6 символів. Передайте користувачу для входу.</div>' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">ПІБ</label>' +
      '<input class="form-input" id="new-user-name" placeholder="Прізвище Ім\'я По-батькові">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Посада</label>' +
      '<input class="form-input" id="new-user-position" placeholder="Доцент кафедри...">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Роль</label>' +
      '<select class="form-input" id="new-user-role">' +
        '<option value="participant">Учасник</option>' +
        '<option value="verifier">Верифікатор</option>' +
        '<option value="rectorate">Ректорат</option>' +
        '<option value="admin">Адміністратор</option>' +
      '</select>' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Підрозділ</label>' +
      '<select class="form-input" id="new-user-dept">' +
        buildDeptOptions(null) +
      '</select>' +
    '</div>' +

    '<div id="create-user-error" style="display:none;padding:10px;background:var(--red-soft);color:var(--red);border-radius:var(--r2);font-size:13px;margin-bottom:12px;"></div>' +
    '<div id="create-user-success" style="display:none;padding:10px;background:var(--green-soft);color:var(--green);border-radius:var(--r2);font-size:13px;margin-bottom:12px;"></div>' +

    '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="createUser()">Створити</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="closeUserModal()">Скасувати</button>' +
    '</div>';

  generatePassword();
}

function generatePassword() {
  var chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  var pass = '';
  for (var i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('new-user-password').value = pass;
}

async function createUser() {
  var email = document.getElementById('new-user-email').value.trim();
  var password = document.getElementById('new-user-password').value;
  var fullName = document.getElementById('new-user-name').value.trim();
  var position = document.getElementById('new-user-position').value.trim();
  var role = document.getElementById('new-user-role').value;
  var departmentId = document.getElementById('new-user-dept').value;

  var errorDiv = document.getElementById('create-user-error');
  var successDiv = document.getElementById('create-user-success');
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  if (!email || !password || !fullName) {
    errorDiv.textContent = 'Заповніть email, пароль та ПІБ';
    errorDiv.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'Пароль має бути мінімум 6 символів';
    errorDiv.style.display = 'block';
    return;
  }

  // Викликаємо серверну функцію
  var result = await db.rpc('admin_create_user', {
    p_email: email,
    p_password: password,
    p_full_name: fullName,
    p_position: position,
    p_role: role,
    p_department_id: departmentId
  });

  if (result.error) {
    errorDiv.textContent = 'Помилка: ' + result.error.message;
    errorDiv.style.display = 'block';
    return;
  }

  var data = result.data;
  if (data && data.error) {
    errorDiv.textContent = data.error;
    errorDiv.style.display = 'block';
    return;
  }

  successDiv.innerHTML = 'Користувача створено! Дані для входу:<br>' +
    'Email: <span style="font-weight:600;">' + email + '</span><br>' +
    'Пароль: <span style="font-weight:600;">' + password + '</span>';
  successDiv.style.display = 'block';

  // Оновити список
  await loadUsers();
}

// === РЕДАГУВАННЯ КОРИСТУВАЧА ===

async function openEditUser(userId) {
  var modal = document.getElementById('user-modal');
  var content = document.getElementById('user-modal-content');
  modal.style.display = 'block';
  content.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spinner"></span></div>';

  var userResult = await db.from('profiles')
    .select('*, departments(name, short_name)')
    .eq('id', userId)
    .single();

  if (userResult.error || !userResult.data) {
    content.innerHTML = '<div class="alert alert-error">Помилка завантаження</div>';
    return;
  }

  var u = userResult.data;

  content.innerHTML = '<h3 style="font-size:18px;margin-bottom:20px;">Редагувати користувача</h3>' +

    '<div class="form-group">' +
      '<label class="form-label">ПІБ</label>' +
      '<input class="form-input" id="edit-user-name" value="' + (u.full_name || '') + '">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Посада</label>' +
      '<input class="form-input" id="edit-user-position" value="' + (u.position || '') + '">' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Роль</label>' +
      '<select class="form-input" id="edit-user-role">' +
        '<option value="participant"' + (u.role === 'participant' ? ' selected' : '') + '>Учасник</option>' +
        '<option value="verifier"' + (u.role === 'verifier' ? ' selected' : '') + '>Верифікатор</option>' +
        '<option value="rectorate"' + (u.role === 'rectorate' ? ' selected' : '') + '>Ректорат</option>' +
        '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>Адміністратор</option>' +
      '</select>' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label">Підрозділ</label>' +
      '<select class="form-input" id="edit-user-dept">' +
        buildDeptOptions(u.department_id) +
      '</select>' +
    '</div>' +

    '<div style="display:flex;gap:10px;margin-top:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="saveUser(\'' + u.id + '\')">Зберегти</button>' +
      '<button class="btn btn-secondary" style="flex:1;" onclick="closeUserModal()">Скасувати</button>' +
    '</div>';
}

async function saveUser(userId) {
  var data = {
    full_name: document.getElementById('edit-user-name').value.trim(),
    position: document.getElementById('edit-user-position').value.trim(),
    role: document.getElementById('edit-user-role').value,
    department_id: document.getElementById('edit-user-dept').value
  };

  if (!data.full_name) {
    alert('Вкажіть ПІБ');
    return;
  }

  var result = await db
    .from('profiles')
    .update(data)
    .eq('id', userId);

  if (result.error) {
    alert('Помилка: ' + result.error.message);
    return;
  }

  closeUserModal();
  loadUsers();
}

function closeUserModal() {
  document.getElementById('user-modal').style.display = 'none';
}

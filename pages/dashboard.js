// pages/dashboard.js — Головна сторінка

registerPage('dashboard', {
  render: function(user) {
    var name = user.full_name.split(' ')[0]; // Ім'я
    var dept = user.departments ? user.departments.short_name : '';

    return '<div style="max-width:800px;">' +

      // Вітання
      '<div style="background:linear-gradient(135deg,#F0AA33,#E09418,#CC8410);border-radius:20px;padding:28px 32px;color:#fff;margin-bottom:24px;position:relative;overflow:hidden;">' +
        '<div style="position:absolute;top:-50%;right:-8%;width:260px;height:260px;background:rgba(255,255,255,0.07);border-radius:50%;"></div>' +
        '<h2 style="color:#fff;font-size:22px;font-weight:800;margin-bottom:4px;">Вітаємо, ' + name + '! 👋</h2>' +
        '<p style="opacity:0.88;font-size:14px;">Ви увійшли як ' + ROLE_LABELS[user.role] + (dept ? ' · ' + dept : '') + '</p>' +
      '</div>' +

      // Швидкі дії
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">' +
        '<button class="btn btn-primary btn-lg" onclick="navigateTo(\'new-activity\')" style="padding:20px;flex-direction:column;gap:4px;">' +
          '<span style="font-size:24px;">➕</span>' +
          '<span>Новий захід</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-lg" onclick="navigateTo(\'activities\')" style="padding:20px;flex-direction:column;gap:4px;">' +
          '<span style="font-size:24px;">📋</span>' +
          '<span>Мої заходи</span>' +
        '</button>' +
      '</div>' +

      // Інфо-блок
      '<div class="card">' +
        '<div class="card-body" style="text-align:center;padding:40px;">' +
          '<p style="font-size:48px;margin-bottom:12px;">🏗</p>' +
          '<h3 style="margin-bottom:8px;">Dashboard будується</h3>' +
          '<p style="color:var(--text-muted);font-size:14px;">Графіки, рейтинг і статистика з\'являться тут після того, як будуть внесені перші заходи.</p>' +
        '</div>' +
      '</div>' +

    '</div>';
  }
});

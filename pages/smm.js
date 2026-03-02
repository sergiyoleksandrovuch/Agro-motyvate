// pages/smm.js — SMM-метрики (Фаза 2)

var PLATFORMS = {
  instagram: { name: 'Instagram', icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#E1306C" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="#E1306C" stroke="none"/></svg>', color: '#E1306C', bonus: 20 },
  tiktok: { name: 'TikTok', icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#000" stroke-width="1.5"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>', color: '#000000', bonus: 40 },
  facebook: { name: 'Facebook', icon: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#1877F2" stroke-width="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>', color: '#1877F2', bonus: 20 }
};

registerPage('smm', {
  render: function(user) {
    return '' +
      '<div style="max-width:900px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
          '<div>' +
            '<h2 style="font-size:20px;">SMM-метрики</h2>' +
            '<p style="color:var(--text-muted);font-size:14px;">Соціальні мережі підрозділу</p>' +
          '</div>' +
        '</div>' +

        // Профілі соцмереж
        '<div id="smm-profiles" style="margin-bottom:24px;">Завантаження...</div>' +

        // Форма внесення метрик
        '<div id="smm-metrics-section" style="display:none;">' +
          '<div class="card" style="margin-bottom:16px;">' +
            '<div class="card-body">' +
              '<h3 style="font-size:16px;margin-bottom:16px;">Внести метрики</h3>' +

              '<div class="form-group">' +
                '<label class="form-label">Профіль</label>' +
                '<select class="form-input" id="smm-profile-select" onchange="onSmmProfileChange()"></select>' +
              '</div>' +

              '<div class="form-group">' +
                '<label class="form-label">Дата звіту</label>' +
                '<input class="form-input" type="date" id="smm-report-date">' +
              '</div>' +

              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
                '<div class="form-group">' +
                  '<label class="form-label">Підписники (загалом)</label>' +
                  '<input class="form-input" type="number" id="smm-followers" min="0" value="0">' +
                '</div>' +
                '<div class="form-group">' +
                  '<label class="form-label">Приріст підписників за місяць</label>' +
                  '<input class="form-input" type="number" id="smm-growth" min="0" value="0">' +
                '</div>' +
                '<div class="form-group">' +
                  '<label class="form-label">Публікацій за місяць</label>' +
                  '<input class="form-input" type="number" id="smm-posts-monthly" min="0" value="0">' +
                '</div>' +
                '<div class="form-group">' +
                  '<label class="form-label">Публікацій з 1 вересня</label>' +
                  '<input class="form-input" type="number" id="smm-posts-yearly" min="0" value="0">' +
                '</div>' +
              '</div>' +

              '<div id="smm-score-preview" style="padding:12px;background:var(--accent-glow);border-radius:var(--r2);margin-bottom:16px;font-size:14px;display:none;"></div>' +

              '<div style="display:flex;gap:10px;">' +
                '<button class="btn btn-primary" onclick="calculateSmmPreview()">Розрахувати бал</button>' +
                '<button class="btn btn-primary" onclick="saveSmmMetrics()" style="background:var(--green);border-color:var(--green);">Зберегти</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Історія метрик
        '<div id="smm-history"></div>' +
      '</div>' +

      // Модальне вікно додавання профілю
      '<div id="smm-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;padding:20px;overflow-y:auto;">' +
        '<div style="max-width:400px;margin:60px auto;background:var(--bg-card);border-radius:var(--r4);padding:28px;position:relative;">' +
          '<button onclick="closeSmmModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>' +
          '<h3 style="font-size:18px;margin-bottom:16px;">Додати профіль</h3>' +
          '<div class="form-group">' +
            '<label class="form-label">Платформа</label>' +
            '<select class="form-input" id="smm-new-platform">' +
              '<option value="instagram">Instagram</option>' +
              '<option value="tiktok">TikTok</option>' +
              '<option value="facebook">Facebook</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">URL профілю</label>' +
            '<input class="form-input" id="smm-new-url" placeholder="https://instagram.com/...">' +
          '</div>' +
          '<button class="btn btn-primary btn-full" onclick="addSmmProfile()">Додати</button>' +
        '</div>' +
      '</div>';
  },

  init: async function(user) {
    // Встановити дату за замовчуванням
    var today = new Date().toISOString().split('T')[0];
    var dateInput = document.getElementById('smm-report-date');
    if (dateInput) dateInput.value = today;

    await loadSmmProfiles(user);
    await loadSmmHistory(user);
  }
});

var smmProfiles = [];

async function loadSmmProfiles(user) {
  var container = document.getElementById('smm-profiles');
  if (!container) return;

  var result = await db
    .from('smm_profiles')
    .select('*')
    .eq('department_id', user.department_id)
    .eq('is_active', true);

  if (result.error) {
    container.innerHTML = '<div class="alert alert-error">Помилка: ' + result.error.message + '</div>';
    return;
  }

  smmProfiles = result.data || [];

  // Визначити які платформи ще не додані
  var existingPlatforms = smmProfiles.map(function(p) { return p.platform; });
  var missingPlatforms = ['instagram', 'tiktok', 'facebook'].filter(function(p) {
    return existingPlatforms.indexOf(p) === -1;
  });

  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">';

  // Існуючі профілі
  smmProfiles.forEach(function(p) {
    var pl = PLATFORMS[p.platform];
    html += '<div class="card">' +
      '<div class="card-body" style="text-align:center;padding:20px;position:relative;">' +
        '<button onclick="deleteSmmProfile(\'' + p.id + '\',\'' + pl.name + '\')" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;padding:4px;border-radius:6px;color:var(--text-muted);transition:all 0.2s;" onmouseover="this.style.color=\'var(--red)\';this.style.background=\'var(--red-soft)\'" onmouseout="this.style.color=\'var(--text-muted)\';this.style.background=\'none\'" title="Видалити"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
        '<div style="margin-bottom:8px;">' + pl.icon + '</div>' +
        '<div style="font-weight:700;margin-bottom:4px;">' + pl.name + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;word-break:break-all;">' + (p.url || '—') + '</div>' +
        '<span style="font-size:12px;font-weight:600;color:var(--green);background:var(--green-soft);padding:3px 8px;border-radius:6px;">+' + pl.bonus + ' балів</span>' +
      '</div>' +
    '</div>';
  });

  // Кнопка додати
  if (missingPlatforms.length > 0) {
    html += '<div class="card" style="border:2px dashed var(--border);cursor:pointer;" onclick="openSmmModal()">' +
      '<div class="card-body" style="text-align:center;padding:20px;">' +
        '<div style="margin-bottom:8px;"><svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>' +
        '<div style="font-weight:600;color:var(--text-muted);">Додати профіль</div>' +
      '</div>' +
    '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // Оновити select для внесення метрик
  if (smmProfiles.length > 0) {
    document.getElementById('smm-metrics-section').style.display = 'block';
    var select = document.getElementById('smm-profile-select');
    select.innerHTML = smmProfiles.map(function(p) {
      return '<option value="' + p.id + '">' + PLATFORMS[p.platform].icon + ' ' + PLATFORMS[p.platform].name + '</option>';
    }).join('');
  }
}

function openSmmModal() {
  document.getElementById('smm-modal').style.display = 'block';
}

function closeSmmModal() {
  document.getElementById('smm-modal').style.display = 'none';
}

async function addSmmProfile() {
  var platform = document.getElementById('smm-new-platform').value;
  var url = document.getElementById('smm-new-url').value.trim();

  var result = await db
    .from('smm_profiles')
    .insert({
      department_id: currentUser.department_id,
      platform: platform,
      url: url
    });

  if (result.error) {
    if (result.error.message.indexOf('unique') !== -1 || result.error.message.indexOf('duplicate') !== -1) {
      alert('Профіль ' + PLATFORMS[platform].name + ' вже додано для вашого підрозділу');
    } else {
      alert('Помилка: ' + result.error.message);
    }
    return;
  }

  closeSmmModal();
  await loadSmmProfiles(currentUser);
}

function onSmmProfileChange() {
  document.getElementById('smm-score-preview').style.display = 'none';
}

function calculateSmmPreview() {
  var profileId = document.getElementById('smm-profile-select').value;
  var profile = smmProfiles.find(function(p) { return p.id === profileId; });
  if (!profile) return;

  var pl = PLATFORMS[profile.platform];
  var followers = parseInt(document.getElementById('smm-followers').value) || 0;
  var growth = parseInt(document.getElementById('smm-growth').value) || 0;
  var postsMonthly = parseInt(document.getElementById('smm-posts-monthly').value) || 0;
  var postsYearly = parseInt(document.getElementById('smm-posts-yearly').value) || 0;

  var score = pl.bonus + (followers * 0.02) + (postsMonthly * 1) + (postsYearly * 1) + (growth * 0.02);
  score = Math.round(score * 100) / 100;

  var preview = document.getElementById('smm-score-preview');
  preview.style.display = 'block';
  preview.innerHTML = '<div style="display:flex;align-items:center;gap:12px;">' +
    '<div style="font-family:\'Plus Jakarta Sans\';font-weight:800;font-size:24px;color:var(--accent-deep);">' + score + '</div>' +
    '<div style="font-size:13px;color:var(--text-secondary);">' +
      'Наявність: ' + pl.bonus +
      ' + Підписники: ' + (followers * 0.02).toFixed(1) +
      ' + Пости/міс: ' + postsMonthly +
      ' + Пости/рік: ' + postsYearly +
      ' + Приріст: ' + (growth * 0.02).toFixed(1) +
    '</div>' +
  '</div>';

  return score;
}

async function saveSmmMetrics() {
  var profileId = document.getElementById('smm-profile-select').value;
  var reportDate = document.getElementById('smm-report-date').value;

  if (!profileId || !reportDate) {
    alert('Оберіть профіль і дату');
    return;
  }

  var score = calculateSmmPreview();

  var data = {
    profile_id: profileId,
    report_date: reportDate,
    followers_count: parseInt(document.getElementById('smm-followers').value) || 0,
    followers_growth: parseInt(document.getElementById('smm-growth').value) || 0,
    posts_monthly: parseInt(document.getElementById('smm-posts-monthly').value) || 0,
    posts_yearly: parseInt(document.getElementById('smm-posts-yearly').value) || 0,
    score: score,
    status: 'submitted',
    created_by: currentUser.id
  };

  var result = await db.from('smm_metrics').insert(data);

  if (result.error) {
    if (result.error.message.indexOf('unique') !== -1 || result.error.message.indexOf('duplicate') !== -1) {
      alert('Метрики за цю дату для цього профілю вже існують');
    } else {
      alert('Помилка: ' + result.error.message);
    }
    return;
  }

  // Очистити форму
  document.getElementById('smm-followers').value = '0';
  document.getElementById('smm-growth').value = '0';
  document.getElementById('smm-posts-monthly').value = '0';
  document.getElementById('smm-posts-yearly').value = '0';
  document.getElementById('smm-score-preview').style.display = 'none';

  alert('Метрики збережено!');
  await loadSmmHistory(currentUser);
}

async function loadSmmHistory(user) {
  var container = document.getElementById('smm-history');
  if (!container) return;

  // Спочатку отримаємо профілі підрозділу
  var profResult = await db
    .from('smm_profiles')
    .select('id, platform')
    .eq('department_id', user.department_id);

  var profiles = profResult.data || [];
  if (profiles.length === 0) {
    container.innerHTML = '';
    return;
  }

  var profileIds = profiles.map(function(p) { return p.id; });
  var profileMap = {};
  profiles.forEach(function(p) { profileMap[p.id] = p; });

  var result = await db
    .from('smm_metrics')
    .select('*')
    .in('profile_id', profileIds)
    .order('report_date', { ascending: false })
    .limit(20);

  if (result.error || !result.data || result.data.length === 0) {
    container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:24px;color:var(--text-muted);">Ще немає внесених метрик</div></div>';
    return;
  }

  var isVerifier = currentUser.role === 'admin' || currentUser.role === 'verifier';
  var statusLabels = { draft: 'Чернетка', submitted: 'На перевірці', verified: 'Підтверджено', rejected: 'Відхилено' };

  var html = '<h3 style="font-size:16px;margin-bottom:12px;">Історія метрик</h3>' +
    '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
      '<thead><tr style="border-bottom:2px solid var(--border);">' +
        '<th style="padding:10px 12px;text-align:left;color:var(--text-muted);font-size:11px;">Дата</th>' +
        '<th style="padding:10px 12px;text-align:left;color:var(--text-muted);font-size:11px;">Платформа</th>' +
        '<th style="padding:10px 12px;text-align:center;color:var(--text-muted);font-size:11px;">Підписники</th>' +
        '<th style="padding:10px 12px;text-align:center;color:var(--text-muted);font-size:11px;">Приріст</th>' +
        '<th style="padding:10px 12px;text-align:center;color:var(--text-muted);font-size:11px;">Пости/міс</th>' +
        '<th style="padding:10px 12px;text-align:center;color:var(--text-muted);font-size:11px;">Пости/рік</th>' +
        '<th style="padding:10px 12px;text-align:right;color:var(--text-muted);font-size:11px;">Бал</th>' +
        '<th style="padding:10px 12px;text-align:center;color:var(--text-muted);font-size:11px;">Статус</th>' +
        (isVerifier ? '<th style="padding:10px 12px;text-align:center;color:var(--text-muted);font-size:11px;">Дії</th>' : '') +
      '</tr></thead><tbody>';

  result.data.forEach(function(m) {
    var profile = profileMap[m.profile_id];
    var pl = profile ? PLATFORMS[profile.platform] : { icon: '?', name: '?' };
    var st = m.status || 'submitted';
    var stText = statusLabels[st] || st;
    var stClass = 'badge-' + st;

    html += '<tr style="border-bottom:1px solid var(--border-light);">' +
      '<td style="padding:10px 12px;">' + m.report_date + '</td>' +
      '<td style="padding:10px 12px;">' + pl.name + '</td>' +
      '<td style="padding:10px 12px;text-align:center;">' + m.followers_count + '</td>' +
      '<td style="padding:10px 12px;text-align:center;color:var(--green);">+' + m.followers_growth + '</td>' +
      '<td style="padding:10px 12px;text-align:center;">' + m.posts_monthly + '</td>' +
      '<td style="padding:10px 12px;text-align:center;">' + m.posts_yearly + '</td>' +
      '<td style="padding:10px 12px;text-align:right;font-weight:700;color:var(--accent-deep);">' + m.score + '</td>' +
      '<td style="padding:10px 12px;text-align:center;"><span class="badge ' + stClass + '">' + stText + '</span></td>';

    if (isVerifier) {
      html += '<td style="padding:10px 12px;text-align:center;">';
      if (st === 'submitted') {
        html += '<button onclick="verifySmmMetric(\'' + m.id + '\',true)" class="btn btn-success" style="padding:3px 10px;font-size:12px;margin-right:4px;">&#10003;</button>' +
                '<button onclick="verifySmmMetric(\'' + m.id + '\',false)" class="btn btn-danger" style="padding:3px 10px;font-size:12px;">&#10007;</button>';
      } else if (st === 'verified') { html += '<span style="color:var(--green);font-size:14px;">&#10003;</span>'; }
      html += '</td>';
    }
    html += '</tr>';
    if (st === 'rejected' && m.rejection_comment) {
      var cols = isVerifier ? 9 : 8;
      html += '<tr><td colspan="' + cols + '" style="padding:4px 12px 8px;"><div style="padding:6px 10px;background:var(--red-soft);border-radius:6px;font-size:12px;color:var(--red);">' + m.rejection_comment + '</div></td></tr>';
    }
  });

  html += '</tbody></table></div></div>';
  container.innerHTML = html;
}

async function verifySmmMetric(id, approve) {
  if (approve) {
    var result = await db.from('smm_metrics').update({ status: 'verified', verified_by: currentUser.id, verified_at: new Date().toISOString() }).eq('id', id);
    if (result.error) { alert('Помилка: ' + result.error.message); return; }
  } else {
    var comment = prompt('Причина відхилення:');
    if (!comment) return;
    var result = await db.from('smm_metrics').update({ status: 'rejected', rejection_comment: comment, verified_by: currentUser.id, verified_at: new Date().toISOString() }).eq('id', id);
    if (result.error) { alert('Помилка: ' + result.error.message); return; }
  }
  loadSmmHistory(currentUser);
}

async function deleteSmmProfile(profileId, name) {
  if (!confirm('Видалити профіль ' + name + '?\n\nВсі пов\'язані метрики також будуть видалені.')) return;
  try { await db.from('smm_metrics').delete().eq('profile_id', profileId); } catch(e) {}
  var result = await db.from('smm_profiles').delete().eq('id', profileId);
  if (result.error) { alert('Помилка: ' + result.error.message); return; }
  loadSmmProfiles(currentUser);
  loadSmmHistory(currentUser);
}

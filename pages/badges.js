// pages/badges.js
registerPage('badges', {
  render: function(user) {
    return '<div style="max-width:800px;">' +
      '<div style="margin-bottom:20px;">' +
        '<h2 style="font-size:20px;">Досягнення</h2>' +
        '<p style="color:var(--text-muted);font-size:14px;">Ваші нагороди за профорієнтаційну активність</p>' +
      '</div>' +
      '<div id="badges-summary" style="margin-bottom:24px;"></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;" id="badge-filters">' +
        '<button class="btn btn-secondary filter-active" onclick="filterBadges(this,0)" style="font-size:13px;padding:6px 14px;">Всі</button>' +
        '<button class="btn btn-secondary" onclick="filterBadges(this,1)" style="font-size:13px;padding:6px 14px;">Отримані</button>' +
        '<button class="btn btn-secondary" onclick="filterBadges(this,2)" style="font-size:13px;padding:6px 14px;">Заблоковані</button>' +
      '</div>' +
      '<div id="badges-grid">Завантаження...</div>' +
    '</div>';
  },
  init: async function(user) { await loadBadgesPage(user); }
});

var allBadgeData = [];

async function loadBadgesPage(user) {
  var defResult = await db.from('badge_definitions').select('*').eq('is_active', true).order('sort_order');
  var definitions = defResult.data || [];
  var earnedResult = await db.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id);
  var earned = earnedResult.data || [];
  var earnedMap = {};
  earned.forEach(function(e) { earnedMap[e.badge_id] = e.earned_at; });
  var progress = await getUserProgress(user);
  allBadgeData = definitions.map(function(d) {
    var isEarned = !!earnedMap[d.id];
    var current = progress[d.condition_type] || 0;
    var pct = Math.min(Math.round((current / d.condition_value) * 100), 100);
    return { id:d.id, name:d.name, description:d.description, icon:d.icon, color:d.color, target:d.condition_value, current:current, pct:pct, earned:isEarned, earned_at:earnedMap[d.id]||null };
  });
  renderBadgeSummary();
  renderBadgesGrid(0);
}

function renderBadgeSummary() {
  var c = document.getElementById('badges-summary');
  if (!c) return;
  var total = allBadgeData.length;
  var ec = allBadgeData.filter(function(b){return b.earned;}).length;
  var pct = total > 0 ? Math.round((ec/total)*100) : 0;
  var dash = Math.round(pct * 0.974);
  var icons = allBadgeData.slice(0,12).map(function(b){
    return '<span style="font-size:18px;'+(b.earned?'':'filter:grayscale(1);opacity:0.3;')+'">'+b.icon+'</span>';
  }).join('');
  c.innerHTML = '<div class="card"><div class="card-body" style="padding:24px;"><div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">' +
    '<div style="position:relative;width:80px;height:80px;flex-shrink:0;">' +
      '<svg viewBox="0 0 36 36" style="width:80px;height:80px;transform:rotate(-90deg);"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--bg-warm)" stroke-width="3"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="'+dash+' 97.4" stroke-linecap="round"/></svg>' +
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:var(--accent-deep);">'+pct+'%</div>' +
    '</div>' +
    '<div><div style="font-weight:700;font-size:18px;">'+ec+' з '+total+'</div><div style="font-size:14px;color:var(--text-muted);">досягнень отримано</div><div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">'+icons+'</div></div>' +
  '</div></div></div>';
}

function filterBadges(btn, mode) {
  document.querySelectorAll('#badge-filters button').forEach(function(b){b.classList.remove('filter-active');});
  btn.classList.add('filter-active');
  renderBadgesGrid(mode);
}

function renderBadgesGrid(mode) {
  var c = document.getElementById('badges-grid');
  if (!c) return;
  var items = allBadgeData;
  if (mode === 1) items = items.filter(function(b){return b.earned;});
  if (mode === 2) items = items.filter(function(b){return !b.earned;});
  if (items.length === 0) {
    c.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text-muted);">'+(mode===1?'Ще немає досягнень. Час діяти!':'Всі досягнення отримано!')+'</div></div>';
    return;
  }
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">';
  items.forEach(function(b) {
    var cs = b.earned ? 'background:linear-gradient(135deg,'+b.color+'10,'+b.color+'05);border:1px solid '+b.color+'40;' : 'background:var(--bg-card);border:1px solid var(--border-light);opacity:0.65;';
    var dt = (b.earned && b.earned_at) ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">'+new Date(b.earned_at).toLocaleDateString('uk-UA')+'</div>' : '';
    var pb = '';
    if (!b.earned) {
      pb = '<div style="margin-top:8px;"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:3px;"><span>'+b.current+' / '+b.target+'</span><span>'+b.pct+'%</span></div><div style="height:4px;background:var(--bg-warm);border-radius:2px;overflow:hidden;"><div style="height:100%;width:'+b.pct+'%;background:'+b.color+';border-radius:2px;"></div></div></div>';
    }
    html += '<div style="'+cs+'border-radius:16px;padding:20px;text-align:center;transition:transform 0.15s;" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'\'">' +
      '<div style="font-size:36px;margin-bottom:8px;'+(b.earned?'':'filter:grayscale(1);')+'">'+b.icon+'</div>' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:4px;">'+b.name+'</div>' +
      '<div style="font-size:12px;color:var(--text-muted);line-height:1.4;">'+b.description+'</div>' +
      (b.earned ? '<div style="margin-top:8px;font-size:12px;color:'+b.color+';font-weight:600;">Отримано ✓</div>' : '') +
      dt + pb + '</div>';
  });
  html += '</div>';
  c.innerHTML = html;
}

// ===== ПРОГРЕС =====
async function getUserProgress(user) {
  var p = {activities_count:0,verified_count:0,total_score:0,unique_categories:0,smm_profiles_count:0,memorandums_count:0,total_forms:0,weekend_activity:0,weekly_streak:0};
  var r = await db.from('activities').select('id,status,preliminary_score,final_score,event_date,paper_forms_count,electronic_forms_count,activity_types(category)').eq('created_by',user.id);
  var acts = r.data || [];
  p.activities_count = acts.length;
  var cats = {}, ts = [];
  acts.forEach(function(a) {
    if (a.status==='verified') { p.verified_count++; p.total_score += parseFloat(a.final_score||a.preliminary_score||0); }
    p.total_forms += (a.paper_forms_count||0) + (a.electronic_forms_count||0);
    if (a.activity_types && a.activity_types.category) { cats[a.activity_types.category]=true; if (a.activity_types.category==='memorandum') p.memorandums_count++; }
    if (a.event_date) { var d=new Date(a.event_date); if(d.getDay()===0||d.getDay()===6) p.weekend_activity++; ts.push(d.getTime()); }
  });
  p.unique_categories = Object.keys(cats).length;
  p.total_score = Math.round(p.total_score*10)/10;
  if (ts.length>=3) { ts.sort(function(a,b){return a-b;}); var ms=1,cs2=1; for(var i=1;i<ts.length;i++){if((ts[i]-ts[i-1])/86400000<=7){cs2++;if(cs2>ms)ms=cs2;}else{cs2=1;}} p.weekly_streak=ms; }
  try { var sr=await db.from('smm_profiles').select('id',{count:'exact',head:true}).eq('department_id',user.department_id); p.smm_profiles_count=sr.count||0; } catch(e){}
  return p;
}

// ===== АВТОПЕРЕВІРКА =====
async function checkAndAwardBadges(userId) {
  try {
    var defs = (await db.from('badge_definitions').select('*').eq('is_active',true)).data || [];
    var already = ((await db.from('user_badges').select('badge_id').eq('user_id',userId)).data || []).map(function(e){return e.badge_id;});
    var prog = await getUserProgress({id:userId, department_id:currentUser.department_id});
    var fresh = [];
    defs.forEach(function(d) {
      if (already.indexOf(d.id)>=0) return;
      if ((prog[d.condition_type]||0) >= d.condition_value) fresh.push(d);
    });
    for (var i=0;i<fresh.length;i++) { await db.from('user_badges').insert({user_id:userId,badge_id:fresh[i].id}); }
    if (fresh.length>0) showBadgePopup(fresh);
    return fresh;
  } catch(e) { return []; }
}

function showBadgePopup(badges) {
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;';
  var h = '<div style="background:var(--bg-card);border-radius:24px;padding:32px 40px;text-align:center;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">';
  h += '<div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;">Нове досягнення!</div>';
  badges.forEach(function(b) {
    h += '<div style="margin:16px 0;"><div style="font-size:56px;margin-bottom:8px;">'+b.icon+'</div><div style="font-weight:800;font-size:20px;color:'+b.color+';">'+b.name+'</div><div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">'+b.description+'</div></div>';
  });
  h += '<button class="btn btn-primary" id="badge-close-btn" style="margin-top:16px;padding:10px 32px;">Чудово!</button></div>';
  ov.innerHTML = h;
  document.body.appendChild(ov);
  ov.querySelector('#badge-close-btn').onclick = function(){ov.remove();};
  ov.onclick = function(e){if(e.target===ov)ov.remove();};
}

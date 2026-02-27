// js/router.js — Простий роутер
// Переключає "сторінки" всередині app.html без перезавантаження

var currentPage = null;
var currentUser = null;

// Реєстр сторінок — кожна сторінка це об'єкт з render() та опціонально init()
var pages = {};

function registerPage(name, pageObj) {
  pages[name] = pageObj;
}

// Перехід на сторінку
async function navigateTo(pageName) {
  var container = document.getElementById('page-content');
  if (!container) return;

  // Зняти active з навігації
  document.querySelectorAll('.nav-link').forEach(function(el) {
    el.classList.remove('active');
  });

  // Позначити активний пункт
  var activeLink = document.querySelector('.nav-link[data-page="' + pageName + '"]');
  if (activeLink) activeLink.classList.add('active');

  // Перевірити чи сторінка існує
  if (!pages[pageName]) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Сторінка "' + pageName + '" ще в розробці</div>';
    currentPage = pageName;
    updateURL(pageName);
    return;
  }

  // Рендеринг сторінки
  container.innerHTML = pages[pageName].render(currentUser);
  currentPage = pageName;
  updateURL(pageName);

  // Ініціалізація (підключення обробників, завантаження даних)
  if (pages[pageName].init) {
    await pages[pageName].init(currentUser);
  }

  // Закрити мобільне меню якщо відкрите
  closeSidebar();
}

// Оновити URL без перезавантаження (для закладок)
function updateURL(pageName) {
  var url = window.location.pathname + '?page=' + pageName;
  history.pushState({ page: pageName }, '', url);
}

// Отримати сторінку з URL
function getPageFromURL() {
  var params = new URLSearchParams(window.location.search);
  return params.get('page') || 'dashboard';
}

// Обробка кнопки "Назад" браузера
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.page) {
    navigateTo(e.state.page);
  }
});

// Мобільне меню
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('on');
}

function closeSidebar() {
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('on');
}

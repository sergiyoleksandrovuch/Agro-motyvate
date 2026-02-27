// js/auth.js — Авторизація

async function checkAuth() {
  try {
    var result = await db.auth.getSession();
    var session = result.data.session;

    if (!session) {
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
      }
      return null;
    }

    var userResult = await db
      .from('profiles')
      .select('*, departments(name, short_name, type, parent_id)')
      .eq('id', session.user.id)
      .single();

    if (userResult.error || !userResult.data) {
      console.error('Профіль не знайдено:', userResult.error);
      return null;
    }

    userResult.data.email = session.user.email;
    return userResult.data;
  } catch (e) {
    console.error('checkAuth error:', e);
    return null;
  }
}

async function login(email, password) {
  try {
    var result = await db.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (result.error) {
      return { ok: false, message: result.error.message };
    }

    var userResult = await db
      .from('profiles')
      .select('id, role')
      .eq('id', result.data.user.id)
      .single();

    if (userResult.error || !userResult.data) {
      await db.auth.signOut();
      return { ok: false, message: 'Ваш профіль не знайдено в системі. Зверніться до адміністратора.' };
    }

    return { ok: true };
  } catch (e) {
    console.error('login error:', e);
    return { ok: false, message: 'Помилка з\'єднання з сервером. Перевірте інтернет та спробуйте ще раз. (' + e.message + ')' };
  }
}

async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

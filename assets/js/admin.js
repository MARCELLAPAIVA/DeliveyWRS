// ---------- ACCESS ----------
async function guard() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    showLogin();
    return;
  }

  const { data: userData, error: userError } = await sb.auth.getUser();

  if (userError || !userData?.user) {
    showLogin('Sessão inválida. Faça login novamente.');
    return;
  }

  A.user = userData.user;

  const ok = await validarAdmin(A.user.id);

  if (!ok) {
    await sb.auth.signOut();
    showLogin('Você não tem permissão de admin.');
    return;
  }

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');

  await loadAll();
  goto('dashboard');
}

function showLogin(msg) {
  document.getElementById('admin-app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');

  const a = document.getElementById('login-alert');
  if (a) {
    a.textContent = msg || '';
    if (msg) a.classList.remove('hidden');
    else a.classList.add('hidden');
  }
}

async function adminLogin(e) {
  e.preventDefault();

  const email = document.getElementById('al-email').value.trim();
  const pwd = document.getElementById('al-pwd').value;

  const { error } = await sb.auth.signInWithPassword({
    email,
    password: pwd
  });

  if (error) {
    showLogin('Email ou senha inválidos.');
    return;
  }

  await guard();
}

async function validarAdmin(userId) {
  const { data, error } = await sb.rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });

  if (error) {
    console.error('Erro RPC has_role:', error);
    showLogin('Erro ao validar admin.');
    return false;
  }

  console.log('ADMIN VALIDADO:', data);

  return data === true;
}

async function adminLogout(e) {
  if (e) e.preventDefault();
  await sb.auth.signOut();
  location.reload();
}

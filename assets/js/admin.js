// =====================================================================
// admin.js — Painel administrativo
// =====================================================================

const A = {
  user: null,
  view: 'dashboard',
  categories: [],
  products: [],
  zones: [],
  orders: [],
  settings: {},
};

window.addEventListener('DOMContentLoaded', async () => {
  bindUI();
  await guard();
});

// ---------- ACCESS ----------
async function guard() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    showLogin();
    return;
  }

  const { data: { user }, error: userError } = await sb.auth.getUser();

  if (userError || !user) {
    showLogin('Sessão inválida. Faça login novamente.');
    return;
  }

  A.user = user;

  const ok = await validarAdmin(user.id);

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
  document.getElementById('admin-app')?.classList.add('hidden');
  document.getElementById('login-screen')?.classList.remove('hidden');

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

  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password: pwd
  });

  console.log('LOGIN DATA:', data);
  console.log('LOGIN ERROR:', error);

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

// ---------- LOADERS ----------
async function loadAll() {
  await Promise.all([
    loadCats(),
    loadProds(),
    loadZones(),
    loadOrders(),
    loadSets()
  ]);
}

async function loadCats() {
  const { data, error } = await sb
    .from('categories')
    .select('*')
    .order('sort_order');

  if (error) console.error('Erro categorias:', error);
  A.categories = data || [];
}

async function loadProds() {
  const { data, error } = await sb
    .from('products')
    .select('*, categories(name)')
    .order('name');

  if (error) console.error('Erro produtos:', error);
  A.products = data || [];
}

async function loadZones() {
  const { data, error } = await sb
    .from('delivery_zones')
    .select('*')
    .order('bairro');

  if (error) console.error('Erro bairros:', error);
  A.zones = data || [];
}

async function loadOrders() {
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) console.error('Erro pedidos:', error);
  A.orders = data || [];
}

async function loadSets() {
  const { data, error } = await sb
    .from('settings')
    .select('*');

  if (error) console.error('Erro settings:', error);

  A.settings = {};
  (data || []).forEach(r => {
    A.settings[r.key] = r.value;
  });
}

// ---------- ROUTING ----------
function goto(view) {
  A.view = view;

  document.querySelectorAll('.admin-nav a').forEach(a => {
   

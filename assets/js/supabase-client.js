// =====================================================================
// supabase-client.js — Inicialização compartilhada do Supabase
// =====================================================================

const SUPABASE_URL = 'https://lldywimvdfqjqcqqkuvp.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZHl3aW12ZGZxanFjcXFrdXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTI1MjAsImV4cCI6MjA5MjgyODUyMH0.Ry8nyJdMWH4mU6H5m19ybbOtBtpLPznEjpI_W6MFgVI';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'whiskeria-royal-auth'
  }
});

// ---------- DEBUG DE LOGIN ----------
sb.auth.onAuthStateChange((event, session) => {
  console.log('🔐 AUTH EVENT:', event);
  console.log('👤 SESSION:', session);
});

// ---------- Utilidades ----------
const fmtBRL = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

function toast(msg, type = '') {
  let el = document.getElementById('toast');

  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }

  el.className = 'toast ' + type;
  el.textContent = msg;
  el.classList.add('show');

  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await sb.auth.getUser();

  if (error) {
    console.error('Erro getCurrentUser:', error);
    return null;
  }

  return user || null;
}

async function isAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    console.warn('Nenhum usuário logado para validar admin.');
    return false;
  }

  const { data, error } = await sb.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });

  if (error) {
    console.error('Erro ao validar admin via RPC has_role:', error);
    return false;
  }

  console.log('✅ ADMIN VALIDADO:', data);

  return data === true;
}

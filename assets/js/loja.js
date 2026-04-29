let categories = [];
let products = [];
let cart = JSON.parse(localStorage.getItem('cart_whiskeria') || '[]');

document.addEventListener('DOMContentLoaded', async () => {
  await loadStore();
  updateCartBadge();
});

async function loadStore() {
  await Promise.all([loadCategories(), loadProducts(), loadSettings()]);
  renderCategories();
  renderProducts();
}

async function loadSettings() {
  const { data } = await sb.from('settings').select('*');

  const settings = {};
  (data || []).forEach(item => settings[item.key] = item.value);

  if (settings.nome_loja) {
    document.getElementById('store-name').innerText = settings.nome_loja;
  }
}

async function loadCategories() {
  const { data, error } = await sb
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  if (error) {
    console.error('Erro categorias:', error);
    return;
  }

  categories = data || [];
}

async function loadProducts() {
  const { data, error } = await sb
    .from('products')
    .select('*, categories(name, slug)')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Erro produtos:', error);
    return;
  }

  products = data || [];
}

function renderCategories() {
  const el = document.getElementById('cat-tabs');
  if (!el) return;

  el.innerHTML = `
    <button class="cat-tab active" onclick="filterCategory('all', this)">Todos</button>
    ${categories.map(c => `
      <button class="cat-tab" onclick="filterCategory('${c.slug}', this)">
        ${c.name}
      </button>
    `).join('')}
  `;
}

function renderProducts(list = products) {
  const el = document.getElementById('prod-wrap');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="emoji">🍾</div>Nenhum produto encontrado</div>`;
    return;
  }

  const grouped = {};

  list.forEach(p => {
    const cat = p.categories?.name || 'Outros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  el.innerHTML = Object.keys(grouped).map(cat => `
    <section class="section">
      <h2 class="section-title">${cat}</h2>
      <div class="prod-list">
        ${grouped[cat].map(p => `
          <div class="prod-row">
            <div class="info">
              <div class="name">${p.name}</div>
              <div class="desc">${p.description || ''}</div>
              <div class="price">${fmtBRL(p.price)}</div>
            </div>
            <div class="thumb">
              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}">` : '🍾'}
              <button class="add-btn" onclick="addToCart('${p.id}')">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function filterCategory(slug, btn) {
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (slug === 'all') {
    renderProducts(products);
    return;
  }

  const filtered = products.filter(p => p.categories?.slug === slug);
  renderProducts(filtered);
}

function onSearch(value) {
  const q = value.toLowerCase().trim();

  if (!q) {
    renderProducts(products);
    return;
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q) ||
    (p.code || '').toLowerCase().includes(q)
  );

  renderProducts(filtered);
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const item = cart.find(i => i.id === productId);

  if (item) {
    item.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image_url: product.image_url || '',
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  toast('Produto adicionado ao carrinho');
}

function saveCart() {
  localStorage.setItem('cart_whiskeria', JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  const total = cart.reduce((sum, item) => sum + item.quantity, 0);

  badge.innerText = total;
  badge.style.display = total > 0 ? 'grid' : 'none';
}

function openDrawer() {
  renderCart();

  document.getElementById('drawer')?.classList.add('open');
  document.getElementById('drawer-overlay')?.classList.add('open');
}

function openCart() {
  openDrawer();
}

function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
}

function renderCart() {
  const body = document.getElementById('drawer-body');
  const foot = document.getElementById('drawer-foot');

  if (!body || !foot) return;

  if (!cart.length) {
    body.innerHTML = `<div class="empty-state"><div class="emoji">🛒</div>Seu carrinho está vazio</div>`;
    foot.innerHTML = '';
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-img">
        ${item.image_url ? `<img src="${item.image_url}">` : '🍾'}
      </div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">${fmtBRL(item.price)}</div>
        <div class="ci-ctrl">
          <button onclick="changeQty('${item.id}', -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  foot.innerHTML = `
    <div class="summary-row">
      <span>Subtotal</span>
      <strong>${fmtBRL(subtotal)}</strong>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>${fmtBRL(subtotal)}</span>
    </div>
    <button class="btn btn-primary btn-block" onclick="finalizarPedido()">
      Finalizar pedido
    </button>
  `;
}

function changeQty(id, amount) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart();
  updateCartBadge();
  renderCart();
}

async function finalizarPedido() {
  if (!cart.length) return;

  const mensagem = cart.map(i =>
    `${i.quantity}x ${i.name} - ${fmtBRL(i.price * i.quantity)}`
  ).join('%0A');

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const texto = `Olá! Quero finalizar meu pedido:%0A%0A${mensagem}%0A%0ATotal: ${fmtBRL(total)}`;

  window.open(`https://wa.me/5521985529198?text=${texto}`, '_blank');
}

function openAuth() {
  document.getElementById('auth-modal')?.classList.add('open');
}

function closeAuth() {
  document.getElementById('auth-modal')?.classList.remove('open');
}

function switchTab(tab) {
  document.getElementById('tab-login')?.classList.toggle('hidden', tab !== 'login');
  document.getElementById('tab-signup')?.classList.toggle('hidden', tab !== 'signup');

  document.querySelectorAll('.tab-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

async function doLogin(e) {
  e.preventDefault();

  const email = document.getElementById('li-email').value.trim();
  const password = document.getElementById('li-pwd').value;

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Email ou senha inválidos.');
    return;
  }

  closeAuth();
  toast('Login realizado');
}

async function doSignup(e) {
  e.preventDefault();

  const nome = document.getElementById('su-nome').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-pwd').value;

  const { error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { nome }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  toast('Conta criada com sucesso');
  closeAuth();
}

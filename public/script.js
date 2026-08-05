// ============ API KONFIGURATSIYA ============
const API_URL = '/api';
let token = localStorage.getItem('token');

// ============ TILLAR ============
const LANGUAGES = {
  uz: {
    hello: 'Salom',
    goodbye: 'Hayr',
    login: 'Kirish',
    logout: 'Chiqish',
    customers: 'Mijozlar',
    products: 'Mahsulotlar',
    sales: 'Sotuv',
    statistics: 'Statistika',
    history: 'Tarix',
    settings: 'Sozlamalar',
    admin: 'Administrator',
    user: 'Xodim'
  },
  ru: {
    hello: 'Привет',
    goodbye: 'До свидания',
    login: 'Войти',
    logout: 'Выйти',
    customers: 'Клиенты',
    products: 'Товары',
    sales: 'Продажи',
    statistics: 'Статистика',
    history: 'История',
    settings: 'Настройки',
    admin: 'Администратор',
    user: 'Сотрудник'
  },
  en: {
    hello: 'Hello',
    goodbye: 'Goodbye',
    login: 'Login',
    logout: 'Logout',
    customers: 'Customers',
    products: 'Products',
    sales: 'Sales',
    statistics: 'Statistics',
    history: 'History',
    settings: 'Settings',
    admin: 'Administrator',
    user: 'Staff'
  }
};

let currentLang = localStorage.getItem('lang') || 'uz';

function t(key) {
  return LANGUAGES[currentLang][key] || key;
}

// ============ STATE ============
let state = {
  loaded: false,
  loading: false,
  users: [],
  customers: [],
  products: [],
  sales: [],
  payments: [],
  currentUser: null,
  view: 'mijozlar',
  saleDraft: { sana: '', productId: '', customerId: '', soni: '', tolangan: '' },
  historyFilter: { sana: '', customerId: '' },
  loginErr: '',
  payModal: null,
  error: null,
  searchResults: [],
  showSearchResults: false,
  searchQuery: '',
  showLogoutCube: false,
  logoutMessage: '',
  lastProductSale: null,
  settings: {
    avatar: localStorage.getItem('user_avatar') || '',
    language: currentLang
  }
};

// ============ SAVE/LODA STATE ============
function loadStateFromStorage() {
  try {
    const saved = localStorage.getItem('app_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        view: parsed.view || 'mijozlar',
        saleDraft: parsed.saleDraft || { sana: '', productId: '', customerId: '', soni: '', tolangan: '' },
        historyFilter: parsed.historyFilter || { sana: '', customerId: '' }
      };
    }
  } catch (e) {}
  return { view: 'mijozlar', saleDraft: { sana: '', productId: '', customerId: '', soni: '', tolangan: '' }, historyFilter: { sana: '', customerId: '' } };
}

function saveStateToStorage() {
  try {
    localStorage.setItem('app_state', JSON.stringify({
      view: state.view,
      saleDraft: state.saleDraft,
      historyFilter: state.historyFilter
    }));
  } catch (e) {}
}

const savedState = loadStateFromStorage();

// ============ API FUNKSIYALAR ============
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Xatolik: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Serverga ulanish mumkin emas');
    }
    throw error;
  }
}

// Auth
async function loginUser(login, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password })
  });
  token = data.token;
  localStorage.setItem('token', token);
  return data.user;
}

async function getCurrentUser() {
  if (!token) return null;
  return apiRequest('/auth/me');
}

// Users
async function getUsers() { return apiRequest('/users'); }
async function registerUser(login, password, role = 'user') {
  return apiRequest('/users/register', {
    method: 'POST',
    body: JSON.stringify({ login, password, role })
  });
}
async function deleteUser(login) {
  return apiRequest(`/users/${login}`, { method: 'DELETE' });
}
async function updateUserSettings(login, settings) {
  return apiRequest(`/users/${login}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
}

// Customers
async function getCustomers() { return apiRequest('/customers'); }
async function addCustomer(name, phone) {
  return apiRequest('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, phone })
  });
}
async function deleteCustomer(id) {
  return apiRequest(`/customers/${id}`, { method: 'DELETE' });
}

// Products
async function getProducts() { return apiRequest('/products'); }
async function searchProducts(query) {
  if (!query || query.length < 1) return getProducts();
  return apiRequest(`/products/search/${encodeURIComponent(query)}`);
}
async function addProduct(name, narx) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify({ name, narx })
  });
}
async function deleteProduct(id) {
  return apiRequest(`/products/${id}`, { method: 'DELETE' });
}

// Sales
async function getSales() { return apiRequest('/sales'); }
async function addSale(saleData) {
  return apiRequest('/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  });
}

// Payments
async function addPayment(customerId, sana, amount) {
  return apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify({ customerId, sana, amount })
  });
}

// ============ UTILS ============
function fmt(n) { return Math.round(n || 0).toLocaleString('ru-RU'); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ============ MIJOZ QARZI ============
function getCustomerDebtLocal(customerId) {
  const sales = state.sales.filter(s => s.customerId === customerId);
  const totalDebt = sales.reduce((sum, s) => sum + (s.qarz || 0), 0);
  const payments = state.payments.filter(p => p.customerId === customerId);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, totalDebt - totalPaid);
}

// ============ COMPUTE SALE ============
function computeSaleFigures(d) {
  const product = state.products.find(p => p._id === d.productId);
  const jami = product && d.soni ? product.narx * Number(d.soni) : 0;
  const tolangan = Number(d.tolangan || 0);
  const qarz = Math.max(0, jami - tolangan);
  const ortiqcha = Math.max(0, tolangan - jami);
  const existingDebt = d.customerId ? getCustomerDebtLocal(d.customerId) : 0;
  const debtAfter = Math.max(0, existingDebt - ortiqcha);
  return { product, jami, tolangan, qarz, ortiqcha, existingDebt, debtAfter };
}

// ============ RENDER ============
function render() {
  const app = document.getElementById('app');
  if (state.loading) {
    app.innerHTML = `<div class="loading-spinner">Yuklanmoqda...</div>`;
    return;
  }
  if (!state.loaded) {
    app.innerHTML = `<div class="loading-spinner">Ma'lumotlar yuklanmoqda...</div>`;
    return;
  }
  if (!state.currentUser) {
    app.innerHTML = renderLogin();
    attachLoginEvents();
    return;
  }
  if (state.showLogoutCube) {
    app.innerHTML = renderLogoutCube();
    return;
  }
  if (state.error) {
    app.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);">
      <h3>Xatolik yuz berdi</h3>
      <p>${state.error}</p>
      <button onclick="location.reload()" class="btn btn-primary" style="width:auto;margin-top:20px;">Qayta yuklash</button>
    </div>`;
    return;
  }
  app.innerHTML = renderShell() + (state.payModal ? renderPayModal() : '');
  attachShellEvents();
  if (state.payModal) attachPayModalEvents();
  if (state.view === 'statistika') {
    setTimeout(drawStatCharts, 200);
  }
  saveStateToStorage();
}

// ============ LOGIN ============
function renderLogin() {
  return `
  <div class="login-wrap">
    <div class="login-card glass">
      <div style="font-size:48px;margin-bottom:16px;">🚀</div>
      <h1>Toys Note</h1>
      <p>Do'kon boshqaruv tizimiga kirish</p>
      ${state.loginErr ? `<div class="login-error">${state.loginErr}</div>` : ''}
      <form id="loginForm">
        <div class="field">
          <label>Login</label>
          <input id="loginInput" autocomplete="username" required value="baxrom">
        </div>
        <div class="field">
          <label>Parol</label>
          <input id="parolInput" type="password" autocomplete="current-password" required value="14042011">
        </div>
        <button class="btn-neon" type="submit" style="width:100%;">Kirish</button>
      </form>
      <p style="margin-top:16px;font-size:12px;color:rgba(255,255,255,0.4);">Admin: baxrom / 14042011</p>
    </div>
  </div>`;
}

function attachLoginEvents() {
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const login = document.getElementById('loginInput').value.trim();
    const parol = document.getElementById('parolInput').value;
    state.loading = true;
    state.loginErr = '';
    render();
    try {
      const user = await loginUser(login, parol);
      state.currentUser = user;
      await loadData();
      state.loaded = true;
      state.loading = false;
      render();
    } catch (error) {
      state.loading = false;
      state.loginErr = error.message || "Login yoki parol noto'g'ri.";
      render();
    }
  });
}

// ============ LOGOUT CUBE ============
function renderLogoutCube() {
  const userName = state.currentUser?.login || 'User';
  const lang = currentLang;
  const hello = LANGUAGES[lang].goodbye || 'Goodbye';
  
  return `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;">
    <div class="cube-wrapper">
      <div class="cube">
        <div class="cube-face cube-face-front">${hello}</div>
        <div class="cube-face cube-face-back">${userName}</div>
        <div class="cube-face cube-face-right">👋</div>
        <div class="cube-face cube-face-left">✨</div>
        <div class="cube-face cube-face-top">⭐</div>
        <div class="cube-face cube-face-bottom">🌟</div>
      </div>
    </div>
    <p style="margin-top:30px;color:rgba(255,255,255,0.6);font-size:18px;">
      ${hello}, ${userName}! 👋
    </p>
  </div>`;
}

// ============ SHELL ============
function renderShell() {
  const isAdmin = state.currentUser?.role === 'admin';
  const userName = state.currentUser?.login || '';
  const userRole = isAdmin ? t('admin') : t('user');
  const avatar = state.settings.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%232F6FE4"/%3E%3Ctext x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-weight="bold"%3E${userName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E';
  
  const navItems = [
    { id: 'mijozlar', label: t('customers'), icon: '👥' },
    { id: 'mahsulot', label: t('products'), icon: '📦' },
    { id: 'sotuv', label: t('sales'), icon: '🛒' },
    { id: 'statistika', label: t('statistics'), icon: '📊' },
    { id: 'tarix', label: t('history'), icon: '📜' },
  ];
  
  if (isAdmin) {
    navItems.push({ id: 'sozlamalar', label: t('settings'), icon: '⚙️' });
    navItems.push({ id: 'foydalanuvchilar', label: 'Foydalanuvchilar', icon: '👤' });
  }
  
  const navHtml = navItems.map(n => `
    <div class="nav-item ${state.view === n.id ? 'active' : ''}" data-nav="${n.id}">
      <span>${n.icon}</span>
      <span>${n.label}</span>
    </div>
  `).join('');
  
  // Til tanlash
  const langOptions = ['uz', 'ru', 'en'].map(l => `
    <option value="${l}" ${currentLang === l ? 'selected' : ''}>${l.toUpperCase()}</option>
  `).join('');
  
  return `
  <div class="shell">
    <div class="sidebar">
      <div class="brand">🚀 Toys Note</div>
      
      <div style="display:flex;gap:8px;margin-bottom:12px;padding:0 10px;">
        <select id="langSelect" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 10px;color:#fff;font-size:13px;flex:1;">
          ${langOptions}
        </select>
      </div>
      
      ${navHtml}
      
      <div class="spacer" style="flex:1;"></div>
      
      <div class="user-chip">
        <div class="user-avatar">
          <img src="${avatar}" alt="Avatar">
        </div>
        <div class="user-info">
          <div class="name">${userName}</div>
          <div class="role">${userRole}</div>
        </div>
      </div>
      
      <button class="logout-btn" id="logoutBtn" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);padding:10px;border-radius:10px;cursor:pointer;width:100%;font-size:13px;">
        ${t('logout')}
      </button>
    </div>
    <div class="main">${renderView()}</div>
  </div>`;
}

function renderView() {
  switch (state.view) {
    case 'mijozlar': return viewMijozlar();
    case 'mahsulot': return viewMahsulot();
    case 'sotuv': return viewSotuv();
    case 'statistika': return viewStatistika();
    case 'tarix': return viewTarix();
    case 'foydalanuvchilar': return viewFoydalanuvchilar();
    case 'sozlamalar': return viewSozlamalar();
    default: return '';
  }
}

function attachShellEvents() {
  // Nav
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      state.view = el.getAttribute('data-nav');
      saveStateToStorage();
      render();
    });
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    state.showLogoutCube = true;
    render();
    setTimeout(() => {
      state.currentUser = null;
      token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('app_state');
      state.loaded = false;
      state.showLogoutCube = false;
      render();
    }, 3000);
  });
  
  // Language
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      currentLang = langSelect.value;
      localStorage.setItem('lang', currentLang);
      render();
    });
  }
  
  attachViewEvents();
}

// ============ VIEWS ============

// ---- MIJOZLAR ----
function viewMijozlar() {
  const rows = state.customers.map(c => {
    const debt = getCustomerDebtLocal(c._id);
    return `<tr>
      <td>${c.name}</td>
      <td>${c.phone || '—'}</td>
      <td>${debt > 0 ? `<span class="pill pill-debt">${fmt(debt)} so'm</span>` : `<span class="pill pill-ok">Qarzi yo'q</span>`}</td>
      <td>
        ${debt > 0 ? `<button class="small-btn pay" data-pay-customer="${c._id}">💰 Qarz to'lash</button>` : ''}
        <button class="small-btn danger" data-del-customer="${c._id}">🗑️ O'chirish</button>
      </td>
    </tr>`;
  }).join('');
  
  return `
  <div class="topbar"><div><h2>${t('customers')}</h2><p>Barcha mijozlar ro'yxati</p></div></div>
  <div class="card">
    <h3>Yangi mijoz qo'shish</h3>
    <form id="customerForm" class="row-flex">
      <div class="field"><label>Ism-familiya</label><input id="custName" required placeholder="Masalan: Aziz Karimov"></div>
      <div class="field"><label>Telefon</label><input id="custPhone" type="tel" placeholder="+998 90 123 45 67"></div>
      <button class="btn-neon" type="submit">Qo'shish</button>
    </form>
  </div>
  <div class="card">
    <h3>Mijozlar

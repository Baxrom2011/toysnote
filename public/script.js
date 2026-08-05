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
    user: 'Xodim',
    add: 'Qo\'shish',
    delete: 'O\'chirish',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    search: 'Qidiruv',
    debt: 'Qarz',
    paid: 'To\'langan',
    total: 'Jami',
    lastProduct: 'Oxirgi mahsulot',
    cashier: 'Kassa'
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
    user: 'Сотрудник',
    add: 'Добавить',
    delete: 'Удалить',
    save: 'Сохранить',
    cancel: 'Отмена',
    search: 'Поиск',
    debt: 'Долг',
    paid: 'Оплачено',
    total: 'Итого',
    lastProduct: 'Последний товар',
    cashier: 'Касса'
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
    user: 'Staff',
    add: 'Add',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    debt: 'Debt',
    paid: 'Paid',
    total: 'Total',
    lastProduct: 'Last Product',
    cashier: 'Cashier'
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
  lastProductSale: null,
  settings: {
    avatar: localStorage.getItem('user_avatar') || '',
    language: currentLang
  }
};

// ============ SAVE/LOAD STATE ============
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
state.view = savedState.view;
state.saleDraft = savedState.saleDraft;
state.historyFilter = savedState.historyFilter;

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
  const goodbye = LANGUAGES[lang].goodbye || 'Goodbye';
  
  return `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;">
    <div class="cube-wrapper">
      <div class="cube">
        <div class="cube-face cube-face-front">${goodbye}</div>
        <div class="cube-face cube-face-back">${userName}</div>
        <div class="cube-face cube-face-right">👋</div>
        <div class="cube-face cube-face-left">✨</div>
        <div class="cube-face cube-face-top">⭐</div>
        <div class="cube-face cube-face-bottom">🌟</div>
      </div>
    </div>
    <p style="margin-top:30px;color:rgba(255,255,255,0.6);font-size:18px;">
      ${goodbye}, ${userName}! 👋
    </p>
  </div>`;
}

// ============ SHELL ============
function renderShell() {
  const isAdmin = state.currentUser?.role === 'admin';
  const userName = state.currentUser?.login || '';
  const userRole = isAdmin ? t('admin') : t('user');
  const avatar = state.settings.avatar || `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%232F6FE4"/%3E%3Ctext x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-weight="bold"%3E${userName.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  
  const navItems = [
    { id: 'mijozlar', label: t('customers'), icon: '👥' },
    { id: 'mahsulot', label: t('products'), icon: '📦' },
    { id: 'sotuv', label: t('sales'), icon: '🛒' },
    { id: 'statistika', label: t('statistics'), icon: '📊' },
    { id: 'tarix', label: t('history'), icon: '📜' },
  ];
  
  if (isAdmin) {
    navItems.push({ id: 'sozlamalar', label: t('settings'), icon: '⚙️' });
  }
  
  const navHtml = navItems.map(n => `
    <div class="nav-item ${state.view === n.id ? 'active' : ''}" data-nav="${n.id}">
      <span>${n.icon}</span>
      <span>${n.label}</span>
    </div>
  `).join('');
  
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
    case 'sozlamalar': return viewSozlamalar();
    default: return '';
  }
}

function attachShellEvents() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      state.view = el.getAttribute('data-nav');
      saveStateToStorage();
      render();
    });
  });
  
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
    <h3>Mijozlar ro'yxati (${state.customers.length})</h3>
    ${state.customers.length ? `<table><thead><tr><th>Ism</th><th>Telefon</th><th>Holati</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">Hali mijoz qo'shilmagan.</div>`}
  </div>`;
}

// ---- PAY MODAL ----
function renderPayModal() {
  const c = state.customers.find(x => x._id === state.payModal.customerId);
  if (!c) return '';
  const debt = getCustomerDebtLocal(c._id);
  return `
  <div class="modal-overlay" id="payOverlay">
    <div class="modal-card glass">
      <h3>💰 Qarz to'lash — ${c.name}</h3>
      <p style="color:rgba(255,255,255,0.6);font-size:13.5px;margin-top:-8px;">Joriy qarz: <b style="color:var(--neon-orange)">${fmt(debt)} so'm</b></p>
      <form id="payForm">
        <div class="field"><label>Sana</label><input type="date" id="paySana" value="${todayStr()}"></div>
        <div class="field"><label>To'lov summasi (so'm)</label><input type="number" min="1" max="${debt}" id="payAmount" required placeholder="0"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="payCancelBtn">Bekor qilish</button>
          <button type="submit" class="btn-neon">Saqlash</button>
        </div>
      </form>
    </div>
  </div>`;
}

function attachPayModalEvents() {
  document.getElementById('payCancelBtn').addEventListener('click', () => { state.payModal = null; render(); });
  document.getElementById('payOverlay').addEventListener('click', e => { if (e.target.id === 'payOverlay') { state.payModal = null; render(); } });
  document.getElementById('payForm').addEventListener('submit', async e => {
    e.preventDefault();
    const sana = document.getElementById('paySana').value || todayStr();
    const amount = Number(document.getElementById('payAmount').value);
    if (!amount || amount <= 0) return;
    try {
      await addPayment(state.payModal.customerId, sana, amount);
      state.payModal = null;
      await loadData();
      render();
    } catch (error) {
      alert(error.message);
    }
  });
}

// ---- MAHSULOT ----
function viewMahsulot() {
  const rows = state.products.map(p => {
    const soldQty = state.sales.filter(s => s.productId === p._id).reduce((a, s) => a + s.soni, 0);
    return `<tr>
      <td><span class="artikul-badge">${p.artikul || 'ART-???'}</span></td>
      <td>${p.name}</td>
      <td>${fmt(p.narx)} so'm</td>
      <td>${soldQty} dona</td>
      <td>
        <button class="small-btn danger" data-del-product="${p._id}">🗑️ O'chirish</button>
        <button class="small-btn pay" data-last-product="${p._id}">📦 Oxirgi</button>
      </td>
    </tr>`;
  }).join('');
  
  return `
  <div class="topbar"><div><h2>${t('products')}</h2><p>O'yinchoqlar va ularning narxlari</p></div></div>
  <div class="card">
    <h3>Yangi o'yinchoq qo'shish</h3>
    <form id="productForm" class="row-flex">
      <div class="field"><label>Nomi</label><input id="prodName" required placeholder="Masalan: Ayiqcha"></div>
      <div class="field"><label>Narxi (so'm)</label><input id="prodNarx" type="number" min="0" required placeholder="50000"></div>
      <button class="btn-neon" type="submit">Qo'shish</button>
    </form>
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:10px;">⚠️ Artikul avtomatik yaratiladi: ART-001, ART-002 ...</p>
  </div>
  <div class="card">
    <h3>Mahsulotlar ro'yxati (${state.products.length})</h3>
    ${state.products.length ? `<table><thead><tr><th>Artikul</th><th>Nomi</th><th>Narxi</th><th>Sotuvlar</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">Hali mahsulot qo'shilmagan.</div>`}
  </div>`;
}

// ---- SOTUV ----
function viewSotuv() {
  const d = state.saleDraft;
  const f = computeSaleFigures(d);
  const customerOptions = state.customers.map(c => `<option value="${c._id}" ${d.customerId === c._id ? 'selected' : ''}>${c.name}</option>`).join('');
  
  let searchResultsHtml = '';
  if (state.showSearchResults && state.searchResults.length > 0) {
    searchResultsHtml = state.searchResults.map(p => `
      <div class="search-result" data-product-id="${p._id}" data-product-name="${p.name}" data-product-narx="${p.narx}" data-product-artikul="${p.artikul || 'ART-???'}">
        <span class="artikul">${p.artikul || 'ART-???'}</span> - ${p.name} <span style="color:rgba(255,255,255,0.4);">${fmt(p.narx)} so'm</span>
      </div>
    `).join('');
  }

  let selectedProductHtml = '';
  if (d.productId) {
    const p = state.products.find(x => x._id === d.productId);
    if (p) {
      selectedProductHtml = `<div style="margin-top:8px;padding:10px 14px;background:rgba(0,212,255,0.1);border-radius:10px;border:1px solid rgba(0,212,255,0.2);">
        <strong>Tanlangan:</strong> <span class="artikul-badge">${p.artikul || 'ART-???'}</span> ${p.name} — ${fmt(p.narx)} so'm
      </div>`;
    }
  }

  return `
  <div class="topbar">
    <div>
      <h2>${t('sales')}</h2>
      <p>Yangi sotuvni ro'yxatga oling</p>
    </div>
  </div>
  ${!state.products.length || !state.customers.length ? `<div class="msg msg-warn">Sotuv qilishdan oldin kamida bitta mahsulot va bitta mijoz qo'shing.</div>` : ''}
  <div class="card">
    <form id="saleForm">
      <div class="grid-2">
        <div class="field">
          <label>Sana</label>
          <input type="date" id="saleSana" value="${d.sana || todayStr()}">
        </div>
        <div class="field">
          <label>Mijoz</label>
          <select id="saleCustomer">
            <option value="">— tanlang —</option>
            ${customerOptions}
          </select>
        </div>
        <div class="field">
          <label>Mahsulot (artikul yoki nom)</label>
          <div class="search-wrapper">
            <input type="text" id="saleProductSearch" placeholder="ART-001 yoki nom..." value="${state.searchQuery}" autocomplete="off">
            <div class="search-results-dropdown ${state.showSearchResults && state.searchResults.length > 0 ? 'show' : ''}">
              ${searchResultsHtml}
              ${state.showSearchResults && state.searchResults.length === 0 ? '<div class="search-result" style="color:rgba(255,255,255,0.4);cursor:default;">Hech narsa topilmadi</div>' : ''}
            </div>
          </div>
          <input type="hidden" id="saleProduct" value="${d.productId}">
          ${selectedProductHtml}
        </div>
        <div class="field">
          <label>Nechta sotildi</label>
          <input type="number" min="1" id="saleSoni" value="${d.soni}" placeholder="1">
        </div>
      </div>
      <div class="sale-total-box">
        <div>
          <div class="t-lbl">Jami summa</div>
          <div class="t-val" id="saleJamiVal">${fmt(f.jami)} so'm</div>
        </div>
        <div>
          <div class="t-lbl">Bir dona narxi</div>
          <div class="t-val" id="salePerUnitVal" style="font-size:18px">${f.product ? fmt(f.product.narx) : 0} so'm</div>
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label>Mijoz bergan pul</label>
          <input type="number" min="0" id="saleTolangan" value="${d.tolangan}" placeholder="0">
        </div>
        <div class="field">
          <label>Ushbu sotuv bo'yicha qarz</label>
          <input id="saleQarzVal" value="${fmt(f.qarz)} so'm" disabled style="background:${f.qarz > 0 ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,136,0.15)'};color:${f.qarz > 0 ? 'var(--neon-orange)' : 'var(--neon-green)'};font-weight:700;border:1px solid ${f.qarz > 0 ? 'rgba(255,107,0,0.3)' : 'rgba(0,255,136,0.3)'};">
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn-neon" type="submit">${t('save')}</button>
        <button type="button" class="btn-neon" id="lastProductBtn" style="background:linear-gradient(135deg, var(--neon-pink), var(--neon-purple));">📦 ${t('lastProduct')}</button>
      </div>
    </form>
  </div>`;
}

// ---- STATISTIKA ----
function viewStatistika() {
  const totalSales = state.sales.reduce((a, s) => a + s.jami, 0);
  const totalPaid = state.sales.reduce((a, s) => a + s.tolangan, 0);
  let totalDebt = 0;
  state.customers.forEach(c => {
    totalDebt += getCustomerDebtLocal(c._id);
  });
  return `
  <div class="topbar"><div><h2>${t('statistics')}</h2><p>Do'kon faoliyati bo'yicha umumiy ko'rsatkichlar</p></div></div>
  <div class="grid-3" style="margin-bottom:20px">
    <div class="stat-card glass">
      <div class="icn" style="background:rgba(0,212,255,0.1);color:var(--neon-blue)">💰</div>
      <div class="lbl">Umumiy savdo</div>
      <div class="val">${fmt(totalSales)} so'm</div>
    </div>
    <div class="stat-card glass">
      <div class="icn" style="background:rgba(0,255,136,0.1);color:var(--neon-green)">✅</div>
      <div class="lbl">Qabul qilingan pul</div>
      <div class="val">${fmt(totalPaid)} so'm</div>
    </div>
    <div class="stat-card glass">
      <div class="icn" style="background:rgba(255,107,0,0.1);color:var(--neon-orange)">⚠️</div>
      <div class="lbl">Umumiy qarz</div>
      <div class="val">${fmt(totalDebt)} so'm</div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card"><h3>Kunlar bo'yicha savdo</h3><div class="chart-box"><canvas id="chartDaily"></canvas></div></div>
    <div class="card"><h3>Mahsulotlar bo'yicha sotuv</h3><div class="chart-box"><canvas id="chartProducts"></canvas></div></div>
  </div>
  <div class="grid-2">
    <div class="card"><h3>Eng ko'p xarid qilgan mijozlar</h3><div class="chart-box"><canvas id="chartCustomers"></canvas></div></div>
    <div class="card"><h3>Mijozlar bo'yicha qarzdorlik</h3><div class="chart-box"><canvas id="chartDebt"></canvas></div></div>
  </div>`;
}

let chartInstances = [];
function destroyCharts() { chartInstances.forEach(c => { try { c.destroy(); } catch (e) {} }); chartInstances = []; }

function drawStatCharts() {
  if (state.view !== 'statistika' || typeof Chart === 'undefined') return;
  destroyCharts();
  const palette = ['#00d4ff', '#ff00e6', '#9b00ff', '#00ff88', '#ff6b00', '#ffdd00'];

  const byDay = {};
  state.sales.forEach(s => { byDay[s.sana] = (byDay[s.sana] || 0) + s.jami; });
  const days = Object.keys(byDay).sort();
  const dailyCtx = document.getElementById('chartDaily');
  if (dailyCtx && days.length) {
    chartInstances.push(new Chart(dailyCtx, {
      type: 'line',
      data: { labels: days, datasets: [{ label: "Savdo (so'm)", data: days.map(d => byDay[d]), borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', fill: true, tension: .3 }] },
      options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
    }));
  } else if (dailyCtx) {
    dailyCtx.parentElement.innerHTML = '<div class="empty">Hali sotuvlar mavjud emas.</div>';
  }

  const byProd = {};
  state.sales.forEach(s => { const p = state.products.find(x => x._id === s.productId); const name = p ? p.name : '—'; byProd[name] = (byProd[name] || 0) + s.soni; });
  const prodCtx = document.getElementById('chartProducts');
  if (prodCtx) {
    const labels = Object.keys(byProd);
    if (labels.length) {
      chartInstances.push(new Chart(prodCtx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Dona', data: labels.map(l => byProd[l]), backgroundColor: labels.map((_, i) => palette[i % palette.length]) }] },
        options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
      }));
    } else {
      prodCtx.parentElement.innerHTML = '<div class="empty">Hali sotuvlar mavjud emas.</div>';
    }
  }

  const byCust = {};
  state.sales.forEach(s => { const c = state.customers.find(x => x._id === s.customerId); const name = c ? c.name : '—'; byCust[name] = (byCust[name] || 0) + s.jami; });
  const custCtx = document.getElementById('chartCustomers');
  if (custCtx) {
    const labels = Object.keys(byCust).sort((a, b) => byCust[b] - byCust[a]).slice(0, 8);
    if (labels.length) {
      chartInstances.push(new Chart(custCtx, {
        type: 'bar',
        data: { labels, datasets: [{ label: "So'm", data: labels.map(l => byCust[l]), backgroundColor: '#00d4ff' }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
      }));
    } else {
      custCtx.parentElement.innerHTML = '<div class="empty">Hali sotuvlar mavjud emas.</div>';
    }
  }

  const byDebt = {};
  state.customers.forEach(c => { const d = getCustomerDebtLocal(c._id); if (d > 0) byDebt[c.name] = d; });
  const debtCtx = document.getElementById('chartDebt');
  if (debtCtx) {
    const labels = Object.keys(byDebt);
    if (labels.length) {
      chartInstances.push(new Chart(debtCtx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: labels.map(l => byDebt[l]), backgroundColor: labels.map((_, i) => palette[i % palette.length]) }] },
        options: { responsive: true, maintainAspectRatio: false }
      }));
    } else {
      debtCtx.parentElement.innerHTML = '<div class="empty">Qarzdorlik mavjud emas.</div>';
    }
  }
}

// ---- TARIX ----
function viewTarix() {
  const f = state.historyFilter;
  const customerOptions = state.customers.map(c => `<option value="${c._id}" ${f.customerId === c._id ? 'selected' : ''}>${c.name}</option>`).join('');
  let resultsHtml = '';
  
  if (f.customerId) {
    let filterSana = f.sana;
    if (filterSana) {
      const parts = filterSana.split('.');
      if (parts.length === 3) {
        filterSana = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    let matches = state.sales.filter(s => s.customerId === f.customerId);
    if (filterSana) {
      matches = matches.filter(s => s.sana === filterSana);
    }
    
    matches.sort((a, b) => b.createdAt - a.createdAt);
    
    const totalJami = matches.reduce((a, s) => a + s.jami, 0);
    const totalTolangan = matches.reduce((a, s) => a + s.tolangan, 0);
    const totalQarz = matches.reduce((a, s) => a + s.qarz, 0);
    
    const payments = state.payments.filter(p => p.customerId === f.customerId);
    const totalPayments = payments.reduce((a, p) => a + p.amount, 0);
    
    if (matches.length > 0 || payments.length > 0) {
      let rows = matches.map(s => {
        const p = state.products.find(x => x._id === s.productId);
        const dateParts = s.sana.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : s.sana;
        
        return `<tr>
          <td>${formattedDate}</td>
          <td>${p ? p.name : '—'}</td>
          <td>${s.soni} dona</td>
          <td>${fmt(s.jami)} so'm</td>
          <td>${fmt(s.tolangan)} so'm</td>
          <td>${s.qarz > 0 ? `<span class="pill pill-debt">${fmt(s.qarz)} so'm</span>` : `<span class="pill pill-ok">To'liq</span>`}</td>
        </tr>`;
      }).join('');
      
      let paymentRows = payments.map(p => {
        const dateParts = p.sana.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : p.sana;
        return `<tr>
          <td>${formattedDate}</td>
          <td colspan="3">💳 Qarz to'lovi</td>
          <td colspan="2"><span class="pill pill-ok">${fmt(p.amount)} so'm</span></td>
        </tr>`;
      }).join('');
      
      resultsHtml = `
        <table>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Mahsulot</th>
              <th>Soni</th>
              <th>Jami</th>
              <th>To'langan</th>
              <th>Qarz</th>
            </tr>
          </thead>
          <tbody>${rows}${paymentRows}</tbody>
        </table>
        <div class="sale-total-box" style="margin-top:18px">
          <div>
            <div class="t-lbl">Jami xarid</div>
            <div class="t-val">${fmt(totalJami)} so'm</div>
          </div>
          <div>
            <div class="t-lbl">To'langan</div>
            <div class="t-val">${fmt(totalTolangan)} so'm</div>
          </div>
          <div>
            <div class="t-lbl">Qarz</div>
            <div class="t-val">${fmt(totalQarz)} so'm</div>
          </div>
          ${totalPayments > 0 ? `<div>
            <div class="t-lbl">Qarz to'lovi</div>
            <div class="t-val">${fmt(totalPayments)} so'm</div>
          </div>` : ''}
        </div>
      `;
    } else {
      resultsHtml = `<div class="empty">Bu mijoz bo'yicha hech qanday ma'lumot topilmadi.</div>`;
    }
  } else {
    resultsHtml = `<div class="empty">Natijalarni ko'rish uchun mijozni tanlang.</div>`;
  }
  
  return `
  <div class="topbar">
    <div>
      <h2>${t('history')}</h2>
      <p>Sana va mijoz bo'yicha xaridlar tarixi</p>
    </div>
  </div>
  <div class="card">
    <div class="row-flex">
      <div class="field">
        <label>Sana</label>
        <input type="date" id="histSana" value="${f.sana || ''}">
      </div>
      <div class="field">
        <label>Mijoz</label>
        <select id="histCustomer">
          <option value="">— tanlang —</option>
          ${customerOptions}
        </select>
      </div>
      <button class="btn-neon" id="histShowBtn" style="width:auto;">Ko'rsatish</button>
      <button class="btn btn-secondary" id="histClearBtn" style="width:auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);border-radius:12px;padding:12px 18px;cursor:pointer;">Tozalash</button>
    </div>
  </div>
  <div class="card">
    <h3>Natija</h3>
    ${resultsHtml}
  </div>`;
}

// ---- SOZLAMALAR ----
function viewSozlamalar() {
  const isAdmin = state.currentUser?.role === 'admin';
  
  return `
  <div class="topbar"><div><h2>⚙️ ${t('settings')}</h2><p>Shaxsiy sozlamalar va dizayn</p></div></div>
  
  <div class="card">
    <h3>👤 Profil rasmi</h3>
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <div class="user-avatar" style="width:80px;height:80px;">
        <img src="${state.settings.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Ccircle cx=%2240%22 cy=%2240%22 r=%2240%22 fill=%22%232F6FE4%22/%3E%3Ctext x=%2240%22 y=%2252%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2236%22 font-weight=%22bold%22%3E${state.currentUser?.login?.charAt(0).toUpperCase() || 'U'}%3C/text%3E%3C/svg%3E'}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
      </div>
      <div>
        <form id="avatarForm" style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="field" style="margin-bottom:0;">
            <label>Rasm URL</label>
            <input id="avatarUrl" placeholder="https://example.com/avatar.jpg" style="min-width:250px;">
          </div>
          <button class="btn-neon" type="submit">Yangilash</button>
        </form>
        <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px;">💡 Rasm URL ni kiriting yoki default qoldiring</p>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h3>🌐 Til</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      ${['uz', 'ru', 'en'].map(l => `
        <button class="${currentLang === l ? 'btn-neon' : 'btn-secondary'}" onclick="changeLanguage('${l}')" style="padding:10px 20px;border-radius:10px;border:${currentLang === l ? 'none' : '1px solid rgba(255,255,255,0.1)'};background:${currentLang === l ? 'linear-gradient(135deg, var(--neon-blue), var(--neon-purple))' : 'rgba(255,255,255,0.05)'};color:#fff;cursor:pointer;">
          ${l.toUpperCase()} ${l === 'uz' ? '🇺🇿' : l === 'ru' ? '🇷🇺' : '🇬🇧'}
        </button>
      `).join('')}
    </div>
  </div>
  
  ${isAdmin ? `
  <div class="card">
    <h3>🎨 Dizayn sozlamalari</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <div style="display:flex;gap:6px;align-items:center;">
        <span style="color:rgba(255,255,255,0.6);">Neon rang:</span>
        <input type="color" id="neonColor" value="#00d4ff" style="width:40px;height:40px;border:none;border-radius:8px;cursor:pointer;background:transparent;">
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <span style="color:rgba(255,255,255,0.6);">Fon rangi:</span>
        <input type="color" id="bgColor" value="#0a0a1a" style="width:40px;height:40px;border:none;border-radius:8px;cursor:pointer;background:transparent;">
      </div>
    </div>
    <button class="btn-neon" id="applyThemeBtn" style="margin-top:16px;">🎨 Qo'llash</button>
  </div>
  ` : ''}
  
  <div class="card">
    <h3>📊 Ma'lumotlar</h3>
    <p style="color:rgba(255,255,255,0.6);font-size:14px;">
      Mijozlar: ${state.customers.length} ta<br>
      Mahsulotlar: ${state.products.length} ta<br>
      Sotuvlar: ${state.sales.length} ta<br>
      Jami savdo: ${fmt(state.sales.reduce((a, s) => a + s.jami, 0))} so'm
    </p>
  </div>
  `;
}

// ============ VIEW EVENTS ============
function attachViewEvents() {
  // Customers
  const custForm = document.getElementById('customerForm');
  if (custForm) {
    custForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      if (!name) return;
      try {
        await addCustomer(name, phone);
        await loadData();
        render();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  document.querySelectorAll('[data-del-customer]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del-customer');
      if (!confirm("Bu mijozni o'chirishni tasdiqlaysizmi?")) return;
      try {
        await deleteCustomer(id);
        await loadData();
        render();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll('[data-pay-customer]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.payModal = { customerId: btn.getAttribute('data-pay-customer') };
      render();
    });
  });

  // Products
  const prodForm = document.getElementById('productForm');
  if (prodForm) {
    prodForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('prodName').value.trim();
      const narx = Number(document.getElementById('prodNarx').value);
      if (!name || !narx) return;
      try {
        const result = await addProduct(name, narx);
        alert(`✅ Mahsulot qo'shildi!\nArtikul: ${result.artikul}\nNomi: ${result.name}\nNarxi: ${fmt(result.narx)} so'm`);
        await loadData();
        render();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  document.querySelectorAll('[data-del-product]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del-product');
      if (!confirm("Bu mahsulotni o'chirishni tasdiqlaysizmi?")) return;
      try {
        await deleteProduct(id);
        await loadData();
        render();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  // Oxirgi mahsulot
  document.querySelectorAll('[data-last-product]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-last-product');
      const product = state.products.find(p => p._id === id);
      if (product) {
        state.lastProductSale = product;
        // Sotuvga o'tish
        state.saleDraft.productId = product._id;
        state.view = 'sotuv';
        state.searchQuery = `${product.artikul} - ${product.name}`;
        render();
      }
    });
  });

  // Sales
  const saleForm = document.getElementById('saleForm');
  if (saleForm) {
    const searchInput = document.getElementById('saleProductSearch');
    const productHidden = document.getElementById('saleProduct');
    const lastProductBtn = document.getElementById('lastProductBtn');

    if (lastProductBtn) {
      lastProductBtn.addEventListener('click', () => {
        if (state.products.length === 0) {
          alert('Hali mahsulot mavjud emas!');
          return;
        }
        const lastProduct = state.products[state.products.length - 1];
        state.lastProductSale = lastProduct;
        state.saleDraft.productId = lastProduct._id;
        if (searchInput) searchInput.value = `${lastProduct.artikul} - ${lastProduct.name}`;
        if (productHidden) productHidden.value = lastProduct._id;
        render();
        setTimeout(() => {
          const event = new Event('input');
          document.getElementById('saleSoni')?.dispatchEvent(event);
        }, 100);
      });
    }

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', async function() {
        const query = this.value.trim();
        state.searchQuery = query;
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          if (query.length > 0) {
            try {
              const results = await searchProducts(query);
              state.searchResults = results;
              state.showSearchResults = results.length > 0;
              render();
            } catch (error) {
              console.error('Qidiruv xatosi:', error);
            }
          } else {
            state.searchResults = [];
            state.showSearchResults = false;
            render();
          }
        }, 300);
      });

      document.addEventListener('click', function(e) {
        const result = e.target.closest('.search-result');
        if (result) {
          const productId = result.dataset.productId;
          const productName = result.dataset.productName;
          const productNarx = result.dataset.productNarx;
          const productArtikul = result.dataset.productArtikul;
          
          if (productHidden) productHidden.value = productId;
          searchInput.value = `${productArtikul || 'ART-???'} - ${productName}`;
          state.searchResults = [];
          state.showSearchResults = false;
          state.searchQuery = '';
          state.saleDraft.productId = productId;
          
          render();
          
          setTimeout(() => {
            const event = new Event('input');
            document.getElementById('saleSoni')?.dispatchEvent(event);
          }, 100);
        }
      });
    }

    const updateSaleComputed = () => {
      state.saleDraft = {
        sana: document.getElementById('saleSana').value,
        customerId: document.getElementById('saleCustomer').value,
        productId: document.getElementById('saleProduct').value,
        soni: document.getElementById('saleSoni').value,
        tolangan: document.getElementById('saleTolangan').value,
      };
      const f = computeSaleFigures(state.saleDraft);
      const jamiEl = document.getElementById('saleJamiVal');
      const perUnitEl = document.getElementById('salePerUnitVal');
      const qarzEl = document.getElementById('saleQarzVal');
      
      if (jamiEl) jamiEl.textContent = fmt(f.jami) + " so'm";
      if (perUnitEl) perUnitEl.textContent = (f.product ? fmt(f.product.narx) : 0) + " so'm";
      if (qarzEl) {
        qarzEl.value = fmt(f.qarz) + " so'm";
        qarzEl.style.background = f.qarz > 0 ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,136,0.15)';
        qarzEl.style.color = f.qarz > 0 ? 'var(--neon-orange)' : 'var(--neon-green)';
        qarzEl.style.border = `1px solid ${f.qarz > 0 ? 'rgba(255,107,0,0.3)' : 'rgba(0,255,136,0.3)'}`;
      }
    };

    ['saleSana', 'saleCustomer', 'saleSoni', 'saleTolangan'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const evt = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
      el.addEventListener(evt, updateSaleComputed);
    });

    saleForm.addEventListener('submit', async e => {
      e.preventDefault();
      const d = state.saleDraft;
      
      if (!d.customerId || !d.productId || !d.soni || Number(d.soni) <= 0) {
        alert("Iltimos mijoz, mahsulot va sonini to'g'ri kiriting.");
        return;
      }
      
      try {
        const saleData = {
          sana: d.sana || todayStr(),
          customerId: d.customerId,
          productId: d.productId,
          soni: Number(d.soni),
          tolangan: Number(d.tolangan || 0)
        };
        
        const result = await addSale(saleData);
        
        state.saleDraft = { sana: todayStr(), productId: '', customerId: '', soni: '', tolangan: '' };
        state.searchQuery = '';
        state.searchResults = [];
        state.showSearchResults = false;
        if (searchInput) searchInput.value = '';
        if (productHidden) productHidden.value = '';
        
        await loadData();
        render();
        
        alert(`✅ Sotuv muvaffaqiyatli saqlandi!\nJami: ${fmt(result.jami)} so'm\nQarz: ${fmt(result.qarz)} so'm`);
        
      } catch (error) {
        console.error('❌ Sotuv xatosi:', error);
        alert('Xatolik: ' + error.message);
      }
    });
  }

  // History
  const histSana = document.getElementById('histSana');
  const histCustomer = document.getElementById('histCustomer');
  const histBtn = document.getElementById('histShowBtn');
  const histClearBtn = document.getElementById('histClearBtn');

  if (histBtn) {
    histBtn.addEventListener('click', () => {
      state.historyFilter = { 
        sana: histSana.value, 
        customerId: histCustomer.value 
      };
      render();
    });
  }

  if (histClearBtn) {
    histClearBtn.addEventListener('click', () => {
      if (histSana) histSana.value = '';
      if (histCustomer) histCustomer.value = '';
      state.historyFilter = { sana: '', customerId: '' };
      render();
    });
  }

  // Settings - Avatar
  const avatarForm = document.getElementById('avatarForm');
  if (avatarForm) {
    avatarForm.addEventListener('submit', async e => {
      e.preventDefault();
      const url = document.getElementById('avatarUrl').value.trim();
      if (url) {
        state.settings.avatar = url;
        localStorage.setItem('user_avatar', url);
        render();
      }
    });
  }

  // Settings - Theme
  const applyThemeBtn = document.getElementById('applyThemeBtn');
  if (applyThemeBtn) {
    applyThemeBtn.addEventListener('click', () => {
      const neonColor = document.getElementById('neonColor').value;
      const bgColor = document.getElementById('bgColor').value;
      document.documentElement.style.setProperty('--neon-blue', neonColor);
      document.documentElement.style.setProperty('--dark-bg', bgColor);
      document.querySelector('.neon-bg').style.background = bgColor;
      localStorage.setItem('theme_neon', neonColor);
      localStorage.setItem('theme_bg', bgColor);
    });
  }

  // Load saved theme
  const savedNeon = localStorage.getItem('theme_neon');
  const savedBg = localStorage.getItem('theme_bg');
  if (savedNeon) {
    document.documentElement.style.setProperty('--neon-blue', savedNeon);
  }
  if (savedBg) {
    document.documentElement.style.setProperty('--dark-bg', savedBg);
  }
}

// ============ LANGUAGE CHANGE ============
function changeLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  render();
}
window.changeLanguage = changeLanguage;

// ============ LOAD DATA ============
async function loadData() {
  try {
    state.loading = true;
    const [customers, products, sales, users] = await Promise.all([
      getCustomers().catch(() => []),
      getProducts().catch(() => []),
      getSales().catch(() => []),
      getUsers().catch(() => [])
    ]);
    state.customers = customers;
    state.products = products;
    state.sales = sales;
    state.users = users;
    state.loaded = true;
    state.loading = false;
    state.error = null;
  } catch (error) {
    state.loading = false;
    state.error = error.message;
    render();
  }
}

// ============ INIT ============
(async function init() {
  try {
    const savedToken = localStorage.getItem('token');
    
    // Load theme
    const savedNeon = localStorage.getItem('theme_neon');
    const savedBg = localStorage.getItem('theme_bg');
    if (savedNeon) {
      document.documentElement.style.setProperty('--neon-blue', savedNeon);
    }
    if (savedBg) {
      document.documentElement.style.setProperty('--dark-bg', savedBg);
    }
    
    if (savedToken) {
      token = savedToken;
      try {
        const user = await getCurrentUser();
        if (user) {
          state.currentUser = user;
          await loadData();
          state.loaded = true;
          render();
          return;
        }
      } catch (error) {
        console.log('Token eskirgan:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('app_state');
        token = null;
        state.currentUser = null;
      }
    }
    
    state.loaded = true;
    render();
  } catch (error) {
    console.error('Init xatosi:', error);
    state.loaded = true;
    render();
  }
})();

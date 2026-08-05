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

// ============ MIJOZ QARZI (TO'G'RI HISOBLASH) ============
function getCustomerDebtLocal(customerId) {
  // Mijozning barcha sotuvlari
  const sales = state.sales.filter(function(s) { return s.customerId === customerId; });
  
  // Sotuvlar bo'yicha umumiy qarz
  const totalDebt = sales.reduce(function(sum, s) { 
    return sum + (s.qarz || 0); 
  }, 0);
  
  // Qarz to'lovlari
  const payments = state.payments.filter(function(p) { return p.customerId === customerId; });
  const totalPaid = payments.reduce(function(sum, p) { 
    return sum + p.amount; 
  }, 0);
  
  // Qolgan qarz
  const debt = Math.max(0, totalDebt - totalPaid);
  return debt;
}

// ============ COMPUTE SALE (TO'G'RI HISOBLASH) ============
function computeSaleFigures(d) {
  const product = state.products.find(function(p) { return p._id === d.productId; });
  
  // Jami summa
  const jami = product && d.soni ? product.narx * Number(d.soni) : 0;
  
  // Mijoz bergan pul
  const tolangan = Number(d.tolangan || 0);
  
  // Bu sotuv bo'yicha qarz
  const qarz = Math.max(0, jami - tolangan);
  
  // Ortiqcha to'lov
  const ortiqcha = Math.max(0, tolangan - jami);
  
  // Mijozning oldingi qarzi
  const existingDebt = d.customerId ? getCustomerDebtLocal(d.customerId) : 0;
  
  // Ortiqcha to'lov oldingi qarzni kamaytiradi
  const debtAfter = Math.max(0, existingDebt - ortiqcha);
  
  return { 
    product: product,
    jami: jami,
    tolangan: tolangan,
    qarz: qarz,
    ortiqcha: ortiqcha,
    existingDebt: existingDebt,
    debtAfter: debtAfter
  };
}

// ============ RENDER ============
function render() {
  const app = document.getElementById('app');
  if (state.loading) {
    app.innerHTML = '<div class="loading-spinner">Yuklanmoqda...</div>';
    return;
  }
  if (!state.loaded) {
    app.innerHTML = '<div class="loading-spinner">Ma\'lumotlar yuklanmoqda...</div>';
    return;
  }
  if (!state.currentUser) {
    app.innerHTML = renderLogin();
    attachLoginEvents();
    return;
  }
  if (state.error) {
    app.innerHTML = '<div style="padding:40px;text-align:center;color:#ff4444;">' +
      '<h3>Xatolik yuz berdi</h3>' +
      '<p>' + state.error + '</p>' +
      '<button onclick="location.reload()" class="btn-neon" style="width:auto;margin-top:20px;">Qayta yuklash</button>' +
    '</div>';
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
  const hello = LANGUAGES[currentLang].hello || 'Salom';
  
  return `
  <div class="login-wrap">
    <div class="login-card glass">
      <div class="logo">🚀</div>
      <h1>Toys Note</h1>
      <p class="subtitle">${hello}! Do'kon boshqaruv tizimiga xush kelibsiz</p>
      ${state.loginErr ? '<div class="login-error">' + state.loginErr + '</div>' : ''}
      <form id="loginForm">
        <div class="field">
          <label>Login</label>
          <input id="loginInput" autocomplete="username" required value="baxrom">
        </div>
        <div class="field">
          <label>Parol</label>
          <input id="parolInput" type="password" autocomplete="current-password" required value="14042011">
        </div>
        <button class="btn-neon" type="submit" style="width:100%;">${t('login')}</button>
      </form>
      <p style="margin-top:16px;font-size:12px;color:rgba(255,255,255,0.3);">Admin: baxrom / 14042011</p>
    </div>
  </div>`;
}

function attachLoginEvents() {
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
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

// ============ SHELL ============
function renderShell() {
  const isAdmin = state.currentUser?.role === 'admin';
  const userName = state.currentUser?.login || '';
  const userRole = isAdmin ? t('admin') : t('user');
  const avatar = state.settings.avatar || '';
  const hello = LANGUAGES[currentLang].hello || 'Salom';
  
  // Avatar default
  const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%232F6FE4"/%3E%3Ctext x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-weight="bold"%3E' + userName.charAt(0).toUpperCase() + '%3C/text%3E%3C/svg%3E';
  
  const navItems = [
    { id: 'mijozlar', label: t('customers'), icon: '👥' },
    { id: 'mahsulot', label: t('products'), icon: '📦' },
    { id: 'sotuv', label: t('sales'), icon: '🛒' },
    { id: 'statistika', label: t('statistics'), icon: '📊' },
    { id: 'tarix', label: t('history'), icon: '📜' }
  ];
  
  if (isAdmin) {
    navItems.push({ id: 'sozlamalar', label: t('settings'), icon: '⚙️' });
  }
  
  const navHtml = navItems.map(function(n) {
    return '<div class="nav-item ' + (state.view === n.id ? 'active' : '') + '" data-nav="' + n.id + '">' +
      '<span class="icon">' + n.icon + '</span>' +
      '<span>' + n.label + '</span>' +
    '</div>';
  }).join('');
  
  const langOptions = ['uz', 'ru', 'en'].map(function(l) {
    return '<option value="' + l + '" ' + (currentLang === l ? 'selected' : '') + '>' + l.toUpperCase() + '</option>';
  }).join('');
  
  return `
  <div class="shell">
    <div class="sidebar">
      <div class="brand">
        <span class="logo-icon">🚀</span>
        <span>Toys Note</span>
      </div>
      
      <div style="display:flex;gap:8px;margin-bottom:16px;padding:0 12px;">
        <select id="langSelect" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:8px 12px;color:#fff;font-size:13px;flex:1;font-family:'Inter',sans-serif;">
          ${langOptions}
        </select>
      </div>
      
      ${navHtml}
      
      <div style="flex:1;"></div>
      
      <div class="user-chip">
        <div class="user-avatar">
          <img src="${avatar || defaultAvatar}" alt="Avatar">
        </div>
        <div class="user-info">
          <div class="name">${hello}, ${userName}</div>
          <div class="role">${userRole}</div>
        </div>
      </div>
      
      <button class="logout-btn" id="logoutBtn">${t('logout')}</button>
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
  document.querySelectorAll('[data-nav]').forEach(function(el) {
    el.addEventListener('click', function() {
      state.view = this.getAttribute('data-nav');
      saveStateToStorage();
      render();
    });
  });
  
  document.getElementById('logoutBtn').addEventListener('click', function() {
    const goodbye = LANGUAGES[currentLang].goodbye || 'Hayr';
    const userName = state.currentUser?.login || 'User';
    
    // Oddiy chiqish - salom bilan
    alert(goodbye + ', ' + userName + '! 👋');
    
    state.currentUser = null;
    token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('app_state');
    state.loaded = false;
    render();
  });
  
  document.getElementById('langSelect').addEventListener('change', function() {
    currentLang = this.value;
    localStorage.setItem('lang', currentLang);
    render();
  });
  
  attachViewEvents();
}

// ============ VIEWS ============

// ---- MIJOZLAR ----
function viewMijozlar() {
  const rows = state.customers.map(function(c) {
    const debt = getCustomerDebtLocal(c._id);
    return '<tr>' +
      '<td>' + c.name + '</td>' +
      '<td>' + (c.phone || '—') + '</td>' +
      '<td>' + (debt > 0 ? '<span class="pill pill-debt">' + fmt(debt) + ' so\'m qarz</span>' : '<span class="pill pill-ok">Qarzi yo\'q</span>') + '</td>' +
      '<td>' +
        (debt > 0 ? '<button class="small-btn pay" data-pay-customer="' + c._id + '">💰 Qarz to\'lash</button>' : '') +
        '<button class="small-btn danger" data-del-customer="' + c._id + '">🗑️ O\'chirish</button>' +
      '</td>' +
    '</tr>';
  }).join('');
  
  return `
  <div class="topbar">
    <div>
      <h2>${t('customers')}</h2>
      <p>Barcha mijozlar ro'yxati</p>
    </div>
  </div>
  <div class="card">
    <h3>Yangi mijoz qo'shish</h3>
    <form id="customerForm" class="row-flex">
      <div class="field">
        <label>Ism-familiya</label>
        <input id="custName" required placeholder="Masalan: Aziz Karimov">
      </div>
      <div class="field">
        <label>Telefon</label>
        <input id="custPhone" type="tel" placeholder="+998 90 123 45 67">
      </div>
      <button class="btn-neon" type="submit">Qo'shish</button>
    </form>
  </div>
  <div class="card">
    <h3>Mijozlar ro'yxati (${state.customers.length})</h3>
    ${state.customers.length ? '<table><thead><tr><th>Ism</th><th>Telefon</th><th>Holati</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">Hali mijoz qo\'shilmagan.</div>'}
  </div>`;
}

// ---- PAY MODAL ----
function renderPayModal() {
  const c = state.customers.find(function(x) { return x._id === state.payModal.customerId; });
  if (!c) return '';
  const debt = getCustomerDebtLocal(c._id);
  return `
  <div class="modal-overlay" id="payOverlay">
    <div class="modal-card glass">
      <h3>💰 Qarz to'lash — ${c.name}</h3>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;margin-top:-8px;">Joriy qarz: <b style="color:#fb923c;">${fmt(debt)} so'm</b></p>
      <form id="payForm">
        <div class="field">
          <label>Sana</label>
          <input type="date" id="paySana" value="${todayStr()}">
        </div>
        <div class="field">
          <label>To'lov summasi (so'm)</label>
          <input type="number" min="1" max="${debt}" id="payAmount" required placeholder="0">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="payCancelBtn">Bekor qilish</button>
          <button type="submit" class="btn-neon">Saqlash</button>
        </div>
      </form>
    </div>
  </div>`;
}

function attachPayModalEvents() {
  document.getElementById('payCancelBtn').addEventListener('click', function() {
    state.payModal = null;
    render();
  });
  
  document.getElementById('payOverlay').addEventListener('click', function(e) {
    if (e.target.id === 'payOverlay') {
      state.payModal = null;
      render();
    }
  });
  
  document.getElementById('payForm').addEventListener('submit', async function(e) {
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
  const rows = state.products.map(function(p) {
    const soldQty = state.sales.filter(function(s) { return s.productId === p._id; }).reduce(function(a, s) { return a + s.soni; }, 0);
    return '<tr>' +
      '<td><span class="artikul-badge">' + (p.artikul || 'ART-???') + '</span></td>' +
      '<td>' + p.name + '</td>' +
      '<td>' + fmt(p.narx) + ' so\'m</td>' +
      '<td>' + soldQty + ' dona</td>' +
      '<td>' +
        '<button class="small-btn danger" data-del-product="' + p._id + '">🗑️ O\'chirish</button>' +
        '<button class="small-btn pay" data-last-product="' + p._id + '">📦 Oxirgi</button>' +
      '</td>' +
    '</tr>';
  }).join('');
  
  return `
  <div class="topbar">
    <div>
      <h2>${t('products')}</h2>
      <p>O'yinchoqlar va ularning narxlari</p>
    </div>
  </div>
  <div class="card">
    <h3>Yangi o'yinchoq qo'shish</h3>
    <form id="productForm" class="row-flex">
      <div class="field">
        <label>Nomi</label>
        <input id="prodName" required placeholder="Masalan: Ayiqcha">
      </div>
      <div class="field">
        <label>Narxi (so'm)</label>
        <input id="prodNarx" type="number" min="0" required placeholder="50000">
      </div>
      <button class="btn-neon" type="submit">Qo'shish</button>
    </form>
    <p style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:10px;">⚠️ Artikul avtomatik yaratiladi: ART-001, ART-002 ...</p>
  </div>
  <div class="card">
    <h3>Mahsulotlar ro'yxati (${state.products.length})</h3>
    ${state.products.length ? '<table><thead><tr><th>Artikul</th><th>Nomi</th><th>Narxi</th><th>Sotuvlar</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">Hali mahsulot qo\'shilmagan.</div>'}
  </div>`;
}

// ---- SOTUV ----
function viewSotuv() {
  const d = state.saleDraft;
  const f = computeSaleFigures(d);
  const customerOptions = state.customers.map(function(c) {
    return '<option value="' + c._id + '" ' + (d.customerId === c._id ? 'selected' : '') + '>' + c.name + '</option>';
  }).join('');
  
  let searchResultsHtml = '';
  if (state.showSearchResults && state.searchResults.length > 0) {
    searchResultsHtml = state.searchResults.map(function(p) {
      return '<div class="search-result" data-product-id="' + p._id + '" data-product-name="' + p.name + '" data-product-narx="' + p.narx + '" data-product-artikul="' + (p.artikul || 'ART-???') + '">' +
        '<span class="artikul">' + (p.artikul || 'ART-???') + '</span> - ' + p.name + ' <span style="color:rgba(255,255,255,0.3);">' + fmt(p.narx) + ' so\'m</span>' +
      '</div>';
    }).join('');
  }

  let selectedProductHtml = '';
  if (d.productId) {
    const p = state.products.find(function(x) { return x._id === d.productId; });
    if (p) {
      selectedProductHtml = '<div style="margin-top:8px;padding:12px 16px;background:rgba(0,212,255,0.05);border-radius:12px;border:1px solid rgba(0,212,255,0.08);">' +
        '<strong>Tanlangan:</strong> <span class="artikul-badge">' + (p.artikul || 'ART-???') + '</span> ' + p.name + ' — ' + fmt(p.narx) + ' so\'m' +
      '</div>';
    }
  }

  return `
  <div class="topbar">
    <div>
      <h2>${t('sales')}</h2>
      <p>Yangi sotuvni ro'yxatga oling</p>
    </div>
  </div>
  ${!state.products.length || !state.customers.length ? '<div class="msg msg-warn">Sotuv qilishdan oldin kamida bitta mahsulot va bitta mijoz qo\'shing.</div>' : ''}
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
              ${state.showSearchResults && state.searchResults.length === 0 ? '<div class="search-result" style="color:rgba(255,255,255,0.3);cursor:default;">Hech narsa topilmadi</div>' : ''}
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
          <div class="t-val" id="salePerUnitVal" style="font-size:18px;">${f.product ? fmt(f.product.narx) : 0} so'm</div>
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label>Mijoz bergan pul</label>
          <input type="number" min="0" id="saleTolangan" value="${d.tolangan}" placeholder="0">
        </div>
        <div class="field">
          <label>Ushbu sotuv bo'yicha qarz</label>
          <input id="saleQarzVal" value="${fmt(f.qarz)} so'm" disabled style="background:${f.qarz > 0 ? 'rgba(251,146,60,0.1)' : 'rgba(34,211,238,0.1)'};color:${f.qarz > 0 ? '#fb923c' : '#22d3ee'};font-weight:700;border:1px solid ${f.qarz > 0 ? 'rgba(251,146,60,0.2)' : 'rgba(34,211,238,0.2)'};">
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn-neon" type="submit">${t('save')}</button>
        <button type="button" class="btn-neon" id="lastProductBtn" style="background:linear-gradient(135deg, #ff6bcd, #a855f7);">📦 ${t('lastProduct')}</button>
      </div>
    </form>
  </div>`;
}

// ---- STATISTIKA ----
function viewStatistika() {
  // To'g'ri hisoblash
  const totalSales = state.sales.reduce(function(a, s) { return a + s.jami; }, 0);
  const totalPaid = state.sales.reduce(function(a, s) { return a + s.tolangan; }, 0);
  
  let totalDebt = 0;
  state.customers.forEach(function(c) {
    totalDebt += getCustomerDebtLocal(c._id);
  });
  
  return `
  <div class="topbar">
    <div>
      <h2>${t('statistics')}</h2>
      <p>Do'kon faoliyati bo'yicha umumiy ko'rsatkichlar</p>
    </div>
  </div>
  <div class="grid-3" style="margin-bottom:20px;">
    <div class="stat-card glass">
      <div class="icn" style="background:rgba(0,212,255,0.06);color:#00d4ff;">💰</div>
      <div class="lbl">Umumiy savdo</div>
      <div class="val">${fmt(totalSales)} so'm</div>
    </div>
    <div class="stat-card glass">
      <div class="icn" style="background:rgba(34,211,238,0.06);color:#22d3ee;">✅</div>
      <div class="lbl">Qabul qilingan pul</div>
      <div class="val">${fmt(totalPaid)} so'm</div>
    </div>
    <div class="stat-card glass">
      <div class="icn" style="background:rgba(251,146,60,0.06);color:#fb923c;">⚠️</div>
      <div class="lbl">Umumiy qarz</div>
      <div class="val">${fmt(totalDebt)} so'm</div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <h3>Kunlar bo'yicha savdo</h3>
      <div class="chart-box"><canvas id="chartDaily"></canvas></div>
    </div>
    <div class="card">
      <h3>Mahsulotlar bo'yicha sotuv</h3>
      <div class="chart-box"><canvas id="chartProducts"></canvas></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <h3>Eng ko'p xarid qilgan mijozlar</h3>
      <div class="chart-box"><canvas id="chartCustomers"></canvas></div>
    </div>
    <div class="card">
      <h3>Mijozlar bo'yicha qarzdorlik</h3>
      <div class="chart-box"><canvas id="chartDebt"></canvas></div>
    </div>
  </div>`;
}

// ============ CHARTS ============
let chartInstances = [];

function destroyCharts() {
  chartInstances.forEach(function(c) {
    try { c.destroy(); } catch (e) {}
  });
  chartInstances = [];
}

function drawStatCharts() {
  if (state.view !== 'statistika' || typeof Chart === 'undefined') return;
  destroyCharts();
  var palette = ['#00d4ff', '#ff6bcd', '#a855f7', '#22d3ee', '#fb923c', '#fbbf24'];

  // Daily
  var byDay = {};
  state.sales.forEach(function(s) {
    byDay[s.sana] = (byDay[s.sana] || 0) + s.jami;
  });
  var days = Object.keys(byDay).sort();
  var dailyCtx = document.getElementById('chartDaily');
  if (dailyCtx && days.length) {
    chartInstances.push(new Chart(dailyCtx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: "Savdo (so'm)",
          data: days.map(function(d) { return byDay[d]; }),
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.05)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false
      }
    }));
  } else if (dailyCtx) {
    dailyCtx.parentElement.innerHTML = '<div class="empty">Hali sotuvlar mavjud emas.</div>';
  }

  // Products
  var byProd = {};
  state.sales.forEach(function(s) {
    var p = state.products.find(function(x) { return x._id === s.productId; });
    var name = p ? p.name : '—';
    byProd[name] = (byProd[name] || 0) + s.soni;
  });
  var prodCtx = document.getElementById('chartProducts');
  if (prodCtx) {
    var prodLabels = Object.keys(byProd);
    if (prodLabels.length) {
      chartInstances.push(new Chart(prodCtx, {
        type: 'bar',
        data: {
          labels: prodLabels,
          datasets: [{
            label: 'Dona',
            data: prodLabels.map(function(l) { return byProd[l]; }),
            backgroundColor: prodLabels.map(function(_, i) { return palette[i % palette.length]; })
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      }));
    } else {
      prodCtx.parentElement.innerHTML = '<div class="empty">Hali sotuvlar mavjud emas.</div>';
    }
  }

  // Customers
  var byCust = {};
  state.sales.forEach(function(s) {
    var c = state.customers.find(function(x) { return x._id === s.customerId; });
    var name = c ? c.name : '—';
    byCust[name] = (byCust[name] || 0) + s.jami;
  });
  var custCtx = document.getElementById('chartCustomers');
  if (custCtx) {
    var custLabels = Object.keys(byCust).sort(function(a, b) {
      return byCust[b] - byCust[a];
    }).slice(0, 8);
    if (custLabels.length) {
      chartInstances.push(new Chart(custCtx, {
        type: 'bar',
        data: {
          labels: custLabels,
          datasets: [{
            label: "So'm",
            data: custLabels.map(function(l) { return byCust[l]; }),
            backgroundColor: '#00d4ff'
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          responsive: true,
          maintainAspectRatio: false
        }
      }));
    } else {
      custCtx.parentElement.innerHTML = '<div class="empty">Hali sotuvlar mavjud emas.</div>';
    }
  }

  // Debt
  var byDebt = {};
  state.customers.forEach(function(c) {
    var d = getCustomerDebtLocal(c._id);
    if (d > 0) byDebt[c.name] = d;
  });
  var debtCtx = document.getElementById('chartDebt');
  if (debtCtx) {
    var debtLabels = Object.keys(byDebt);
    if (debtLabels.length) {
      chartInstances.push(new Chart(debtCtx, {
        type: 'doughnut',
        data: {
          labels: debtLabels,
          datasets: [{
            data: debtLabels.map(function(l) { return byDebt[l]; }),
            backgroundColor: debtLabels.map(function(_, i) { return palette[i % palette.length]; })
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      }));
    } else {
      debtCtx.parentElement.innerHTML = '<div class="empty">Qarzdorlik mavjud emas.</div>';
    }
  }
}

// ---- TARIX ----
function viewTarix() {
  var f = state.historyFilter;
  var customerOptions = state.customers.map(function(c) {
    return '<option value="' + c._id + '" ' + (f.customerId === c._id ? 'selected' : '') + '>' + c.name + '</option>';
  }).join('');
  var resultsHtml = '';
  
  if (f.customerId) {
    var filterSana = f.sana;
    if (filterSana) {
      var parts = filterSana.split('.');
      if (parts.length === 3) {
        filterSana = parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0');
      }
    }
    
    var matches = state.sales.filter(function(s) {
      return s.customerId === f.customerId;
    });
    if (filterSana) {
      matches = matches.filter(function(s) {
        return s.sana === filterSana;
      });
    }
    
    matches.sort(function(a, b) {
      return b.createdAt - a.createdAt;
    });
    
    var totalJami = matches.reduce(function(a, s) { return a + s.jami; }, 0);
    var totalTolangan = matches.reduce(function(a, s) { return a + s.tolangan; }, 0);
    var totalQarz = matches.reduce(function(a, s) { return a + s.qarz; }, 0);
    
    var payments = state.payments.filter(function(p) {
      return p.customerId === f.customerId;
    });
    var totalPayments = payments.reduce(function(a, p) { return a + p.amount; }, 0);
    
    if (matches.length > 0 || payments.length > 0) {
      var rows = matches.map(function(s) {
        var p = state.products.find(function(x) { return x._id === s.productId; });
        var dateParts = s.sana.split('-');
        var formattedDate = dateParts.length === 3 ? dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0] : s.sana;
        
        return '<tr>' +
          '<td>' + formattedDate + '</td>' +
          '<td>' + (p ? p.name : '—') + '</td>' +
          '<td>' + s.soni + ' dona</td>' +
          '<td>' + fmt(s.jami) + ' so\'m</td>' +
          '<td>' + fmt(s.tolangan) + ' so\'m</td>' +
          '<td>' + (s.qarz > 0 ? '<span class="pill pill-debt">' + fmt(s.qarz) + ' so\'m</span>' : '<span class="pill pill-ok">To\'liq</span>') + '</td>' +
        '</tr>';
      }).join('');
      
      var paymentRows = payments.map(function(p) {
        var dateParts = p.sana.split('-');
        var formattedDate = dateParts.length === 3 ? dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0] : p.sana;
        return '<tr>' +
          '<td>' + formattedDate + '</td>' +
          '<td colspan="3">💳 Qarz to\'lovi</td>' +
          '<td colspan="2"><span class="pill pill-ok">' + fmt(p.amount) + ' so\'m</span></td>' +
        '</tr>';
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
        <div class="sale-total-box" style="margin-top:18px;">
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
          ${totalPayments > 0 ? '<div><div class="t-lbl">Qarz to\'lovi</div><div class="t-val">' + fmt(totalPayments) + ' so\'m</div></div>' : ''}
        </div>
      `;
    } else {
      resultsHtml = '<div class="empty">Bu mijoz bo\'yicha hech qanday ma\'lumot topilmadi.</div>';
    }
  } else {
    resultsHtml = '<div class="empty">Natijalarni ko\'rish uchun mijozni tanlang.</div>';
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
      <button class="btn-secondary" id="histClearBtn" style="width:auto;">Tozalash</button>
    </div>
  </div>
  <div class="card">
    <h3>Natija</h3>
    ${resultsHtml}
  </div>`;
}

// ---- SOZLAMALAR ----
function viewSozlamalar() {
  var isAdmin = state.currentUser?.role === 'admin';
  var userName = state.currentUser?.login || '';
  var avatar = state.settings.avatar || '';
  var defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Ccircle cx="40" cy="40" r="40" fill="%232F6FE4"/%3E%3Ctext x="40" y="52" text-anchor="middle" fill="white" font-size="36" font-weight="bold"%3E' + userName.charAt(0).toUpperCase() + '%3C/text%3E%3C/svg%3E';
  
  return `
  <div class="topbar">
    <div>
      <h2>⚙️ ${t('settings')}</h2>
      <p>Shaxsiy sozlamalar va dizayn</p>
    </div>
  </div>
  
  <div class="card">
    <h3>👤 Profil rasmi</h3>
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <div class="user-avatar" style="width:80px;height:80px;">
        <img src="${avatar || defaultAvatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
      </div>
      <div>
        <form id="avatarForm" style="display:flex;gap:10px;flex-wrap:wrap;">
          <div class="field" style="margin-bottom:0;">
            <label>Rasm URL</label>
            <input id="avatarUrl" placeholder="https://example.com/avatar.jpg" style="min-width:250px;">
          </div>
          <button class="btn-neon" type="submit">Yangilash</button>
        </form>
        <p style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:8px;">💡 Rasm URL ni kiriting yoki default qoldiring</p>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h3>🌐 Til</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="${currentLang === 'uz' ? 'btn-neon' : 'btn-secondary'}" onclick="changeLanguage('uz')" style="padding:10px 20px;border-radius:12px;border:${currentLang === 'uz' ? 'none' : '1px solid rgba(255,255,255,0.06)'};background:${currentLang === 'uz' ? 'linear-gradient(135deg, #00d4ff, #a855f7)' : 'rgba(255,255,255,0.03)'};color:#fff;cursor:pointer;">
        🇺🇿 O'zbek
      </button>
      <button class="${currentLang === 'ru' ? 'btn-neon' : 'btn-secondary'}" onclick="changeLanguage('ru')" style="padding:10px 20px;border-radius:12px;border:${currentLang === 'ru' ? 'none' : '1px solid rgba(255,255,255,0.06)'};background:${currentLang === 'ru' ? 'linear-gradient(135deg, #00d4ff, #a855f7)' : 'rgba(255,255,255,0.03)'};color:#fff;cursor:pointer;">
        🇷🇺 Русский
      </button>
      <button class="${currentLang === 'en' ? 'btn-neon' : 'btn-secondary'}" onclick="changeLanguage('en')" style="padding:10px 20px;border-radius:12px;border:${currentLang === 'en' ? 'none' : '1px solid rgba(255,255,255,0.06)'};background:${currentLang === 'en' ? 'linear-gradient(135deg, #00d4ff, #a855f7)' : 'rgba(255,255,255,0.03)'};color:#fff;cursor:pointer;">
        🇬🇧 English
      </button>
    </div>
  </div>
  
  ${isAdmin ? `
  <div class="card">
    <h3>🎨 Dizayn sozlamalari</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <div style="display:flex;gap:6px;align-items:center;">
        <span style="color:rgba(255,255,255,0.4);">Neon rang:</span>
        <input type="color" id="neonColor" value="#00d4ff" style="width:40px;height:40px;border:none;border-radius:8px;cursor:pointer;background:transparent;">
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <span style="color:rgba(255,255,255,0.4);">Fon rangi:</span>
        <input type="color" id="bgColor" value="#0a0a1a" style="width:40px;height:40px;border:none;border-radius:8px;cursor:pointer;background:transparent;">
      </div>
    </div>
    <button class="btn-neon" id="applyThemeBtn" style="margin-top:16px;">🎨 Qo'llash</button>
  </div>
  ` : ''}
  
  <div class="card">
    <h3>📊 Ma'lumotlar</h3>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.8;">
      Mijozlar: ${state.customers.length} ta<br>
      Mahsulotlar: ${state.products.length} ta<br>
      Sotuvlar: ${state.sales.length} ta<br>
      Jami savdo: ${fmt(state.sales.reduce(function(a, s) { return a + s.jami; }, 0))} so'm
    </p>
  </div>
  `;
}

// ============ VIEW EVENTS ============
function attachViewEvents() {
  // Customers
  var custForm = document.getElementById('customerForm');
  if (custForm) {
    custForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var name = document.getElementById('custName').value.trim();
      var phone = document.getElementById('custPhone').value.trim();
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

  document.querySelectorAll('[data-del-customer]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var id = this.getAttribute('data-del-customer');
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

  document.querySelectorAll('[data-pay-customer]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.payModal = { customerId: this.getAttribute('data-pay-customer') };
      render();
    });
  });

  // Products
  var prodForm = document.getElementById('productForm');
  if (prodForm) {
    prodForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var name = document.getElementById('prodName').value.trim();
      var narx = Number(document.getElementById('prodNarx').value);
      if (!name || !narx) return;
      try {
        var result = await addProduct(name, narx);
        alert('✅ Mahsulot qo\'shildi!\nArtikul: ' + result.artikul + '\nNomi: ' + result.name + '\nNarxi: ' + fmt(result.narx) + ' so\'m');
        await loadData();
        render();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  document.querySelectorAll('[data-del-product]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var id = this.getAttribute('data-del-product');
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
  document.querySelectorAll('[data-last-product]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = this.getAttribute('data-last-product');
      var product = state.products.find(function(p) { return p._id === id; });
      if (product) {
        state.lastProductSale = product;
        state.saleDraft.productId = product._id;
        state.view = 'sotuv';
        state.searchQuery = product.artikul + ' - ' + product.name;
        render();
      }
    });
  });

  // Sales
  var saleForm = document.getElementById('saleForm');
  if (saleForm) {
    var searchInput = document.getElementById('saleProductSearch');
    var productHidden = document.getElementById('saleProduct');
    var lastProductBtn = document.getElementById('lastProductBtn');

    if (lastProductBtn) {
      lastProductBtn.addEventListener('click', function() {
        if (state.products.length === 0) {
          alert('Hali mahsulot mavjud emas!');
          return;
        }
        var lastProduct = state.products[state.products.length - 1];
        state.lastProductSale = lastProduct;
        state.saleDraft.productId = lastProduct._id;
        if (searchInput) searchInput.value = lastProduct.artikul + ' - ' + lastProduct.name;
        if (productHidden) productHidden.value = lastProduct._id;
        render();
        setTimeout(function() {
          var event = new Event('input');
          var soniEl = document.getElementById('saleSoni');
          if (soniEl) soniEl.dispatchEvent(event);
        }, 100);
      });
    }

    if (searchInput) {
      var searchTimeout;
      searchInput.addEventListener('input', async function() {
        var query = this.value.trim();
        state.searchQuery = query;
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async function() {
          if (query.length > 0) {
            try {
              var results = await searchProducts(query);
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
        var result = e.target.closest('.search-result');
        if (result) {
          var productId = result.dataset.productId;
          var productName = result.dataset.productName;
          var productArtikul = result.dataset.productArtikul;
          
          if (productHidden) productHidden.value = productId;
          searchInput.value = (productArtikul || 'ART-???') + ' - ' + productName;
          state.searchResults = [];
          state.showSearchResults = false;
          state.searchQuery = '';
          state.saleDraft.productId = productId;
          
          render();
          
          setTimeout(function() {
            var event = new Event('input');
            var soniEl = document.getElementById('saleSoni');
            if (soniEl) soniEl.dispatchEvent(event);
          }, 100);
        }
      });
    }

    var updateSaleComputed = function() {
      state.saleDraft = {
        sana: document.getElementById('saleSana').value,
        customerId: document.getElementById('saleCustomer').value,
        productId: document.getElementById('saleProduct').value,
        soni: document.getElementById('saleSoni').value,
        tolangan: document.getElementById('saleTolangan').value
      };
      var f = computeSaleFigures(state.saleDraft);
      var jamiEl = document.getElementById('saleJamiVal');
      var perUnitEl = document.getElementById('salePerUnitVal');
      var qarzEl = document.getElementById('saleQarzVal');
      
      if (jamiEl) jamiEl.textContent = fmt(f.jami) + " so'm";
      if (perUnitEl) perUnitEl.textContent = (f.product ? fmt(f.product.narx) : 0) + " so'm";
      if (qarzEl) {
        qarzEl.value = fmt(f.qarz) + " so'm";
        qarzEl.style.background = f.qarz > 0 ? 'rgba(251,146,60,0.1)' : 'rgba(34,211,238,0.1)';
        qarzEl.style.color = f.qarz > 0 ? '#fb923c' : '#22d3ee';
        qarzEl.style.border = '1px solid ' + (f.qarz > 0 ? 'rgba(251,146,60,0.2)' : 'rgba(34,211,238,0.2)');
      }
    };

    ['saleSana', 'saleCustomer', 'saleSoni', 'saleTolangan'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      var evt = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
      el.addEventListener(evt, updateSaleComputed);
    });

    saleForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var d = state.saleDraft;
      
      if (!d.customerId || !d.productId || !d.soni || Number(d.soni) <= 0) {
        alert("Iltimos mijoz, mahsulot va sonini to'g'ri kiriting.");
        return;
      }
      
      try {
        var saleData = {
          sana: d.sana || todayStr(),
          customerId: d.customerId,
          productId: d.productId,
          soni: Number(d.soni),
          tolangan: Number(d.tolangan || 0)
        };
        
        var result = await addSale(saleData);
        
        state.saleDraft = { sana: todayStr(), productId: '', customerId: '', soni: '', tolangan: '' };
        state.searchQuery = '';
        state.searchResults = [];
        state.showSearchResults = false;
        if (searchInput) searchInput.value = '';
        if (productHidden) productHidden.value = '';
        
        await loadData();
        render();
        
        var message = '✅ Sotuv muvaffaqiyatli saqlandi!\n';
        message += 'Jami: ' + fmt(result.jami) + ' so\'m\n';
        message += 'Qarz: ' + fmt(result.qarz) + ' so\'m';
        if (result.qarz > 0) {
          message += '\n⚠️ Mijozda qarz qoldi!';
        } else {
          message += '\n✅ Mijoz to\'liq to\'ladi!';
        }
        alert(message);
        
      } catch (error) {
        console.error('❌ Sotuv xatosi:', error);
        alert('Xatolik: ' + error.message);
      }
    });
  }

  // History
  var histSana = document.getElementById('histSana');
  var histCustomer = document.getElementById('histCustomer');
  var histBtn = document.getElementById('histShowBtn');
  var histClearBtn = document.getElementById('histClearBtn');

  if (histBtn) {
    histBtn.addEventListener('click', function() {
      state.historyFilter = {
        sana: histSana ? histSana.value : '',
        customerId: histCustomer ? histCustomer.value : ''
      };
      render();
    });
  }

  if (histClearBtn) {
    histClearBtn.addEventListener('click', function() {
      if (histSana) histSana.value = '';
      if (histCustomer) histCustomer.value = '';
      state.historyFilter = { sana: '', customerId: '' };
      render();
    });
  }

  // Settings - Avatar
  var avatarForm = document.getElementById('avatarForm');
  if (avatarForm) {
    avatarForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var url = document.getElementById('avatarUrl').value.trim();
      if (url) {
        state.settings.avatar = url;
        localStorage.setItem('user_avatar', url);
        render();
      }
    });
  }

  // Settings - Theme
  var applyThemeBtn = document.getElementById('applyThemeBtn');
  if (applyThemeBtn) {
    applyThemeBtn.addEventListener('click', function() {
      var neonColor = document.getElementById('neonColor').value;
      var bgColor = document.getElementById('bgColor').value;
      document.documentElement.style.setProperty('--neon-blue', neonColor);
      document.documentElement.style.setProperty('--dark-bg', bgColor);
      var bg = document.querySelector('.neon-bg');
      if (bg) bg.style.background = bgColor;
      localStorage.setItem('theme_neon', neonColor);
      localStorage.setItem('theme_bg', bgColor);
    });
  }

  // Load saved theme
  var savedNeon = localStorage.getItem('theme_neon');
  var savedBg = localStorage.getItem('theme_bg');
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
    var results = await Promise.all([
      getCustomers().catch(function() { return []; }),
      getProducts().catch(function() { return []; }),
      getSales().catch(function() { return []; }),
      getUsers().catch(function() { return []; })
    ]);
    state.customers = results[0];
    state.products = results[1];
    state.sales = results[2];
    state.users = results[3];
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
    var savedToken = localStorage.getItem('token');
    
    var savedNeon = localStorage.getItem('theme_neon');
    var savedBg = localStorage.getItem('theme_bg');
    if (savedNeon) {
      document.documentElement.style.setProperty('--neon-blue', savedNeon);
    }
    if (savedBg) {
      document.documentElement.style.setProperty('--dark-bg', savedBg);
    }
    
    if (savedToken) {
      token = savedToken;
      try {
        var user = await getCurrentUser();
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

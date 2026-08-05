// ============ MIJOZ QARZI (TO'G'RI HISOBLASH) ============
function getCustomerDebtLocal(customerId) {
  if (!customerId) return 0;
  
  // Mijozning barcha sotuvlari
  const sales = state.sales.filter(function(s) { 
    return s.customerId === customerId; 
  });
  
  // Sotuvlar bo'yicha umumiy qarz
  const totalDebt = sales.reduce(function(sum, s) { 
    return sum + (s.qarz || 0); 
  }, 0);
  
  // Qarz to'lovlari
  const payments = state.payments.filter(function(p) { 
    return p.customerId === customerId; 
  });
  const totalPaid = payments.reduce(function(sum, p) { 
    return sum + (p.amount || 0); 
  }, 0);
  
  // Qolgan qarz
  const debt = Math.max(0, totalDebt - totalPaid);
  
  console.log('💰 Mijoz qarzi:', { customerId, totalDebt, totalPaid, debt });
  return debt;
}

// ============ SOTUV HISOBLASH (TO'G'RI) ============
function computeSaleFigures(d) {
  console.log('📊 Hisoblash uchun ma\'lumotlar:', d);
  
  // Mahsulotni topish
  const product = state.products.find(function(p) { 
    return p._id === d.productId; 
  });
  
  if (!product) {
    console.log('❌ Mahsulot topilmadi');
    return { product: null, jami: 0, tolangan: 0, qarz: 0, ortiqcha: 0, existingDebt: 0, debtAfter: 0 };
  }
  
  // Jami summa
  const soni = Number(d.soni || 0);
  const jami = product.narx * soni;
  
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
  
  const result = {
    product: product,
    jami: jami,
    tolangan: tolangan,
    qarz: qarz,
    ortiqcha: ortiqcha,
    existingDebt: existingDebt,
    debtAfter: debtAfter
  };
  
  console.log('📊 Hisoblash natijasi:', result);
  return result;
}

// ============ SOTUVNI SAQLASH (TO'G'RI) ============
saleForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Sotuv ma'lumotlarini yig'ish
  const sana = document.getElementById('saleSana').value || todayStr();
  const customerId = document.getElementById('saleCustomer').value;
  const productId = document.getElementById('saleProduct').value;
  const soni = Number(document.getElementById('saleSoni').value || 0);
  const tolangan = Number(document.getElementById('saleTolangan').value || 0);
  
  console.log('📤 Sotuv ma\'lumotlari:', { sana, customerId, productId, soni, tolangan });
  
  // Ma'lumotlarni tekshirish
  if (!customerId) {
    alert('Iltimos, mijozni tanlang!');
    return;
  }
  if (!productId) {
    alert('Iltimos, mahsulotni tanlang!');
    return;
  }
  if (soni <= 0) {
    alert('Iltimos, sonini to\'g\'ri kiriting!');
    return;
  }
  
  try {
    // API ga yuborish
    const saleData = {
      sana: sana,
      customerId: customerId,
      productId: productId,
      soni: soni,
      tolangan: tolangan
    };
    
    console.log('📤 API ga yuborilmoqda:', saleData);
    
    const result = await addSale(saleData);
    console.log('✅ Sotuv saqlandi:', result);
    
    // Formani tozalash
    state.saleDraft = { 
      sana: todayStr(), 
      productId: '', 
      customerId: '', 
      soni: '', 
      tolangan: '' 
    };
    state.searchQuery = '';
    state.searchResults = [];
    state.showSearchResults = false;
    
    if (searchInput) searchInput.value = '';
    if (productHidden) productHidden.value = '';
    
    // Ma'lumotlarni qayta yuklash
    await loadData();
    render();
    
    // Natijani ko'rsatish
    let message = '✅ Sotuv muvaffaqiyatli saqlandi!\n\n';
    message += '📦 Mahsulot: ' + (result.productName || '') + '\n';
    message += '💰 Jami: ' + fmt(result.jami) + ' so\'m\n';
    message += '💳 To\'langan: ' + fmt(result.tolangan) + ' so\'m\n';
    message += '📉 Qarz: ' + fmt(result.qarz) + ' so\'m';
    
    if (result.qarz > 0) {
      message += '\n\n⚠️ Mijozda ' + fmt(result.qarz) + ' so\'m qarz qoldi!';
    } else {
      message += '\n\n✅ Mijoz to\'liq to\'ladi!';
    }
    
    alert(message);
    
  } catch (error) {
    console.error('❌ Sotuv xatosi:', error);
    alert('Xatolik: ' + error.message);
  }
});

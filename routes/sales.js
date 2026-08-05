const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Barcha sotuvlar
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error('GET /sales error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Yangi sotuv qo'shish
router.post('/', auth, async (req, res) => {
  try {
    const { sana, customerId, productId, soni, tolangan } = req.body;
    
    console.log('📦 Sotuv ma\'lumotlari:', { sana, customerId, productId, soni, tolangan });
    
    // Ma'lumotlarni tekshirish
    if (!sana) return res.status(400).json({ error: 'Sana kerak' });
    if (!customerId) return res.status(400).json({ error: 'Mijoz kerak' });
    if (!productId) return res.status(400).json({ error: 'Mahsulot kerak' });
    if (!soni || Number(soni) <= 0) return res.status(400).json({ error: 'Soni noto\'g\'ri' });

    // Mahsulotni topish
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Mahsulot topilmadi' });
    }

    // Hisoblashlar
    const soniNum = Number(soni);
    const jami = product.narx * soniNum;
    const tolanganNum = Number(tolangan || 0);
    const qarz = Math.max(0, jami - tolanganNum);
    const ortiqcha = Math.max(0, tolanganNum - jami);

    console.log('💳 Hisoblar:', { jami, tolangan: tolanganNum, qarz, ortiqcha });

    // Sotuvni saqlash
    const sale = new Sale({
      sana,
      customerId,
      productId,
      soni: soniNum,
      narx: product.narx,
      jami,
      tolangan: tolanganNum,
      qarz
    });
    
    const savedSale = await sale.save();
    console.log('✅ Sotuv saqlandi:', savedSale);

    // ✅ ORTIQCHA TO'LOV - QARZGA QO'SHILADI
    if (ortiqcha > 0) {
      // Mijozning oldingi qarzini olish
      const existingSales = await Sale.find({ customerId });
      const existingPayments = await Payment.find({ customerId });
      
      const totalDebt = existingSales.reduce((a,s) => a + s.qarz, 0);
      const totalPaid = existingPayments.reduce((a,p) => a + p.amount, 0);
      const currentDebt = Math.max(0, totalDebt - totalPaid);
      
      // Ortiqcha to'lov qarzni kamaytiradi
      let remaining = ortiqcha;
      
      // Eski qarz to'lovlari - ularni payment sifatida saqlash
      if (currentDebt > 0) {
        const toPay = Math.min(remaining, currentDebt);
        const payment = new Payment({
          customerId,
          sana,
          amount: toPay
        });
        await payment.save();
        console.log('✅ Qarz to\'lovi saqlandi:', toPay);
        remaining -= toPay;
      }
      
      // Agar ortiqcha hali qolsa, uni mijozning balansiga qo'shish
      if (remaining > 0) {
        // Bonus yoki ortiqcha pul sifatida saqlash
        console.log('💚 Ortiqcha pul qoldi:', remaining);
      }
    }

    res.status(201).json(savedSale);
  } catch (error) {
    console.error('❌ POST /sales error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

// Mijoz qarzini olish
router.get('/debt/:customerId', auth, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    
    const sales = await Sale.find({ customerId });
    const totalDebt = sales.reduce((sum, s) => sum + (s.qarz || 0), 0);
    
    const payments = await Payment.find({ customerId });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const debt = Math.max(0, totalDebt - totalPaid);
    res.json({ debt });
  } catch (error) {
    console.error('GET /sales/debt error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

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
    console.log(`📊 ${sales.length} ta sotuv topildi`);
    res.json(sales);
  } catch (error) {
    console.error('GET /sales error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

// Yangi sotuv qo'shish
router.post('/', auth, async (req, res) => {
  try {
    const { sana, customerId, productId, soni, tolangan } = req.body;
    
    console.log('📦 Sotuv ma\'lumotlari:', { sana, customerId, productId, soni, tolangan });
    
    // Ma'lumotlarni tekshirish
    if (!sana || !customerId || !productId || !soni) {
      return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart' });
    }

    // Mahsulotni topish
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Mahsulot topilmadi' });
    }

    const jami = product.narx * Number(soni);
    const tolanganAmt = Number(tolangan || 0);
    const qarz = Math.max(0, jami - tolanganAmt);
    const ortiqcha = Math.max(0, tolanganAmt - jami);

    // Yangi sotuv yaratish
    const sale = new Sale({
      sana,
      customerId,
      productId,
      soni: Number(soni),
      narx: product.narx,
      jami,
      tolangan: tolanganAmt,
      qarz
    });
    
    await sale.save();
    console.log('✅ Sotuv saqlandi:', sale);

    // Agar ortiqcha to'lov bo'lsa, qarz to'lovi sifatida saqlash
    if (ortiqcha > 0) {
      const payment = new Payment({
        customerId,
        sana,
        amount: ortiqcha
      });
      await payment.save();
      console.log('✅ Qarz to\'lovi saqlandi:', payment);
    }

    res.status(201).json(sale);
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
    const totalDebt = sales.reduce((sum, s) => sum + s.qarz, 0);
    
    const payments = await Payment.find({ customerId });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const debt = Math.max(0, totalDebt - totalPaid);
    res.json({ debt });
  } catch (error) {
    console.error('GET /sales/debt error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

// Sotuvni o'chirish
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Sale.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Sotuv topilmadi' });
    }
    res.json({ message: 'Sotuv o\'chirildi' });
  } catch (error) {
    console.error('DELETE /sales/:id error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

module.exports = router;

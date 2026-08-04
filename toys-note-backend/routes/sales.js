const express = require('express');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customerId', 'name')
      .populate('productId', 'name narx')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { sana, customerId, productId, soni, tolangan } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Mahsulot topilmadi' });
    }

    const jami = product.narx * soni;
    const qarz = Math.max(0, jami - tolangan);
    const ortiqcha = Math.max(0, tolangan - jami);

    // Sotuvni saqlash
    const sale = new Sale({
      sana,
      customerId,
      productId,
      soni,
      narx: product.narx,
      jami,
      tolangan,
      qarz
    });
    await sale.save();

    // Agar ortiqcha to'lov bo'lsa, qarz to'lovi sifatida saqlash
    if (ortiqcha > 0) {
      const payment = new Payment({
        customerId,
        sana,
        amount: ortiqcha
      });
      await payment.save();
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Mijozning qarzini hisoblash
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
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
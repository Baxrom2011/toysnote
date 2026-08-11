const express = require('express');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');
const router = express.Router();

// ✅ GET - barcha to'lovlar
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('GET /payments error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { customerId, sana } = req.body;
    const amount = Number(req.body.amount);
    if (!customerId || !sana || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Mijoz, sana va musbat summa kerak' });
    }
    const payment = new Payment({ customerId, sana, amount });
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    console.error('POST /payments error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('GET /payments/customer/:id error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

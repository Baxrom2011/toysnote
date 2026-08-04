const express = require('express');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { customerId, sana, amount } = req.body;
    const payment = new Payment({ customerId, sana, amount });
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
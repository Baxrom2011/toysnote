const express = require('express');
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Barcha kassa to'lovlari
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('GET /payments error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Kassa: tanlangan sanadagi (va ixtiyoriy mijozning) qarzini kamaytiradi.
router.post('/', auth, async (req, res) => {
  try {
    const sana = String(req.body.sana || '').trim();
    const customerId = req.body.customerId || null;
    const amount = Number(req.body.amount);

    if (!sana) {
      return res.status(400).json({ error: 'Sana kerak' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Musbat summa kiriting' });
    }

    const filter = { sana };
    if (customerId) filter.customerId = customerId;

    const sales = await Sale.find(filter).sort({ createdAt: 1, _id: 1 });

    const currentDebt = sales.reduce(
      (sum, sale) => sum + Math.max(0, Number(sale.qarz || 0)),
      0
    );

    if (currentDebt <= 0) {
      return res.status(400).json({ error: 'Bu sanada qarz mavjud emas' });
    }

    if (amount > currentDebt) {
      return res.status(400).json({
        error: `Kiritilgan summa qarzdan katta. Qarz: ${currentDebt.toLocaleString('ru-RU')} so'm`
      });
    }

    let remaining = amount;
    const allocated = [];

    // To'lovni shu sanadagi qarzlarga ketma-ket taqsimlaymiz.
    for (const sale of sales) {
      if (remaining <= 0) break;

      const debt = Math.max(0, Number(sale.qarz || 0));
      if (debt <= 0) continue;

      const paid = Math.min(remaining, debt);
      sale.tolangan = Math.min(
        Number(sale.jami || 0),
        Number(sale.tolangan || 0) + paid
      );
      sale.qarz = Math.max(
        0,
        Number(sale.jami || 0) - sale.tolangan
      );

      await sale.save();

      allocated.push({ saleId: sale._id, paid });
      remaining -= paid;
    }

    // Kassa operatsiyasi tarixi.
    // Bir nechta mijoz bo'lsa customerId null bo'ladi.
    const payment = await Payment.create({
      customerId,
      sana,
      amount
    });

    const newDebt = Math.max(0, currentDebt - amount);

    res.status(201).json({
      payment,
      allocated,
      oldDebt: currentDebt,
      amount,
      newDebt
    });
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

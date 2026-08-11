const express = require('express');
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Barcha to'lovlar
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('GET /payments error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});


// ======================================================
// QARZ TO'LASH
// To'lovni mijozning eski qarzlaridan boshlab sotuvlarga
// ketma-ket taqsimlaydi.
// ======================================================
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, sana } = req.body;
    const amount = Number(req.body.amount);

    if (!customerId) {
      return res.status(400).json({
        error: 'Mijoz kerak'
      });
    }

    if (!sana) {
      return res.status(400).json({
        error: 'Sana kerak'
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'To\'lov summasi 0 dan katta bo\'lishi kerak'
      });
    }

    // Mijozning sotuvlarini eski tartibda olamiz
    const sales = await Sale.find({
      customerId
    }).sort({
      sana: 1,
      createdAt: 1
    });

    // Hozirgi jami qarz
    const totalDebt = sales.reduce((sum, sale) => {
      return sum + Math.max(0, Number(sale.qarz || 0));
    }, 0);

    if (totalDebt <= 0) {
      return res.status(400).json({
        error: 'Bu mijozda qarz mavjud emas'
      });
    }

    if (amount > totalDebt) {
      return res.status(400).json({
        error:
          'To\'lov qarzdan katta bo\'lishi mumkin emas. ' +
          'Joriy qarz: ' +
          totalDebt.toLocaleString('ru-RU') +
          ' so\'m'
      });
    }

    let remaining = amount;
    const updatedSales = [];

    // Eski qarzlardan boshlab yopamiz
    for (const sale of sales) {
      if (remaining <= 0) break;

      const currentDebt = Math.max(
        0,
        Number(sale.qarz || 0)
      );

      if (currentDebt <= 0) continue;

      const payForThisSale = Math.min(
        remaining,
        currentDebt
      );

      sale.tolangan =
        Number(sale.tolangan || 0) +
        payForThisSale;

      sale.qarz =
        Math.max(
          0,
          Number(sale.jami || 0) -
          sale.tolangan
        );

      await sale.save();

      updatedSales.push({
        saleId: sale._id,
        paid: payForThisSale,
        remainingDebt: sale.qarz
      });

      remaining -= payForThisSale;
    }

    // Payment alohida tarix sifatida saqlanadi.
    // MUHIM: bu payment sotuvning to'langan summasiga
    // yana qayta qo'shilmaydi.
    const payment = await Payment.create({
      customerId,
      sana,
      amount
    });

    const newSales = await Sale.find({ customerId });

    const newDebt = newSales.reduce((sum, sale) => {
      return sum + Math.max(0, Number(sale.qarz || 0));
    }, 0);

    res.status(201).json({
      payment,
      allocated: updatedSales,
      remainingDebt: newDebt
    });

  } catch (error) {
    console.error('POST /payments error:', error);

    res.status(500).json({
      error: 'Server xatosi'
    });
  }
});


// Mijozning to'lovlari
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({
      customerId: req.params.customerId
    }).sort({
      createdAt: -1
    });

    res.json(payments);

  } catch (error) {
    console.error(
      'GET /payments/customer/:id error:',
      error
    );

    res.status(500).json({
      error: 'Server xatosi'
    });
  }
});


module.exports = router;

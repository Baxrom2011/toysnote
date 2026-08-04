const express = require('express');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find();
    const payments = await Payment.find();

    // Umumiy savdo
    const totalSales = sales.reduce((sum, s) => sum + s.jami, 0);
    const totalPaid = sales.reduce((sum, s) => sum + s.tolangan, 0);
    const totalDebtRaw = sales.reduce((sum, s) => sum + s.qarz, 0);
    const totalPaidBack = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = Math.max(0, totalDebtRaw - totalPaidBack);

    // Kunlar bo'yicha savdo
    const dailySales = {};
    sales.forEach(s => {
      dailySales[s.sana] = (dailySales[s.sana] || 0) + s.jami;
    });

    // Mahsulotlar bo'yicha savdo
    const productSales = {};
    sales.forEach(s => {
      const key = s.productId.toString();
      productSales[key] = (productSales[key] || 0) + s.soni;
    });

    // Mijozlar bo'yicha savdo
    const customerSales = {};
    sales.forEach(s => {
      const key = s.customerId.toString();
      customerSales[key] = (customerSales[key] || 0) + s.jami;
    });

    res.json({
      totalSales,
      totalPaid,
      totalDebt,
      dailySales,
      productSales,
      customerSales
    });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
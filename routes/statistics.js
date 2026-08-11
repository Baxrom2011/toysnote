const express = require('express');
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find();

    const totalSales = sales.reduce((sum, s) => sum + Number(s.jami || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + Number(s.tolangan || 0), 0);
    const totalDebt = sales.reduce((sum, s) => sum + Math.max(0, Number(s.qarz || 0)), 0);

    const dailySales = {};
    sales.forEach(s => {
      dailySales[s.sana] = (dailySales[s.sana] || 0) + Number(s.jami || 0);
    });

    const productSales = {};
    sales.forEach(s => {
      const key = s.productId.toString();
      productSales[key] = (productSales[key] || 0) + Number(s.soni || 0);
    });

    const customerSales = {};
    sales.forEach(s => {
      const key = s.customerId.toString();
      customerSales[key] = (customerSales[key] || 0) + Number(s.jami || 0);
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
    console.error('GET /statistics error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

module.exports = router;

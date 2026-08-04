const express = require('express');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Barcha mijozlarni olish
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Yangi mijoz qo'shish
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const customer = new Customer({ name, phone });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Mijozni o'chirish
router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mijoz o\'chirildi' });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
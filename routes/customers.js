const express = require('express');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error('GET /customers error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Ism kerak' });
    const customer = new Customer({ name: name.trim(), phone: phone ? phone.trim() : '' });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error('POST /customers error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ✅ PUT - TAHRIRLASH
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Ism kerak' });
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), phone: phone ? phone.trim() : '' },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ error: 'Mijoz topilmadi' });
    res.json(customer);
  } catch (error) {
    console.error('PUT /customers/:id error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Mijoz topilmadi' });
    res.json({ message: 'Mijoz o\'chirildi' });
  } catch (error) {
    console.error('DELETE /customers/:id error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

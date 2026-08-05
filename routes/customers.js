const express = require('express');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Ism-familiya kiritilishi shart' });
    }

    const customer = new Customer({ 
      name: name.trim(), 
      phone: phone ? phone.trim() : ''
    });
    
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Mijoz topilmadi' });
    }
    res.json({ message: 'Mijoz o\'chirildi' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

module.exports = router;

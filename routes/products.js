const express = require('express');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Barcha mahsulotlar
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Artikul bo'yicha qidiruv
router.get('/search/:query', auth, async (req, res) => {
  try {
    const query = req.params.query;
    const products = await Product.find({
      $or: [
        { artikul: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Yangi mahsulot qo'shish
router.post('/', auth, async (req, res) => {
  try {
    const { name, narx } = req.body;
    
    // Artikul avtomatik yaratiladi (model pre-save da)
    const product = new Product({ name, narx });
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Bu artikul allaqachon mavjud' });
    } else {
      res.status(500).json({ error: 'Server xatosi' });
    }
  }
});

// Mahsulotni o'chirish
router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mahsulot o\'chirildi' });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

const express = require('express');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const router = express.Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('GET /products error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.get('/search/:query', auth, async (req, res) => {
  try {
    const query = escapeRegex(req.params.query.trim());
    const products = await Product.find({
      $or: [
        { artikul: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(products);
  } catch (error) {
    console.error('GET /products/search error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const narx = Number(req.body.narx);
    if (!name?.trim() || !Number.isFinite(narx) || narx < 0) {
      return res.status(400).json({ error: 'Nomi va to\'g\'ri narx kerak' });
    }
    const product = new Product({ name: name.trim(), narx });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('POST /products error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ✅ PUT - TAHRIRLASH
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const narx = Number(req.body.narx);
    if (!name?.trim() || !Number.isFinite(narx) || narx < 0) {
      return res.status(400).json({ error: 'Nomi va to\'g\'ri narx kerak' });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), narx },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    res.json(product);
  } catch (error) {
    console.error('PUT /products/:id error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    res.json({ message: 'Mahsulot o\'chirildi' });
  } catch (error) {
    console.error('DELETE /products/:id error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

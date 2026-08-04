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
    console.error('Products error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
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
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

// Yangi mahsulot qo'shish
router.post('/', auth, async (req, res) => {
  try {
    const { name, narx } = req.body;
    
    console.log('📦 Mahsulot ma\'lumotlari:', { name, narx });
    
    if (!name || !narx) {
      return res.status(400).json({ error: 'Nomi va narxi kiritilishi shart' });
    }

    // Yangi Product yaratish (artikul avtomatik yaratiladi)
    const product = new Product({ 
      name: name.trim(), 
      narx: Number(narx)
    });
    
    console.log('🆕 Mahsulot yaratilmoqda...');
    
    await product.save();
    
    console.log('✅ Mahsulot saqlandi:', product);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ XATOLIK:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'Bu artikul allaqachon mavjud' });
    } else {
      res.status(500).json({ 
        error: 'Server xatosi: ' + error.message
      });
    }
  }
});

// Mahsulotni o'chirish
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Mahsulot topilmadi' });
    }
    res.json({ message: 'Mahsulot o\'chirildi' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server xatosi: ' + error.message });
  }
});

module.exports = router;

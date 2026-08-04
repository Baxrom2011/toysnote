const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    const user = await User.findOne({ login });
    if (!user) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign(
      { id: user._id, login: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        login: user.login,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Foydalanuvchi qo'shish (faqat admin)
router.post('/register', async (req, res) => {
  try {
    const { login, password, role } = req.body;
    
    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu login band' });
    }

    const user = new User({ login, password, role: role || 'user' });
    await user.save();

    res.status(201).json({
      message: 'Foydalanuvchi yaratildi',
      user: { id: user._id, login: user.login, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
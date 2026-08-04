const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
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
      process.env.JWT_SECRET || 'mysecretkey123',
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Joriy foydalanuvchi
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      login: req.user.login,
      role: req.user.role
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

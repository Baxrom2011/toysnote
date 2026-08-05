const express = require('express');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

router.post('/register', auth, admin, async (req, res) => {
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

router.delete('/:login', auth, admin, async (req, res) => {
  try {
    const { login } = req.params;
    if (login === 'baxrom') {
      return res.status(400).json({ error: 'Admin foydalanuvchini o\'chirib bo\'lmaydi' });
    }
    await User.findOneAndDelete({ login });
    res.json({ message: 'Foydalanuvchi o\'chirildi' });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;

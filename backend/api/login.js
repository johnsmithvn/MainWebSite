const express = require('express');
const router = express.Router();
const { login, secureKeys } = require('../middleware/security');

router.post('/login', (req, res) => {
  const { key, password } = req.body || {};
  const k = (key || '').toUpperCase();
  if (!secureKeys.includes(k)) {
    return res.status(400).json({ error: 'Invalid key' });
  }
  const token = login(k, password);
  if (!token) return res.status(401).json({ error: 'Wrong password' });
  res.json({ token });
});

module.exports = router;

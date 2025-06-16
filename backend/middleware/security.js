const crypto = require('crypto');

const secureKeys = (process.env.SECURITY || '')
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);
const securityPassword = process.env.SECURITY_PASSWORD || '';

const sessions = new Map();

function login(key, password) {
  const k = key.toUpperCase();
  if (!secureKeys.includes(k) || password !== securityPassword) return null;
  const token = crypto.randomBytes(16).toString('hex');
  sessions.set(token, k);
  return token;
}

function middleware(req, res, next) {
  if (secureKeys.length === 0) return next();
  const key = (req.query.key || req.body?.key || '').toUpperCase();
  if (!secureKeys.includes(key)) return next();
  const token = req.headers['x-security-token'];
  if (token && sessions.get(token) === key) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { middleware, login, secureKeys };

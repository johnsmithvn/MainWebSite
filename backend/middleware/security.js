const { SECURITY_KEYS, SECURITY_PASSWORD } = require('../utils/config');

module.exports = function (req, res, next) {
  if (req.path === '/api/login') {
    return next();
  }

  const key = (req.query.key || req.body?.key || '').toUpperCase();
  if (key && SECURITY_KEYS.includes(key)) {
    const token =
      req.headers['x-secure-token'] || req.query.token || req.body?.token;
    if (token !== SECURITY_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  next();
};

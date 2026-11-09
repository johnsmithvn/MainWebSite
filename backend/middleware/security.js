// 📁 backend/middleware/security.js
// 🔐 Yêu cầu token cho request nhắm vào nguồn nằm trong SECURITY.
const { SECURITY_KEYS } = require('../utils/config');
const {
  getRequestToken,
  isValidToken,
  readAuthCookie,
  setAuthCookie,
} = require('../utils/authToken');

// Endpoint nhận key nguồn qua `key` hoặc `dbkey` (manga favorite/delete-item, increase-view...).
// Trước đây chỉ đọc `key` nên các endpoint dùng `dbkey` lọt qua kiểm tra (ISSUES S6).
const KEY_PARAMS = ['key', 'dbkey'];

function collectKeys(req) {
  const keys = [];
  for (const source of [req.query, req.body]) {
    if (!source || typeof source !== 'object') continue;
    for (const name of KEY_PARAMS) {
      const values = Array.isArray(source[name]) ? source[name] : [source[name]];
      for (const value of values) {
        if (typeof value === 'string' && value) keys.push(value.toUpperCase());
      }
    }
  }
  return keys;
}

module.exports = function (req, res, next) {
  if (req.path === '/api/login' || req.path === '/api/logout') {
    return next();
  }

  // Skip token check for static HTML files so the page can load
  if (req.method === 'GET' && req.path.endsWith('.html')) {
    return next();
  }

  // Cùng lý do cho trang của app React: F5 / mở link như /media?key=<nguồn bảo mật> là điều hướng trang, trình
  // duyệt không gửi được header token → trước đây nhận 401 JSON thay vì trang app (docs/AUDIT-2026-11-09.md, R1).
  // Trang HTML không chứa dữ liệu; dữ liệu vẫn lấy qua /api có token, file tĩnh vẫn do protectStatic kiểm tra cookie.
  if (
    (req.method === 'GET' || req.method === 'HEAD') &&
    !req.path.startsWith('/api') &&
    (req.headers.accept || '').includes('text/html')
  ) {
    return next();
  }

  const needsToken = collectKeys(req).some((key) => SECURITY_KEYS.includes(key));
  if (!needsToken) return next();

  // Cookie không được dùng để xác thực API (tránh CSRF); chỉ dùng cho file tĩnh, xem server.js
  const token = getRequestToken(req);
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Giữ cookie đồng bộ với token để ảnh/video của nguồn bảo mật tải được (ISSUES S4)
  if (readAuthCookie(req) !== token) setAuthCookie(req, res, token);

  next();
};

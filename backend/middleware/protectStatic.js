// 📁 backend/middleware/protectStatic.js
// 🔐 Bọc express.static của nguồn nằm trong SECURITY (ISSUES S4).
//
// <img>/<video>/<audio> không gửi được header token, nên file tĩnh của nguồn bảo mật được
// xác thực bằng cookie HttpOnly `ms_auth` (đặt khi đăng nhập, xem utils/authToken.js).
// Chưa đăng nhập: chỉ trả 401 khi file thật sự thuộc nguồn này; nếu không thì next() để
// nguồn khác dùng chung base (vd. nhiều ROOT_ cùng mount /manga) vẫn phục vụ được.

const fs = require("fs");
const { isAuthenticatedRequest } = require("../utils/authToken");
const { resolveInsideRoot } = require("../utils/pathSafety");

module.exports = function protectStatic(absPath, staticMiddleware) {
  return (req, res, next) => {
    if (isAuthenticatedRequest(req)) return staticMiddleware(req, res, next);

    let relPath;
    try {
      relPath = decodeURIComponent(req.path);
    } catch {
      return next();
    }
    const target = resolveInsideRoot(absPath, relPath);
    try {
      if (target && fs.statSync(target).isFile()) {
        return res.status(401).send("Unauthorized");
      }
    } catch {
      // không tồn tại → để middleware sau xử lý như cũ
    }
    next();
  };
};

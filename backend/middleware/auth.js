const dns = require("dns").promises;
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Đọc biến môi trường từ .env
const envPath = path.join(__dirname, "../.env");
const parsedEnv = dotenv.parse(fs.readFileSync(envPath, "utf-8"));

// Lấy danh sách hostname và IP được phép từ .env
const allowedHostnames = (parsedEnv.ALLOWED_HOSTNAMES || "").split(",").map(s => s.trim()).filter(Boolean);
const allowedIPs = (parsedEnv.ALLOWED_IPS || "").split(",").map(s => s.trim()).filter(Boolean);

// Hàm kiểm tra IP nội bộ hoặc localhost
function isAllowedClient(clientIP) {
  // return true; // Bỏ comment nếu muốn cho phép toàn bộ nội bộ
  return allowedIPs.includes(clientIP);
  // ✅ Nếu IP là mạng LAN (192.168.x.x / 10.x.x.x / 172.16.x.x - 172.31.x.x) → cho qua
  // const isLAN =
  //   clientIP.startsWith("192.168.") ||
  //   clientIP.startsWith("10.") ||
  //   /^172\.(1[6-9]|2\d|3[0-1])\./.test(clientIP);
  // return isLAN;
}

// Middleware kiểm tra IP/hostname
module.exports = async function (req, res, next) {
  let clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  if (clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.replace("::ffff:", "");
  }

  // 🛡️ Cho phép IP nội bộ
  if (isAllowedClient(clientIP)) {
    return next();
  }

  // ✅ Nếu không phải LAN → kiểm tra hostname Tailscale
  try {
    const resolved = await dns.reverse(clientIP);
    const hostname = resolved[0] || "";
    if (!allowedHostnames.includes(hostname)) {
      console.warn("❌ Truy cập bị chặn từ hostname:", hostname);
      return res.status(403).send("Forbidden (blocked)");
    }
    next();
  } catch (err) {
    console.error("❌ Reverse DNS failed:", err.message);
    return res.status(403).send("Forbidden (lookup failed)");
  }
}; 
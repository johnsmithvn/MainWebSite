const dns = require("dns").promises;
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { parseEnvList } = require("../utils/stringUtils");

// Đọc biến môi trường từ .env
const envPath = path.join(__dirname, "../.env");
const parsedEnv = dotenv.parse(fs.readFileSync(envPath, "utf-8"));

// Lấy danh sách hostname và IP được phép từ .env
const allowedHostnames = parseEnvList(parsedEnv.ALLOWED_HOSTNAMES);
const allowedIPs = parseEnvList(parsedEnv.ALLOWED_IPS);

// Hàm kiểm tra IP nội bộ hoặc localhost
function isAllowedClient(clientIP) {
  // return true; // Bỏ comment nếu muốn cho phép toàn bộ nội bộ
  return allowedIPs.includes(clientIP);
  
}

// Middleware kiểm tra IP/hostname
module.exports = async function (req, res, next) {
  // ⚠️ Không đọc header X-Forwarded-For: server nhận kết nối trực tiếp (không qua reverse proxy)
  // nên client tự gửi được header này để giả IP nằm trong whitelist
  let clientIP = req.socket.remoteAddress || "";
  if (clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.replace("::ffff:", "");
  }
  if (clientIP === "::1") clientIP = "127.0.0.1";
  if (!clientIP) {
    return res.status(403).send("Forbidden (unknown client)");
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
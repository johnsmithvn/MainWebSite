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

// ⚡ Cache kết quả reverse DNS theo IP (ISSUES P2). Trước đây mỗi request (mỗi ảnh manga, mỗi
// thumbnail…) của client ngoài ALLOWED_IPS đều tra DNS một lần.
// - Được phép: nhớ 5 phút. Tailscale cấp IP cố định cho từng máy nên rủi ro IP đổi chủ trong
//   khoảng này rất thấp; ALLOWED_HOSTNAMES chỉ đọc lúc khởi động nên đổi .env vẫn cần restart.
// - Bị chặn (hostname không nằm trong whitelist): nhớ 1 phút.
// - Tra DNS lỗi: KHÔNG nhớ, request sau tra lại (giống hành vi cũ).
// Các request đến cùng lúc từ một IP dùng chung một lần tra đang chạy.
const DNS_ALLOW_TTL_MS = 5 * 60 * 1000;
const DNS_BLOCK_TTL_MS = 60 * 1000;
const DNS_CACHE_MAX = 1000;
const dnsCache = new Map(); // ip -> { allowed, hostname, expiresAt }
const dnsInflight = new Map(); // ip -> Promise<{ allowed, hostname }>

function rememberLookup(ip, result) {
  const ttl = result.allowed ? DNS_ALLOW_TTL_MS : DNS_BLOCK_TTL_MS;
  dnsCache.delete(ip); // đưa xuống cuối để Map giữ thứ tự cũ → mới
  dnsCache.set(ip, { ...result, expiresAt: Date.now() + ttl });
  while (dnsCache.size > DNS_CACHE_MAX) {
    dnsCache.delete(dnsCache.keys().next().value);
  }
}

/** @returns {Promise<{allowed: boolean, hostname: string}>} ném lỗi nếu tra DNS thất bại */
function checkHostname(ip) {
  const cached = dnsCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached);

  let pending = dnsInflight.get(ip);
  if (!pending) {
    pending = dns
      .reverse(ip)
      .then((resolved) => {
        const hostname = resolved[0] || "";
        const result = { allowed: allowedHostnames.includes(hostname), hostname };
        rememberLookup(ip, result);
        return result;
      })
      .finally(() => dnsInflight.delete(ip));
    dnsInflight.set(ip, pending);
  }
  return pending;
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
  let result;
  try {
    result = await checkHostname(clientIP);
  } catch (err) {
    console.error("❌ Reverse DNS failed:", err.message);
    return res.status(403).send("Forbidden (lookup failed)");
  }
  if (!result.allowed) {
    console.warn("❌ Truy cập bị chặn từ hostname:", result.hostname);
    return res.status(403).send("Forbidden (blocked)");
  }
  next();
};

// Cho test
module.exports._dnsCache = dnsCache;

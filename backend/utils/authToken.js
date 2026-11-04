// 📁 backend/utils/authToken.js
// 🔐 Token đăng nhập cho các nguồn trong SECURITY.
//
// Trước đây /api/login trả về chính SECURITY_PASSWORD làm token (ISSUES S5), nên mật khẩu
// nằm trong localStorage, URL video, log... Giờ token là HMAC-SHA256 của mật khẩu với một
// secret ngẫu nhiên lưu ở backend/data/.auth-secret:
//   - không suy ngược ra mật khẩu, kể cả khi lộ token;
//   - không đổi sau khi restart server (secret được lưu lại) → không bắt đăng nhập lại;
//   - tự hết hiệu lực khi đổi SECURITY_PASSWORD hoặc xoá file secret.
//
// Token cũng được đặt vào cookie HttpOnly `ms_auth` để <img>/<video>/<audio> tải file tĩnh
// của nguồn bảo mật (/manga, /video, /audio, /media) — các thẻ này không gửi được header (ISSUES S4).

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { SECURITY_PASSWORD } = require("./config");

const SECRET_FILE = path.join(__dirname, "../data/.auth-secret");
const COOKIE_NAME = "ms_auth";
const COOKIE_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000; // trình duyệt giới hạn tối đa 400 ngày
const TOKEN_PREFIX = "v1.";

let expectedToken = null;

function loadSecret() {
  try {
    const saved = fs.readFileSync(SECRET_FILE, "utf8").trim();
    if (/^[0-9a-f]{64}$/.test(saved)) return saved;
  } catch {
    // chưa có file → tạo mới bên dưới
  }
  const secret = crypto.randomBytes(32).toString("hex");
  try {
    fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
    fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
  } catch (err) {
    console.warn(
      "⚠️ Không lưu được backend/data/.auth-secret — token sẽ đổi sau mỗi lần restart:",
      err.message
    );
  }
  return secret;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest();
}

/** So sánh hai chuỗi trong thời gian không phụ thuộc nội dung */
function safeEqual(a, b) {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

function isPasswordConfigured() {
  return typeof SECURITY_PASSWORD === "string" && SECURITY_PASSWORD.length > 0;
}

function checkPassword(input) {
  if (!isPasswordConfigured() || typeof input !== "string") return false;
  return safeEqual(input, SECURITY_PASSWORD);
}

/** Token hợp lệ hiện tại (tính một lần, lazy để không tạo file secret khi không dùng SECURITY) */
function issueToken() {
  if (!expectedToken) {
    const mac = crypto
      .createHmac("sha256", loadSecret())
      .update(`mainwebsite-auth:${SECURITY_PASSWORD}`)
      .digest("hex");
    expectedToken = TOKEN_PREFIX + mac;
  }
  return expectedToken;
}

function isValidToken(token) {
  if (!isPasswordConfigured() || typeof token !== "string" || !token) return false;
  return safeEqual(token, issueToken());
}

/** Token client gửi lên qua header / query / body (không đọc cookie, xem security.js) */
function getRequestToken(req) {
  const header = req.headers["x-secure-token"];
  if (typeof header === "string" && header) return header;
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.slice(7).trim();
  if (typeof req.query?.token === "string") return req.query.token;
  if (typeof req.body?.token === "string") return req.body.token;
  return null;
}

function readAuthCookie(req) {
  const header = req.headers.cookie;
  if (typeof header !== "string" || !header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0 || part.slice(0, eq).trim() !== COOKIE_NAME) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function cookieOptions(req) {
  return { httpOnly: true, sameSite: "lax", secure: !!req.secure, path: "/" };
}

function setAuthCookie(req, res, token) {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(req), maxAge: COOKIE_MAX_AGE_MS });
}

function clearAuthCookie(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions(req));
}

/** Dùng cho file tĩnh: chấp nhận cookie hoặc token gửi kèm */
function isAuthenticatedRequest(req) {
  return isValidToken(readAuthCookie(req)) || isValidToken(getRequestToken(req));
}

module.exports = {
  COOKIE_NAME,
  isPasswordConfigured,
  checkPassword,
  issueToken,
  isValidToken,
  getRequestToken,
  readAuthCookie,
  setAuthCookie,
  clearAuthCookie,
  isAuthenticatedRequest,
};

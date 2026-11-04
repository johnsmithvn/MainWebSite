// 📁 backend/utils/sqlLike.js
// 🔎 Escape ký tự đặc biệt của LIKE (`%`, `_`, `\`) để so khớp đúng tiền tố đường dẫn.
// Dùng kèm `LIKE ? ESCAPE '\'`. Không escape thì `Vol_1/%` khớp cả `Vol-1/...`, khiến
// scan/xoá đụng nhầm thư mục bên cạnh (ISSUES B13).
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (ch) => "\\" + ch);
}

module.exports = { escapeLike };

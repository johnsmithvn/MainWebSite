// 📁 src/utils/mediaUrl.js
// URL file tĩnh của Media (/media/...). Mã hoá từng đoạn đường dẫn để tên có #, ?, % vẫn đúng:
// trước đây ghép thẳng `/media/${path}` nên "Album #1/IMG.jpg" thành request "/media/Album%20" (docs/AUDIT-2026-11-09.md, R2).

/** Mã hoá từng đoạn của một đường dẫn tương đối, bỏ đoạn rỗng ("a//b/" → "a/b") */
export const encodePathSegments = (p = '') =>
  String(p)
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

/** `/media/<đoạn 1>/<đoạn 2>…` — mỗi tham số là một phần đường dẫn (có thể chứa "/") */
export const mediaUrl = (...parts) =>
  `/media/${parts.map(encodePathSegments).filter(Boolean).join('/')}`;

/** Thư mục chứa file ("a/b/c.jpg" → "a/b", file ở gốc → "") */
export const parentDir = (p = '') => String(p).split('/').slice(0, -1).join('/');

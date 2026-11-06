// 📁 backend/utils/scanHelpers.js
// ⚡ Tiện ích dùng chung cho các scanner (PERFORMANCE-CACHE-REPORT PF1, PF10)

const fs = require("fs");
const path = require("path");

const IS_WINDOWS = process.platform === "win32";

/**
 * Gom các lệnh ghi của một lần scan vào transaction theo lô (PF1).
 *
 * Trước đây mỗi INSERT/UPDATE là một transaction riêng (một lần fsync). Gom lại thì một lô vài
 * trăm lệnh chỉ tốn một lần commit. Thứ tự các lệnh được giữ nguyên.
 *
 * Lưu ý khi dùng: lệnh trong hàng đợi CHƯA nằm trong DB. Trước khi đọc dữ liệu mà chính lần scan
 * này vừa ghi (VD đếm item vừa thêm, hoặc dọn bản ghi scanned = 0) phải gọi flush().
 *
 * Nếu một lô lỗi (VD vi phạm UNIQUE), cả lô bị rollback rồi chạy lại TỪNG lệnh như code cũ: các
 * lệnh trước lệnh lỗi vẫn được lưu, lệnh lỗi ném ra ngoài, các lệnh sau không chạy.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {{maxOps?: number, maxDelayMs?: number}} [opts] - flush khi đủ maxOps lệnh, hoặc sau
 *   maxDelayMs kể từ lệnh đầu tiên đang chờ (để dữ liệu mới không bị giữ lâu khi scan chậm)
 */
function createWriteQueue(db, { maxOps = 500, maxDelayMs = 1000 } = {}) {
  let ops = [];
  let timer = null;
  let deferredError = null;
  const statements = new Map();
  const runBatch = db.transaction((list) => {
    for (const op of list) op();
  });

  function prepare(sql) {
    let stmt = statements.get(sql);
    if (!stmt) {
      stmt = db.prepare(sql);
      statements.set(sql, stmt);
    }
    return stmt;
  }

  function throwDeferred() {
    if (deferredError) {
      const err = deferredError;
      deferredError = null;
      throw err;
    }
  }

  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    throwDeferred();
    if (ops.length === 0) return;
    const list = ops;
    ops = [];
    try {
      runBatch(list);
    } catch (batchError) {
      // Lô đã rollback → chạy lại từng lệnh để có đúng kết quả như khi ghi riêng lẻ
      for (const op of list) op();
    }
  }

  /** Thêm một lệnh ghi: run(sql, ...params) */
  function run(sql, ...params) {
    throwDeferred();
    ops.push(() => prepare(sql).run(...params));
    schedule();
  }

  /** Thêm một thao tác ghi tuỳ ý (chạy trong transaction của lô) */
  function push(fn) {
    throwDeferred();
    ops.push(fn);
    schedule();
  }

  function schedule() {
    if (ops.length >= maxOps) {
      flush();
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        try {
          flush();
        } catch (err) {
          // Không có ai bắt lỗi trong callback hẹn giờ → giữ lại, ném ra ở lần gọi kế tiếp
          deferredError = err;
        }
      }, maxDelayMs);
      if (typeof timer.unref === "function") timer.unref();
    }
  }

  /**
   * Thay thế db.prepare(sql) trong vòng lặp scan: .get/.all đọc ngay, .run đưa vào hàng đợi.
   * (Không trả về kết quả của .run — code scan không dùng kết quả đó.)
   */
  function stmt(sql) {
    return {
      get: (...params) => prepare(sql).get(...params),
      all: (...params) => prepare(sql).all(...params),
      run: (...params) => run(sql, ...params),
    };
  }

  return {
    run,
    push,
    flush,
    prepare,
    stmt,
    get pending() {
      return ops.length;
    },
  };
}

/**
 * Tra thumbnail trong thư mục `.thumbnail` mà mỗi thư mục chỉ đọc một lần cho cả lần scan (PF10).
 * Trước đây mỗi file gọi fs.existsSync cho từng đuôi ảnh (đồng bộ, chặn event loop).
 * So khớp không phân biệt hoa/thường trên Windows, giống fs.existsSync trên hệ điều hành đó.
 */
function createThumbnailLookup() {
  const memo = new Map(); // dir -> Promise<{ names: string[], set: Set<string> } | null>
  const norm = (name) => (IS_WINDOWS ? name.toLowerCase() : name);

  function listDir(dir) {
    let pending = memo.get(dir);
    if (!pending) {
      pending = fs.promises
        .readdir(dir)
        .then((names) => ({ names, set: new Set(names.map(norm)) }))
        .catch(() => null); // không có thư mục → như existsSync === false
      memo.set(dir, pending);
    }
    return pending;
  }

  return {
    /**
     * Giống findThumbnail cũ: đuôi đầu tiên (theo thứ tự `exts`) có file `<baseName><ext>`.
     * @returns {Promise<string|null>} ".thumbnail/<baseName><ext>"
     */
    async find(thumbDir, baseName, exts) {
      const listing = await listDir(thumbDir);
      if (!listing) return null;
      for (const ext of exts) {
        if (listing.set.has(norm(baseName + ext))) return path.posix.join(".thumbnail", baseName + ext);
      }
      return null;
    },
    /** Tên file trong thư mục (đúng thứ tự readdir), hoặc null nếu không đọc được */
    async list(dir) {
      const listing = await listDir(dir);
      return listing ? listing.names : null;
    },
  };
}

async function pathExists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

module.exports = { createWriteQueue, createThumbnailLookup, pathExists };

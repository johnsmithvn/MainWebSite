// 📁 backend/utils/imageSize.js
// 📏 Đọc kích thước ảnh từ phần đầu file, ngay trong Node — không chạy tiến trình ffprobe cho mỗi ảnh.
// Trước đây media-scan gọi ffprobe (một tiến trình riêng, ~30–100 ms trên Windows) cho MỖI ảnh mới chỉ để lấy
// width/height (docs/AUDIT-2026-11-09.md, PF20). Ở đây đọc vài chục byte đầu (JPEG: nhảy qua từng segment).
// Hỗ trợ JPEG, PNG, GIF, WebP (VP8/VP8L/VP8X), BMP. Định dạng khác (HEIC, AVIF, TIFF…) hoặc file lỗi → null,
// nơi gọi dùng ffprobe như trước. Kích thước là kích thước lưu trong file (không xoay theo EXIF), giống ffprobe.

const fs = require("fs");

const MAX_JPEG_SEGMENTS = 1000;

/** @returns {{width:number,height:number}|null} */
function valid(width, height) {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0
    ? { width, height }
    : null;
}

/** JPEG: duyệt các segment (FF xx + độ dài) tới SOFn, đọc 9 byte mỗi lần */
async function readJpegSize(fh) {
  const buf = Buffer.alloc(9);
  let pos = 2; // sau SOI (FF D8)
  for (let i = 0; i < MAX_JPEG_SEGMENTS; i++) {
    const { bytesRead } = await fh.read(buf, 0, 9, pos);
    if (bytesRead < 4 || buf[0] !== 0xff) return null;
    const marker = buf[1];
    if (marker === 0xff) { pos += 1; continue; } // byte đệm
    // Marker không có độ dài: SOI, TEM, RST0–7
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { pos += 2; continue; }
    if (marker === 0xd9 || marker === 0xda) return null; // EOI / SOS trước khi gặp SOF
    // SOF0–SOF15 trừ DHT (C4), JPG (C8), DAC (CC): FF Cn | len(2) | precision(1) | height(2) | width(2)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (bytesRead < 9) return null;
      return valid(buf.readUInt16BE(7), buf.readUInt16BE(5));
    }
    const len = buf.readUInt16BE(2);
    if (len < 2) return null;
    pos += 2 + len;
  }
  return null;
}

/**
 * @param {string} filePath
 * @returns {Promise<{width:number,height:number}|null>}
 */
async function readImageSize(filePath) {
  let fh;
  try {
    fh = await fs.promises.open(filePath, "r");
    const head = Buffer.alloc(32);
    const { bytesRead } = await fh.read(head, 0, 32, 0);
    const b = head.subarray(0, bytesRead);

    // JPEG
    if (bytesRead >= 4 && b[0] === 0xff && b[1] === 0xd8) return await readJpegSize(fh);

    // PNG: chữ ký 8 byte, rồi chunk IHDR: width(4) height(4)
    if (bytesRead >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.toString("latin1", 12, 16) === "IHDR") {
      return valid(b.readUInt32BE(16), b.readUInt32BE(20));
    }

    // GIF87a / GIF89a: width(2 LE) height(2 LE)
    if (bytesRead >= 10 && b.toString("latin1", 0, 3) === "GIF") {
      return valid(b.readUInt16LE(6), b.readUInt16LE(8));
    }

    // WebP: RIFF....WEBP + chunk đầu tiên
    if (bytesRead >= 30 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") {
      const chunk = b.toString("latin1", 12, 16);
      if (chunk === "VP8X") return valid(1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3));
      if (chunk === "VP8 " && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
        return valid(b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff);
      }
      if (chunk === "VP8L" && b[20] === 0x2f) {
        const bits = b.readUInt32LE(21);
        return valid(1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff));
      }
      return null;
    }

    // BMP: BITMAPINFOHEADER width(4 LE) height(4 LE, âm = ảnh lưu từ trên xuống)
    if (bytesRead >= 26 && b.toString("latin1", 0, 2) === "BM") {
      return valid(b.readInt32LE(18), Math.abs(b.readInt32LE(22)));
    }

    return null;
  } catch {
    return null;
  } finally {
    if (fh) await fh.close().catch(() => {});
  }
}

module.exports = { readImageSize };

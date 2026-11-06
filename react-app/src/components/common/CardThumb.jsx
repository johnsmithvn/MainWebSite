// 📁 src/components/common/CardThumb.jsx
// 🖼️ Thumbnail của card: thử lần lượt các nguồn ảnh, hiện dần khi tải xong.
// Hết nguồn hoặc không có ảnh thì hiện ô dự phòng (màu theo tên, biểu tượng theo loại, chữ đầu của tên).
// Không gọi thêm file ảnh mặc định nào, nên không có vòng lặp onError.
// Phần tử cha cần `position: relative` và kích thước (thường là một khung aspect-ratio).

import { useEffect, useRef, useState } from 'react';
import { FiBook, FiFilm, FiMusic, FiImage, FiFolder, FiFileText } from 'react-icons/fi';

const ICONS = {
  manga: FiBook,
  movie: FiFilm,
  music: FiMusic,
  media: FiImage,
  folder: FiFolder,
  pdf: FiFileText,
};

const isUsable = (s) => typeof s === 'string' && s.trim() !== '' && s !== 'null' && s !== 'undefined';

const hueOf = (text = '') => {
  let h = 0;
  for (const ch of String(text)) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
};

const CJK = /[぀-ヿ㐀-鿿가-힯]/;

const initialsOf = (text = '') => {
  const words = String(text)
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[[\](){}.,:;!?'"–—_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';
  const first = Array.from(words[0]);
  if (CJK.test(first[0])) return first.slice(0, 2).join('');
  const second = words[1] ? Array.from(words[1])[0] : '';
  return (first[0] + second).toUpperCase();
};

export function ThumbFallback({ name = '', kind = 'media' }) {
  const Icon = ICONS[kind] || FiImage;
  return (
    <div
      className="thumb-fallback absolute inset-0 flex flex-col items-center justify-center gap-1.5 select-none"
      style={{ '--thumb-hue': hueOf(name) }}
      aria-hidden="true"
    >
      <Icon />
      <span className="text-xs font-semibold leading-none">{initialsOf(name)}</span>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string|string[]} props.src - Một URL hoặc danh sách URL thử lần lượt
 * @param {string} props.alt - Tên item (cũng dùng để tạo màu và chữ đầu cho ô dự phòng)
 * @param {'manga'|'movie'|'music'|'media'|'folder'|'pdf'} [props.kind]
 * @param {string} [props.className] - Class thêm cho thẻ img (ví dụ group-hover:scale-105)
 */
export default function CardThumb({ src, alt = '', kind = 'media', className = '' }) {
  const sources = (Array.isArray(src) ? src : [src]).filter(isUsable);
  const key = sources.join('|');
  const [failed, setFailed] = useState({ key, count: 0 });
  const [loadedSrc, setLoadedSrc] = useState(null);
  const imgRef = useRef(null);

  const index = failed.key === key ? failed.count : 0;
  const current = sources[index];

  // Ảnh đã có trong cache có thể tải xong trước khi React gắn onLoad
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoadedSrc(current);
  }, [current]);

  if (!current) return <ThumbFallback name={alt} kind={kind} />;

  return (
    <img
      ref={imgRef}
      key={current}
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onLoad={() => setLoadedSrc(current)}
      onError={() => setFailed((f) => ({ key, count: (f.key === key ? f.count : 0) + 1 }))}
      className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-200
                  ${loadedSrc === current ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}

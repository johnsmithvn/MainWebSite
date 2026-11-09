// 📁 src/hooks/useFolderBrowser.js
// 🗂️ Logic duyệt thư mục dùng chung cho Manga / Movie / Music (docs/CARD-REDESIGN-PROPOSAL.md, P6c):
//  - Trang, số mục mỗi trang, kiểu sắp xếp lưu trên URL (?page=&size=&sort=) → quay lại từ player/reader vẫn đúng trang.
//  - Số mục mỗi trang nhớ trong localStorage theo loại (`<type>.perPage`).
//  - Lọc không phân biệt hoa thường và dấu tiếng Việt; sắp xếp tự nhiên (1, 2, 10); thư mục lên đầu nếu loại yêu cầu.
//  - Lưới / danh sách nhớ theo từng thư mục (`<type>.viewModeByPath`), thư mục mới dùng lựa chọn gần nhất.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getContentType } from '@/config/contentTypes';

export const normalizeText = (s = '') =>
  String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');

export const naturalCompare = (a = '', b = '') =>
  String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

const MAX_VIEW_MODE_ENTRIES = 300;

function readViewMode(type, path) {
  try {
    const map = JSON.parse(localStorage.getItem(`${type}.viewModeByPath`) || '{}');
    const mode = map[path] || localStorage.getItem(`${type}.viewMode`);
    return mode === 'list' ? 'list' : 'grid';
  } catch (_) {
    return 'grid';
  }
}

function saveViewMode(type, path, mode) {
  try {
    const key = `${type}.viewModeByPath`;
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    delete map[path];
    map[path] = mode; // đưa lên cuối để biết thư mục nào dùng gần đây
    const keys = Object.keys(map);
    if (keys.length > MAX_VIEW_MODE_ENTRIES) {
      keys.slice(0, keys.length - MAX_VIEW_MODE_ENTRIES).forEach((k) => delete map[k]);
    }
    localStorage.setItem(key, JSON.stringify(map));
    localStorage.setItem(`${type}.viewMode`, mode);
  } catch (_) { /* localStorage không dùng được: bỏ qua */ }
}

const DEFAULT_SORTS = [{ value: 'name', label: 'Tên A→Z' }];
const defaultSearchFields = (item) => [item.name, item.path];

/**
 * @param {object} opts
 * @param {'manga'|'movie'|'music'} opts.type
 * @param {Array} opts.items - Danh sách đầy đủ của thư mục hiện tại
 * @param {string} [opts.searchTerm]
 * @param {(item) => string[]} [opts.searchFields] - Các trường dùng để lọc
 * @param {Array<{value: string, label: string}>} [opts.sortOptions] - Lựa chọn đầu tiên là mặc định
 * @param {Record<string, (a, b) => number>} [opts.sorters] - Hàm so sánh theo `value` (mặc định: tên tự nhiên)
 */
export default function useFolderBrowser({
  type,
  items = [],
  searchTerm = '',
  searchFields = defaultSearchFields,
  sortOptions = DEFAULT_SORTS,
  sorters = {},
}) {
  const cfg = getContentType(type);
  const [searchParams, setSearchParams] = useSearchParams();
  const path = searchParams.get('path') || '';

  const updateParams = useCallback((patch = {}, navOpts) => {
    const next = { ...Object.fromEntries(searchParams.entries()), ...patch };
    Object.keys(next).forEach((k) => {
      if (next[k] === undefined || next[k] === null || next[k] === '') delete next[k];
    });
    setSearchParams(next, navOpts);
  }, [searchParams, setSearchParams]);

  // ----- Số mục mỗi trang -----
  const perPageKey = `${type}.perPage`;
  const size = (() => {
    const urlVal = parseInt(searchParams.get('size') || '', 10);
    if (!Number.isNaN(urlVal) && urlVal > 0) return urlVal;
    try {
      const stored = parseInt(localStorage.getItem(perPageKey) || '', 10);
      if (!Number.isNaN(stored) && stored > 0) return stored;
    } catch (_) { /* bỏ qua */ }
    return cfg.defaultPerPage;
  })();
  useEffect(() => {
    try { localStorage.setItem(perPageKey, String(size)); } catch (_) { /* bỏ qua */ }
  }, [perPageKey, size]);
  const perPageOptions = useMemo(
    () => Array.from(new Set([...cfg.perPageOptions, size])).sort((a, b) => a - b),
    [cfg.perPageOptions, size]
  );

  // ----- Sắp xếp -----
  const sortParam = searchParams.get('sort');
  const sort = sortOptions.some((o) => o.value === sortParam) ? sortParam : sortOptions[0].value;

  // ----- Lưới / danh sách -----
  const [viewMode, setViewModeState] = useState(() => readViewMode(type, path));
  useEffect(() => {
    setViewModeState(readViewMode(type, path));
  }, [type, path]);
  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    saveViewMode(type, path, mode);
  }, [type, path]);

  // ----- Lọc + sắp xếp -----
  const needle = normalizeText(searchTerm.trim());
  const filtered = useMemo(() => {
    if (!needle) return items;
    return items.filter((it) => searchFields(it).some((v) => normalizeText(v || '').includes(needle)));
    // searchFields là hàm thuần theo loại, không đổi giữa các lần render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, needle]);

  const sorted = useMemo(() => {
    const cmp = sorters[sort] || ((a, b) => naturalCompare(a.name, b.name));
    return [...filtered].sort((a, b) => {
      if (cfg.foldersFirst) {
        const fa = a.type === 'folder';
        const fb = b.type === 'folder';
        if (fa !== fb) return fa ? -1 : 1;
      }
      return cmp(a, b) || naturalCompare(a.name, b.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sort, cfg.foldersFirst]);

  // ----- Phân trang -----
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / size));
  const page = Math.min(pageParam, totalPages);
  const pageItems = useMemo(() => sorted.slice((page - 1) * size, page * size), [sorted, page, size]);

  // Đổi từ khoá lọc thì về trang 1 (không chạy lúc mới mở trang, để giữ trang khi quay lại từ player/reader)
  const prevNeedle = useRef(needle);
  useEffect(() => {
    if (prevNeedle.current === needle) return;
    prevNeedle.current = needle;
    if (pageParam !== 1) updateParams({ page: '1' }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle]);

  // ?focus=<đường dẫn một mục>: về thư mục cha bằng nút ← hoặc từ trình đọc thì tự chuyển tới trang có mục vừa rời
  // (docs/AUDIT-2026-11-09.md, R4; trước đây chỉ MangaHome có, và đánh dấu "đã xử lý" cả khi chưa thấy mục).
  // Chỉ đánh dấu khi tìm thấy: lúc mới đổi thư mục, danh sách có thể vẫn là của thư mục cũ trong khi chờ API.
  // Đổi trang bằng replace để không thêm một mục lịch sử (Back vẫn về đúng thư mục con vừa rời).
  const focusParam = searchParams.get('focus');
  const focusDoneRef = useRef('');
  useEffect(() => {
    if (!focusParam) return;
    const key = `${path}|${focusParam}|${size}`;
    if (focusDoneRef.current === key) return;
    const idx = sorted.findIndex((it) => it.path === focusParam);
    if (idx < 0) return;
    focusDoneRef.current = key;
    const target = Math.floor(idx / size) + 1;
    if (target !== pageParam) updateParams({ page: String(target) }, { replace: true });
  }, [focusParam, path, sorted, size, pageParam, updateParams]);

  const setPage = useCallback((p) => {
    const next = Math.max(1, Math.min(totalPages, p));
    updateParams({ page: String(next) });
  }, [totalPages, updateParams]);

  const setSize = useCallback((n) => {
    const s = Math.max(1, parseInt(n, 10) || cfg.defaultPerPage);
    try { localStorage.setItem(perPageKey, String(s)); } catch (_) { /* bỏ qua */ }
    updateParams({ size: String(s), page: '1' });
  }, [cfg.defaultPerPage, perPageKey, updateParams]);

  const setSort = useCallback((value) => {
    updateParams({ sort: value === sortOptions[0].value ? '' : value, page: '1' });
  }, [sortOptions, updateParams]);

  return {
    path,
    sortedItems: sorted,
    pageItems,
    totalCount: items.length,
    filteredCount: sorted.length,
    page,
    pageParam,
    totalPages,
    setPage,
    size,
    setSize,
    perPageOptions,
    sort,
    setSort,
    sortOptions,
    viewMode,
    setViewMode,
    updateParams,
    searchParams,
  };
}

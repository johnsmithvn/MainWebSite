// 📁 src/hooks/useCardActions.js
// 🖐️ Mở bảng thao tác của card bằng nút ⋯, nhấn giữ (màn hình cảm ứng) hoặc chuột phải.
// Thay cho các nút trong suốt chỉ hiện khi rê chuột: trên điện thoại không thấy nút mà vẫn chạm nhầm được.

import { useCallback, useEffect, useRef, useState } from 'react';

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

export function useCardActions({ enabled = true } = {}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const touchingRef = useRef(false);
  // Sau khi nhấn giữ đã mở bảng, cú click lúc nhả tay (nếu trình duyệt có gửi) không được mở item
  const suppressClickRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const openSheet = useCallback((e) => {
    e?.stopPropagation?.();
    setOpen(true);
  }, []);

  const closeSheet = useCallback(() => setOpen(false), []);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) {
      clearTimer();
      return;
    }
    touchingRef.current = true;
    suppressClickRef.current = false;
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      try { navigator.vibrate?.(10); } catch { /* không hỗ trợ rung */ }
      setOpen(true);
    }, LONG_PRESS_MS);
  }, [clearTimer]);

  const onTouchMove = useCallback((e) => {
    if (!timerRef.current || !startRef.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - startRef.current.x);
    const dy = Math.abs(t.clientY - startRef.current.y);
    // Đang cuộn hoặc vuốt thì không tính là nhấn giữ
    if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clearTimer();
  }, [clearTimer]);

  const onTouchEnd = useCallback(() => {
    touchingRef.current = false;
    clearTimer();
  }, [clearTimer]);

  const onContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Android gửi contextmenu khi nhấn giữ; nếu bộ đếm đã mở bảng rồi thì bỏ qua
    if (suppressClickRef.current) return;
    clearTimer();
    if (touchingRef.current) suppressClickRef.current = true;
    setOpen(true);
  }, [clearTimer]);

  const onClickCapture = useCallback((e) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const pressHandlers = enabled
    ? { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd, onContextMenu, onClickCapture }
    : {};

  return { open: enabled && open, openSheet, closeSheet, pressHandlers };
}

export default useCardActions;

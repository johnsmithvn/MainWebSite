// 📁 src/components/music/SeekBar.jsx
// 🎚️ Draggable slider for track position / volume: mouse + touch (pointer events), keyboard, ARIA

import React, { useRef, useState } from 'react';

const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

/**
 * @param {number} value - current value (0..max)
 * @param {number} max - maximum value (duration in seconds, or 1 for volume)
 * @param {(v:number)=>void} [onChange] - called live while dragging (e.g. preview time / live volume)
 * @param {(v:number)=>void} onCommit - called when the user releases (e.g. audio.currentTime = v)
 * @param {number} [buffered] - buffered position (same unit as value), drawn behind the fill
 * @param {number} [step] - keyboard step (arrow keys)
 * @param {string} ariaLabel
 * @param {(v:number)=>string} [formatValue] - aria-valuetext
 * @param {string} [fillClass] - Tailwind bg class of the filled part / thumb
 */
const SeekBar = ({
  value = 0,
  max = 0,
  onChange,
  onCommit,
  buffered = 0,
  step,
  ariaLabel,
  formatValue,
  fillClass = 'bg-white',
  className = '',
}) => {
  const trackRef = useRef(null);
  const [dragValue, setDragValue] = useState(null);
  const disabled = !max || !Number.isFinite(max);

  const valueAt = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    return clamp01((clientX - rect.left) / rect.width) * max;
  };

  const handlePointerDown = (e) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    // Keep receiving moves when the pointer leaves the bar (can throw for an inactive pointer id)
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    const v = valueAt(e.clientX);
    setDragValue(v);
    onChange?.(v);
  };

  const handlePointerMove = (e) => {
    if (dragValue === null) return;
    const v = valueAt(e.clientX);
    setDragValue(v);
    onChange?.(v);
  };

  const finishDrag = (e) => {
    if (dragValue === null) return;
    const v = e ? valueAt(e.clientX) : dragValue;
    setDragValue(null);
    onCommit?.(v);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    const s = step ?? max / 20;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + s;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - s;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = max;
    if (next === null) return;
    e.preventDefault();
    onCommit?.(Math.min(Math.max(next, 0), max));
  };

  const shown = dragValue ?? value;
  const pct = disabled ? 0 : clamp01(shown / max) * 100;
  const bufferedPct = disabled ? 0 : clamp01(buffered / max) * 100;

  return (
    // 24px tall hit area around a thin visual track; pan-y keeps vertical page scroll working on touch
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.round(max) || 0}
      aria-valuenow={Math.round(shown) || 0}
      aria-valuetext={formatValue ? formatValue(shown) : undefined}
      aria-disabled={disabled || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={() => setDragValue(null)}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-center h-6 w-full touch-pan-y select-none outline-none ${disabled ? 'cursor-default' : 'cursor-pointer'} focus-visible:ring-2 focus-visible:ring-white/40 rounded-full ${className}`}
    >
      <div ref={trackRef} className="relative w-full h-1 group-hover:h-1.5 transition-[height] rounded-full bg-white/20">
        {bufferedPct > 0 && (
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${bufferedPct}%` }} />
        )}
        <div className={`absolute inset-y-0 left-0 rounded-full ${fillClass}`} style={{ width: `${pct}%` }} />
        {!disabled && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full shadow ${fillClass} ${dragValue !== null ? 'w-4 h-4' : 'w-3 h-3'} transition-[width,height]`}
            style={{ left: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default SeekBar;

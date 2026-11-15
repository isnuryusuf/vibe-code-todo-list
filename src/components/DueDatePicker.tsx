import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { parseISODate, toISODate } from '../utils/dateUtils';

interface DueDatePickerProps {
  value?: string;
  onChange: (date?: string) => void;
}

interface PopoverPosition {
  top: number;
  left: number;
}

const POPOVER_GAP = 6;
const VIEWPORT_MARGIN = 8;

export function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setPosition(null);
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(toISODate(date));
    }
    close();
  };

  const handleToday = () => {
    onChange(toISODate(new Date()));
    close();
  };

  const toggle = () => {
    if (open) {
      close();
    } else {
      setOpen(true);
    }
  };

  // The popover is portaled to <body> and positioned against the viewport so
  // the task list's scroll container can neither clip it nor swallow clicks
  // aimed at the tasks underneath it.
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(
        anchorRect.right - popoverRect.width,
        window.innerWidth - popoverRect.width - VIEWPORT_MARGIN
      )
    );
    let top = anchorRect.bottom + POPOVER_GAP;
    if (top + popoverRect.height > window.innerHeight - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, anchorRect.top - popoverRect.height - POPOVER_GAP);
    }
    setPosition({ top, left });
  }, [open]);

  // Close when pressing Escape anywhere while the popover is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Close when pressing down outside the popover. Using pointerdown means the
  // popover is gone before the click lands, so the click still reaches the
  // element underneath instead of being swallowed. Pressing down on a
  // non-interactive part of the popover itself (padding, captions) also
  // dismisses it and passes the click through, so no click is ever "dead";
  // presses on calendar controls are left to the calendar.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (anchorRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) {
        if (!target.closest('button, a, input, select, textarea')) close();
        return;
      }
      close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // The popover is positioned against the viewport, so it would drift away
  // from its anchor on scroll or resize — close instead of drifting.
  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => close();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className="relative inline-block">
      {value ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-label="Pick due date"
            className="text-xs text-zinc-500 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full p-1 transition-colors"
          >
            <span aria-hidden="true">✏️</span>
          </button>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Clear due date"
            className="text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-label="Pick due date"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-dashed border-zinc-700 hover:border-indigo-400/40 transition-colors"
        >
          <span aria-hidden="true">📅</span> Set date
        </button>
      )}

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-50 bg-zinc-900 rounded-xl shadow-2xl shadow-black/60 border border-zinc-700/80 p-3"
            style={position ? { top: position.top, left: position.left } : { visibility: 'hidden' }}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-zinc-400">Pick a due date</span>
              <button
                type="button"
                onClick={handleToday}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Today
              </button>
            </div>
            <DayPicker
              mode="single"
              selected={value ? parseISODate(value) : undefined}
              onSelect={handleSelect}
            />
          </div>,
          document.body
        )}
    </div>
  );
}

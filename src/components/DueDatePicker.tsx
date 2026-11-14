import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { parseISODate, toISODate } from '../utils/dateUtils';

interface DueDatePickerProps {
  value?: string;
  onChange: (date?: string) => void;
}

export function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(toISODate(date));
    }
    setOpen(false);
  };

  const handleToday = () => {
    onChange(toISODate(new Date()));
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      {value ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
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
          onClick={() => setOpen(!open)}
          aria-label="Pick due date"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-dashed border-zinc-700 hover:border-indigo-400/40 transition-colors"
        >
          <span aria-hidden="true">📅</span> Set date
        </button>
      )}

      {open && (
        <div className="absolute z-20 mt-1 right-0 bg-zinc-900 rounded-xl shadow-2xl shadow-black/60 border border-zinc-700/80 p-3">
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
        </div>
      )}
    </div>
  );
}

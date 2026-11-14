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
            className="text-xs text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full p-1 transition-colors"
          >
            <span aria-hidden="true">✏️</span>
          </button>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Clear due date"
            className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Pick due date"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 px-2 py-0.5 rounded-full border border-dashed border-gray-200 hover:border-indigo-200 transition-colors"
        >
          <span aria-hidden="true">📅</span> Set date
        </button>
      )}

      {open && (
        <div className="absolute z-20 mt-1 right-0 bg-white rounded-xl shadow-2xl border border-indigo-100 p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-gray-500">Pick a due date</span>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Today
            </button>
          </div>
          <DayPicker
            mode="single"
            selected={value ? parseISODate(value) : undefined}
            onSelect={handleSelect}
            classNames={{
              selected: 'bg-indigo-500 text-white rounded-full',
              today: 'text-indigo-600 font-bold',
            }}
          />
        </div>
      )}
    </div>
  );
}

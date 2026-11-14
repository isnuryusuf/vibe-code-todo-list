import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { formatDate, toISODate } from '../utils/dateUtils';

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

  return (
    <div className="relative inline-block">
      {value ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Pick due date"
            className="text-xs text-indigo-500 hover:text-indigo-700 underline underline-offset-2"
          >
            {formatDate(value)}
          </button>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Clear due date"
            className="text-xs text-gray-400 hover:text-red-500"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Pick due date"
          className="text-xs text-gray-400 hover:text-indigo-500 transition-colors"
        >
          📅 Set date
        </button>
      )}

      {open && (
        <div className="absolute z-20 mt-1 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2">
          <DayPicker
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            classNames={{
              day_selected: 'bg-indigo-500 text-white rounded',
              day_today: 'text-indigo-600 font-bold',
            }}
          />
        </div>
      )}
    </div>
  );
}

import type { FilterType } from '../types/todo';

interface TodoFilterProps {
  filter: FilterType;
  onChange: (filter: FilterType) => void;
}

const filters: { value: FilterType; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'active', label: 'Active', icon: '⚡' },
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'today', label: 'Today', icon: '📅' },
  { value: 'upcoming', label: 'Upcoming', icon: '🔮' },
  { value: 'overdue', label: 'Overdue', icon: '🔥' },
];

export function TodoFilter({ filter, onChange }: TodoFilterProps) {
  return (
    <div className="flex items-center gap-1 mb-4 border-b border-gray-200 pb-2 flex-wrap">
      {filters.map(({ value, label, icon }) => {
        const isActive = value === filter;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            data-icon={icon}
            className={`px-3 py-2 text-sm font-medium rounded-t transition-all duration-150 before:content-[attr(data-icon)] before:mr-1.5 before:text-base ${
              isActive
                ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

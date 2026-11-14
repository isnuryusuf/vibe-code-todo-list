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
    <div className="flex items-center gap-0.5 mb-3 border-b border-white/10 pb-2 flex-wrap">
      {filters.map(({ value, label, icon }) => {
        const isActive = value === filter;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            data-icon={icon}
            className={`px-2 py-1.5 text-xs font-medium rounded-t transition-all duration-150 before:content-[attr(data-icon)] before:mr-0.5 before:text-xs ${
              isActive
                ? 'text-indigo-300 border-b-2 border-indigo-400 bg-indigo-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

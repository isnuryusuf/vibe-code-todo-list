import type { FilterType } from '../types/todo';

interface TodoFilterProps {
  filter: FilterType;
  onChange: (filter: FilterType) => void;
}

const filters: FilterType[] = ['all', 'active', 'completed', 'today', 'upcoming', 'overdue'];

export function TodoFilter({ filter, onChange }: TodoFilterProps) {
  return (
    <div className="flex items-center gap-1 mb-4 border-b border-gray-200 pb-2 flex-wrap">
      {filters.map((f) => {
        const isActive = f === filter;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            aria-pressed={isActive}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors duration-150 ${
              isActive
                ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

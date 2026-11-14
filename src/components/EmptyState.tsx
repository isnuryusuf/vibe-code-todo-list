import type { FilterType } from '../types/todo';

interface EmptyStateProps {
  filter: FilterType;
}

const messages: Record<FilterType, string> = {
  all: 'No tasks yet. Add one above!',
  active: 'No active tasks. 🎉',
  completed: 'No completed tasks. Get to work! 💪',
};

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-lg font-medium">{messages[filter]}</p>
    </div>
  );
}

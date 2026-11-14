import type { FilterType } from '../types/todo';

interface EmptyStateProps {
  filter: FilterType;
}

const messages: Record<FilterType, string> = {
  all: 'No tasks yet. Add one above!',
  active: 'No active tasks. 🎉',
  completed: 'No completed tasks. Get to work! 💪',
  today: 'Nothing due today.',
  upcoming: 'No upcoming tasks.',
  overdue: 'No overdue tasks. Great job! 🎉',
};

const illustrations: Record<FilterType, string> = {
  all: '🌱',
  active: '🎉',
  completed: '💪',
  today: '☀️',
  upcoming: '🔮',
  overdue: '🔥',
};

const hints: Record<FilterType, string> = {
  all: 'A fresh start — what will you accomplish first?',
  active: 'Everything is checked off. Time to relax!',
  completed: 'Finish something and it will show up here.',
  today: 'Your day is clear. Enjoy the breathing room.',
  upcoming: 'Schedule a due date to plan ahead.',
  overdue: 'You are all caught up. Keep it that way!',
};

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-xl scale-125" />
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-zinc-900 shadow-lg shadow-black/40 border border-white/10 text-4xl float-animation">
          <span aria-hidden="true">{illustrations[filter]}</span>
        </div>
      </div>
      <p className="text-lg font-semibold text-zinc-300">{messages[filter]}</p>
      <p className="text-sm text-zinc-500 mt-1 max-w-xs">{hints[filter]}</p>
    </div>
  );
}

import type { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';
import { isOverdue, isToday, isUpcoming } from '../utils/dateUtils';

interface TodoListProps {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed' | 'today' | 'upcoming' | 'overdue';
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onSetDueDate?: (id: string, date?: string) => void;
  itemClassName?: (id: string) => string;
}

const filterMessages: Record<'all' | 'active' | 'completed' | 'today' | 'upcoming' | 'overdue', string> = {
  all: 'No tasks yet. Add one above!',
  active: 'No active tasks. 🎉',
  completed: 'No completed tasks. Get to work! 💪',
  today: 'Nothing due today.',
  upcoming: 'No upcoming tasks.',
  overdue: 'No overdue tasks. Great job! 🎉',
};

function sortByDueDate(a: Todo, b: Todo): number {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return b.createdAt - a.createdAt;
}

export function TodoList({
  todos,
  filter,
  onToggle,
  onDelete,
  onEdit,
  onSetDueDate,
  itemClassName,
}: TodoListProps) {
  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'today') return t.dueDate ? isToday(t.dueDate) && !t.completed : false;
    if (filter === 'upcoming') return t.dueDate ? isUpcoming(t.dueDate) && !t.completed : false;
    if (filter === 'overdue') return t.dueDate ? isOverdue(t.dueDate, t.completed) : false;
    return true;
  });

  const sorted = [...filtered].sort(sortByDueDate);

  return (
    <div className="flex-1">
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg font-medium">{filterMessages[filter]}</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {sorted.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => onToggle(todo.id)}
              onDelete={() => onDelete(todo.id)}
              onEdit={(newText) => onEdit(todo.id, newText)}
              onSetDueDate={onSetDueDate ? (date) => onSetDueDate(todo.id, date) : undefined}
              className={itemClassName?.(todo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

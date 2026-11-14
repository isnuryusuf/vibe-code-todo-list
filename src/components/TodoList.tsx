import type { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  itemClassName?: (id: string) => string;
}

const filterMessages: Record<'all' | 'active' | 'completed', string> = {
  all: 'No tasks yet. Add one above!',
  active: 'No active tasks. 🎉',
  completed: 'No completed tasks. Get to work! 💪',
};

export function TodoList({
  todos,
  filter,
  onToggle,
  onDelete,
  onEdit,
  itemClassName,
}: TodoListProps) {
  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="flex-1">
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg font-medium">{filterMessages[filter]}</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => onToggle(todo.id)}
              onDelete={() => onDelete(todo.id)}
              onEdit={(newText) => onEdit(todo.id, newText)}
              className={itemClassName?.(todo.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

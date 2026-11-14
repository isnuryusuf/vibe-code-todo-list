import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Todo } from '../types/todo';
import { DueDatePicker } from './DueDatePicker';
import { isOverdue, formatDate } from '../utils/dateUtils';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (newText: string) => void;
  onSetDueDate?: (date?: string) => void;
  className?: string;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit, onSetDueDate, className = '' }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const overdue = todo.dueDate ? isOverdue(todo.dueDate, todo.completed) : false;

  const handleDoubleClick = () => {
    setEditText(todo.text);
    setEditing(true);
  };

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(editText.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setEditing(false);
    }
  };

  return (
    <li className={`flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors duration-150 group ${className}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-500 focus:ring-2 focus:ring-indigo-200 cursor-pointer accent-indigo-500"
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border-2 border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
            autoFocus
          />
        ) : (
          <div className="flex flex-col gap-0.5">
            <span
              onDoubleClick={handleDoubleClick}
              className={`block truncate cursor-text select-none transition-all duration-200 ${
                todo.completed ? 'line-through opacity-50' : ''
              }`}
            >
              {todo.text}
            </span>
            {todo.dueDate && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}
                  aria-label={overdue ? `Overdue: ${formatDate(todo.dueDate)}` : `Due: ${formatDate(todo.dueDate)}`}
                >
                  {formatDate(todo.dueDate)}
                </span>
                {overdue && (
                  <span className="text-xs text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                    Overdue
                  </span>
                )}
                {onSetDueDate && (
                  <DueDatePicker value={todo.dueDate} onChange={onSetDueDate} />
                )}
              </div>
            )}
            {!todo.dueDate && onSetDueDate && (
              <div className="flex items-center">
                <DueDatePicker value={todo.dueDate} onChange={onSetDueDate} />
              </div>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete "${todo.text}"`}
        className="opacity-0 focus:opacity-100 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-150 px-2 py-1 text-sm font-medium"
      >
        Delete
      </button>
    </li>
  );
}

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Todo } from '../types/todo';
import { DueDatePicker } from './DueDatePicker';
import { isOverdue, isToday, formatDate } from '../utils/dateUtils';

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
  const dueToday = todo.dueDate ? isToday(todo.dueDate) : false;

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
    <li
      className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-150 group border border-transparent ${
        overdue && !todo.completed
          ? 'hover:bg-red-50/60 border-l-4 border-l-red-400 bg-red-50/30'
          : 'hover:bg-indigo-50/50 hover:border-indigo-100'
      } ${todo.completed ? 'opacity-75' : ''} ${className}`}
    >
      <label className="relative flex items-center justify-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={onToggle}
          aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          className="peer appearance-none w-6 h-6 rounded-full border-2 border-gray-300 checked:border-transparent checked:bg-gradient-to-br checked:from-green-400 checked:to-emerald-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200 cursor-pointer"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute text-white text-xs font-bold opacity-0 peer-checked:opacity-100 transition-opacity duration-150"
        >
          ✓
        </span>
      </label>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
            autoFocus
          />
        ) : (
          <div className="flex flex-col gap-1">
            <span
              onDoubleClick={handleDoubleClick}
              className={`block truncate cursor-text select-none transition-all duration-200 text-gray-700 ${
                todo.completed ? 'line-through opacity-50' : ''
              }`}
              title="Double-click to edit"
            >
              {todo.text}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {todo.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    overdue
                      ? 'bg-red-100 text-red-600 font-medium'
                      : dueToday
                        ? 'bg-amber-100 text-amber-600 font-medium'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                  aria-label={overdue ? `Overdue: ${formatDate(todo.dueDate)}` : `Due: ${formatDate(todo.dueDate)}`}
                >
                  <span aria-hidden="true">{overdue ? '⚠️' : dueToday ? '☀️' : '📅'}</span>
                  {formatDate(todo.dueDate)}
                </span>
              )}
              {overdue && (
                <span className="text-xs text-white bg-gradient-to-r from-red-500 to-pink-500 px-2 py-0.5 rounded-full font-semibold shadow-sm">
                  <span aria-hidden="true">🔥</span> Overdue
                </span>
              )}
              {onSetDueDate && (
                <DueDatePicker value={todo.dueDate} onChange={onSetDueDate} />
              )}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete "${todo.text}"`}
        className="opacity-0 focus:opacity-100 group-hover:opacity-100 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 px-2 py-1.5 text-base shrink-0"
      >
        <span aria-hidden="true">🗑️</span>
      </button>
    </li>
  );
}

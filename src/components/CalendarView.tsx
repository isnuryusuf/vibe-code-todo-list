import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import type { Todo } from '../types/todo';
import { toISODate, isOverdue } from '../utils/dateUtils';

interface CalendarViewProps {
  todos: Todo[];
  onDateSelect: (date: string) => void;
  initialMonth?: Date;
}

export function CalendarView({ todos, onDateSelect, initialMonth }: CalendarViewProps) {
  const [month, setMonth] = useState<Date>(initialMonth ?? new Date());

  const todosByDate = todos.reduce<Record<string, Todo[]>>((acc, todo) => {
    if (!todo.dueDate) return acc;
    acc[todo.dueDate] = acc[todo.dueDate] || [];
    acc[todo.dueDate].push(todo);
    return acc;
  }, {});

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(toISODate(date));
    }
  };

  const modifiers = {
    hasTodo: Object.keys(todosByDate).map((d) => new Date(d)),
    hasOverdue: Object.entries(todosByDate)
      .filter(([date, list]) => list.some((t) => isOverdue(date, t.completed)))
      .map(([date]) => new Date(date)),
  };

  return (
    <div className="flex-1 bg-white/70 rounded-2xl p-4 border border-indigo-100/60">
      <div className="flex items-center justify-center gap-2 mb-2 text-indigo-500">
        <span aria-hidden="true" className="text-xl">🗓️</span>
        <span className="text-sm font-semibold">Your month at a glance</span>
      </div>
      <DayPicker
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={handleSelect}
        modifiers={modifiers}
        modifiersClassNames={{
          hasTodo: 'bg-indigo-100 text-indigo-700 rounded-full font-semibold',
          hasOverdue: 'bg-red-100 text-red-700 rounded-full font-semibold',
        }}
        classNames={{
          selected: 'bg-indigo-500 text-white rounded-full',
          today: 'text-indigo-600 font-bold',
        }}
      />
      <div className="flex gap-4 justify-center mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-200" /> Has todo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-200" /> Overdue
        </span>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        Click a highlighted day to see its tasks <span aria-hidden="true">👆</span>
      </p>
    </div>
  );
}

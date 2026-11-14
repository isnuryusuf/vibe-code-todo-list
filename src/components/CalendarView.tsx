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
    <div className="flex-1 bg-white rounded-lg p-4">
      <DayPicker
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={handleSelect}
        modifiers={modifiers}
        modifiersClassNames={{
          hasTodo: 'bg-indigo-100 text-indigo-700 rounded-full',
          hasOverdue: 'bg-red-100 text-red-700 rounded-full',
        }}
        classNames={{
          day_selected: 'bg-indigo-500 text-white rounded-full',
          day_today: 'text-indigo-600 font-bold',
        }}
      />
      <div className="flex gap-4 justify-center mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-100" /> Has todo</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-100" /> Overdue</span>
      </div>
    </div>
  );
}

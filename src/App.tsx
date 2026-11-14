import { useState, useCallback, useEffect, useRef } from 'react';
import { useTodos } from './hooks/useTodos';
import type { FilterType } from './types/todo';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TodoFilter } from './components/TodoFilter';
import { TodoStats } from './components/TodoStats';
import { EmptyState } from './components/EmptyState';
import { ClearCompleted } from './components/ClearCompleted';
import { CalendarView } from './components/CalendarView';
import { isToday } from './utils/dateUtils';

type ViewMode = 'list' | 'calendar';

function App() {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setDueDate,
    clearCompleted,
    activeCount,
    totalCount,
    completedCount,
  } = useTodos();

  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleAdd = useCallback(
    (text: string) => {
      const id = addTodo(text);
      setAnimatingIds((prev) => new Set(prev).add(id));
      timeoutRef.current = setTimeout(() => {
        setAnimatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    },
    [addTodo]
  );

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setSelectedDate(null);
    setView('list');
  }, []);

  const handleCalendarSelect = useCallback((date: string) => {
    setFilter('all');
    setSelectedDate(date);
    setView('list');
  }, []);

  const displayedTodos = selectedDate
    ? todos.filter((t) => t.dueDate === selectedDate)
    : todos;

  const dateFilterActive = selectedDate !== null;
  const dateFilterLabel = selectedDate
    ? isToday(selectedDate)
      ? 'Due today'
      : `Due ${selectedDate}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Gradient Header */}
      <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-6 shadow-lg">
        <div className="max-w-xl mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight">
            My Todos
          </h1>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[500px] flex flex-col">
          {/* Input */}
          <div className="mb-5">
            <TodoInput onAdd={handleAdd} />
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-gray-200 pb-2">
            <button
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors duration-150 ${
                view === 'list'
                  ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              aria-pressed={view === 'calendar'}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors duration-150 ${
                view === 'calendar'
                  ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
          </div>

          {view === 'calendar' ? (
            <CalendarView todos={todos} onDateSelect={handleCalendarSelect} />
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="mb-3">
                <TodoFilter filter={filter} onChange={handleFilterChange} />
              </div>

              {dateFilterActive && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm text-indigo-600 font-medium">
                    {dateFilterLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* List or Empty State */}
              {displayedTodos.length === 0 ? (
                <EmptyState filter={filter} />
              ) : (
                <>
                  <TodoList
                    todos={displayedTodos}
                    filter={filter}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onEdit={editTodo}
                    onSetDueDate={setDueDate}
                    itemClassName={(id) => (animatingIds.has(id) ? 'slide-in' : '')}
                  />

                  {/* Stats */}
                  <div className="mt-4">
                    <TodoStats activeCount={activeCount} totalCount={totalCount} />
                  </div>

                  {/* Clear Completed */}
                  <ClearCompleted count={completedCount} onClear={clearCompleted} />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

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
import { isToday, formatDate } from './utils/dateUtils';

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
      : `Due ${formatDate(selectedDate)}`
    : null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 overflow-hidden">
      {/* Decorative background orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-300/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute top-16 right-1/4 text-3xl opacity-20 float-animation">✨</div>
        <div className="absolute bottom-24 left-10 text-2xl opacity-20 float-animation">🌟</div>
      </div>

      {/* Gradient Header */}
      <header className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-6 shadow-lg header-shimmer">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl float-animation drop-shadow-md" aria-hidden="true">📋</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                My Todos
              </h1>
              <p className="text-purple-100 text-sm">
                Organize your day, one task at a time <span aria-hidden="true">✨</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <main className="relative max-w-xl mx-auto px-4 -mt-4 pb-10">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl shadow-indigo-200/50 border border-white/70 ring-1 ring-indigo-100/50 p-6 min-h-[500px] flex flex-col">
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
              data-icon="📝"
              className={`px-4 py-2 text-sm font-medium rounded-t transition-all duration-150 before:content-[attr(data-icon)] before:mr-1.5 ${
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
              data-icon="🗓️"
              className={`px-4 py-2 text-sm font-medium rounded-t transition-all duration-150 before:content-[attr(data-icon)] before:mr-1.5 ${
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
                  <span className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full">
                    <span aria-hidden="true">📌</span>
                    {dateFilterLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-full transition-colors"
                    aria-label="Clear date filter"
                  >
                    Clear <span aria-hidden="true">✕</span>
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
                  <TodoStats activeCount={activeCount} totalCount={totalCount} />

                  {/* Clear Completed */}
                  <ClearCompleted count={completedCount} onClear={clearCompleted} />
                </>
              )}
            </>
          )}
        </div>

        <footer className="text-center text-xs text-indigo-300 mt-4">
          Made with <span aria-hidden="true">💜</span> · Double-click a task to edit
        </footer>
      </main>
    </div>
  );
}

export default App;

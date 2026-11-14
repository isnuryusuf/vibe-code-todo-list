import { useState, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useTodos } from './hooks/useTodos';
import { useIsDesktop } from './hooks/useMediaQuery';
import type { FilterType } from './types/todo';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TodoFilter } from './components/TodoFilter';
import { TodoStats } from './components/TodoStats';
import { EmptyState } from './components/EmptyState';
import { ClearCompleted } from './components/ClearCompleted';
import { CalendarView } from './components/CalendarView';
import { CalendarExportButton } from './components/CalendarExportButton';
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

  const isDesktop = useIsDesktop();
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

  const showList = isDesktop || view === 'list';
  const showCalendar = isDesktop || view === 'calendar';

  return (
    <div className="relative min-h-screen bg-black text-zinc-200">
      {/* Decorative ambient glows on pure black */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute top-24 right-1/4 text-3xl text-indigo-400/20 float-animation">✨</div>
        <div className="absolute bottom-24 left-10 text-2xl text-fuchsia-400/20 float-animation">🌟</div>
      </div>

      {/* Eye-catching header */}
      <header className="relative overflow-hidden border-b border-white/10 bg-black">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="absolute -top-24 left-1/4 h-56 w-80 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div className="absolute -top-28 right-1/4 h-56 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 min-[900px]:px-8 py-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-pink-500 opacity-70 blur-lg"
                />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-pink-500 text-3xl shadow-lg shadow-fuchsia-500/30">
                  <span aria-hidden="true">📋</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl min-[900px]:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                  My Todos
                </h1>
                <p className="text-zinc-400 text-sm mt-0.5">
                  Organize your day, one task at a time <span aria-hidden="true">✨</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CalendarExportButton todos={todos} />
              <div className="hidden min-[900px]:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur">
                <span aria-hidden="true">📅</span>
                {format(new Date(), 'EEEE, MMM d')}
              </div>
            </div>
          </div>
        </div>

        {/* Animated neon underline */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/80 to-transparent header-shimmer opacity-90 shadow-[0_0_18px_rgba(217,70,239,0.35)]"
        />
      </header>

      {/* Main Card */}
      <main className="relative max-w-6xl mx-auto px-4 min-[900px]:px-8 -mt-4 pb-6 min-[900px]:pb-8">
        <div className="bg-zinc-950/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-950/40 border border-white/10 ring-1 ring-white/5 p-5 min-[900px]:p-8 min-h-[500px] min-[900px]:min-h-[540px] flex flex-col">
          {/* Input */}
          <div className="mb-4 min-[900px]:mb-5">
            <TodoInput onAdd={handleAdd} />
          </div>

          {/* Mobile-only view tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-white/10 pb-2 min-[900px]:hidden">
            <button
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              data-icon="📝"
              className={`px-4 py-2 text-sm font-medium rounded-t transition-all duration-150 before:content-[attr(data-icon)] before:mr-1.5 ${
                view === 'list'
                  ? 'text-indigo-300 border-b-2 border-indigo-400 bg-indigo-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
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
                  ? 'text-indigo-300 border-b-2 border-indigo-400 bg-indigo-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              Calendar
            </button>
          </div>

          {/* Two-column desktop: list + calendar */}
          <div className="flex-1 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_340px] min-[900px]:gap-8 min-[900px]:items-start">
            {showList && (
              <section className="min-w-0" aria-label="Task list">
                {/* Filter Tabs */}
                <div className="mb-3">
                  <TodoFilter filter={filter} onChange={handleFilterChange} />
                </div>

                {dateFilterActive && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm text-indigo-200 font-medium bg-indigo-500/15 border border-indigo-400/20 px-3 py-1 rounded-full">
                      <span aria-hidden="true">📌</span>
                      {dateFilterLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/10 px-2 py-1 rounded-full transition-colors"
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
                    <div className="min-[900px]:max-h-[calc(100vh-460px)] min-[900px]:min-h-[220px] min-[900px]:overflow-y-auto min-[900px]:pr-2 scrollbar-thin">
                      <TodoList
                        todos={displayedTodos}
                        filter={filter}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onEdit={editTodo}
                        onSetDueDate={setDueDate}
                        itemClassName={(id) => (animatingIds.has(id) ? 'slide-in' : '')}
                      />
                    </div>

                    {/* Stats */}
                    <TodoStats activeCount={activeCount} totalCount={totalCount} />

                    {/* Clear Completed */}
                    <ClearCompleted count={completedCount} onClear={clearCompleted} />
                  </>
                )}
              </section>
            )}

            {showCalendar && (
              <aside
                aria-label="Calendar"
                className="min-w-0 mt-6 min-[900px]:mt-0 min-[900px]:sticky min-[900px]:top-6"
              >
                <CalendarView
                  todos={todos}
                  onDateSelect={handleCalendarSelect}
                  selectedDate={selectedDate}
                />
              </aside>
            )}
          </div>
        </div>

        <footer className="text-center text-xs text-zinc-600 mt-3">
          Made with <span aria-hidden="true">💜</span> · Double-click a task to edit
        </footer>
      </main>
    </div>
  );
}

export default App;

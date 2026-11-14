import { useState, useCallback, useEffect, useRef } from 'react';
import { useTodos } from './hooks/useTodos';
import type { FilterType } from './types/todo';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { TodoFilter } from './components/TodoFilter';
import { TodoStats } from './components/TodoStats';
import { EmptyState } from './components/EmptyState';
import { ClearCompleted } from './components/ClearCompleted';

function App() {
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    activeCount,
    totalCount,
    completedCount,
  } = useTodos();

  const [filter, setFilter] = useState<FilterType>('all');
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

          {/* Filter Tabs */}
          <div className="mb-3">
            <TodoFilter filter={filter} onChange={setFilter} />
          </div>

          {/* List or Empty State */}
          {todos.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <>
              <TodoList
                todos={todos}
                filter={filter}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
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
        </div>
      </main>
    </div>
  );
}

export default App;

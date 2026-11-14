import { useEffect, useRef, useState } from 'react';
import type { Todo } from '../types/todo';
import { downloadICS } from '../utils/calendarExport';

interface CalendarExportButtonProps {
  todos: Todo[];
}

export function CalendarExportButton({ todos }: CalendarExportButtonProps) {
  const datedCount = todos.filter((todo) => todo.dueDate).length;
  const [downloaded, setDownloaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (!downloadICS(todos)) return;

    setDownloaded(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={datedCount === 0}
      aria-label={`Export ${datedCount} dated task${datedCount === 1 ? '' : 's'} to .ics`}
      title={
        datedCount === 0
          ? 'Add a due date to export your tasks'
          : 'Download all dated tasks as an .ics file'
      }
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-200 backdrop-blur transition-all duration-150 hover:border-indigo-300/60 hover:bg-indigo-500/20 hover:text-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-indigo-400/30 disabled:hover:bg-indigo-500/10 disabled:hover:text-indigo-200"
    >
      <span aria-hidden="true">{downloaded ? '✅' : '📥'}</span>
      <span className="hidden sm:inline">{downloaded ? 'Downloaded!' : 'Export .ics'}</span>
      {!downloaded && (
        <span
          aria-hidden="true"
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-400/20 px-1 text-[10px] font-bold text-indigo-200"
        >
          {datedCount}
        </span>
      )}
    </button>
  );
}

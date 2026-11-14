interface ClearCompletedProps {
  count: number;
  onClear: () => void;
}

export function ClearCompleted({ count, onClear }: ClearCompletedProps) {
  if (count === 0) return null;

  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all duration-150"
      >
        <span aria-hidden="true">🧹</span>
        Clear completed ({count})
      </button>
    </div>
  );
}

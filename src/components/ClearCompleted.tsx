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
        className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-150 underline underline-offset-2"
      >
        Clear completed ({count})
      </button>
    </div>
  );
}

interface TodoStatsProps {
  activeCount: number;
  totalCount: number;
}

export function TodoStats({ activeCount, totalCount }: TodoStatsProps) {
  const allDone = totalCount > 0 && activeCount === 0;

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${
          allDone ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-500'
        }`}
      >
        <span aria-hidden="true">{allDone ? '🏆' : '🎯'}</span>
        <span className="font-medium">
          {activeCount} of {totalCount}
        </span>
        <span className="text-gray-400">tasks remaining</span>
      </span>
    </div>
  );
}

interface TodoStatsProps {
  activeCount: number;
  totalCount: number;
}

export function TodoStats({ activeCount, totalCount }: TodoStatsProps) {
  const allDone = totalCount > 0 && activeCount === 0;

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
          allDone
            ? 'bg-green-500/10 text-green-400 border-green-400/20'
            : 'bg-indigo-500/10 text-indigo-300 border-indigo-400/20'
        }`}
      >
        <span aria-hidden="true">{allDone ? '🏆' : '🎯'}</span>
        <span className="font-medium">
          {activeCount} of {totalCount}
        </span>
        <span className="text-zinc-500">tasks remaining</span>
      </span>
    </div>
  );
}

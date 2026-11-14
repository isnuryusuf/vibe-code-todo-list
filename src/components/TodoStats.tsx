interface TodoStatsProps {
  activeCount: number;
  totalCount: number;
}

export function TodoStats({ activeCount, totalCount }: TodoStatsProps) {
  return (
    <p className="text-sm text-gray-400 text-center mt-2 mb-1">
      {activeCount} of {totalCount} tasks remaining
    </p>
  );
}

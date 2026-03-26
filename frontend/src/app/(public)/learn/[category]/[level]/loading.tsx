export default function LevelLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex gap-2 text-sm mb-6 animate-pulse">
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <span className="text-gray-200">/</span>
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <span className="text-gray-200">/</span>
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>

      <div className="mb-8 animate-pulse">
        <div className="h-9 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-5 w-24 bg-gray-200 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-40 bg-gray-200" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-20 bg-gray-200 rounded-full" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="flex justify-between mt-3">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="h-9 w-40 bg-gray-200 rounded animate-pulse mb-8" />
      <div className="card p-6 mb-6 animate-pulse">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-gray-200 rounded w-64" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-40" />
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-36" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

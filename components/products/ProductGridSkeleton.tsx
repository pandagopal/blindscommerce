'use client';

interface ProductGridSkeletonProps {
  count?: number;
  gridView?: 'comfortable' | 'compact';
}

const SkeletonCard = ({ isCompact }: { isCompact: boolean }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    {/* Image skeleton */}
    <div className={`bg-gray-200 ${isCompact ? 'aspect-square' : 'aspect-[4/3]'}`} />

    {/* Content skeleton */}
    <div className={`${isCompact ? 'p-2' : 'p-4'}`}>
      {/* Category */}
      <div className="h-3 bg-gray-200 rounded w-16 mb-2" />

      {/* Title */}
      <div className="h-4 bg-gray-200 rounded w-full mb-1" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />

      {/* Description (only in comfortable view) */}
      {!isCompact && (
        <>
          <div className="h-3 bg-gray-200 rounded w-full mb-1" />
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
        </>
      )}

      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-3 h-3 bg-gray-200 rounded" />
        ))}
        <div className="h-3 bg-gray-200 rounded w-8 ml-1" />
      </div>

      {/* Price */}
      <div className="flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded w-16" />
        {!isCompact && <div className="h-4 bg-gray-200 rounded w-14" />}
      </div>
    </div>
  </div>
);

export default function ProductGridSkeleton({
  count = 12,
  gridView = 'comfortable'
}: ProductGridSkeletonProps) {
  const isCompact = gridView === 'compact';

  const gridClasses = isCompact
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

  return (
    <div className={`grid ${gridClasses}`}>
      {[...Array(count)].map((_, index) => (
        <SkeletonCard key={index} isCompact={isCompact} />
      ))}
    </div>
  );
}

// Search bar skeleton
export function SearchBarSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-12 bg-gray-200 rounded-full" />
    </div>
  );
}

// Filter sidebar skeleton
export function FilterSidebarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-14" />
      </div>

      {/* Categories section */}
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Price range section */}
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded flex-1" />
          <div className="h-10 bg-gray-200 rounded flex-1" />
        </div>
      </div>

      {/* Room type section */}
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
        <div className="h-10 bg-gray-200 rounded w-full" />
      </div>

      {/* Sale filter */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

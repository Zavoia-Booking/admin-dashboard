import { Skeleton } from "../../../shared/components/ui/skeleton";
import React from "react";

export const LocationsListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Filters row skeleton - matches LocationFilters layout */}
      <div className="flex flex-col gap-2">
        {/* Search + Add Location button row */}
        <div className="flex gap-2 items-center">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-9 w-auto md:h-11 md:w-44 rounded-full shrink-0" />
        </div>
      </div>

      {/* Locations cards skeleton - matches ItemCard structure */}
      <div className="grid grid-cols-1 gap-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border dark:border-border bg-surface dark:bg-transparent overflow-hidden shadow-sm flex flex-col"
          >
            <div className="flex-1 flex flex-col px-4 py-3">
              {/* Header with title and edit button */}
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                  </div>
                  {/* Edit button skeleton */}
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                </div>
                {/* Description skeleton */}
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>

              {/* Metadata */}
              <div className="mt-auto space-y-3">
                {/* Address - full width */}
                <div className="flex items-center gap-2 w-full">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                {/* Phone and Email - flex row */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationsListSkeleton;


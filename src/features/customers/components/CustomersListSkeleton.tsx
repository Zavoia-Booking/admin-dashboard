import { Skeleton } from "../../../shared/components/ui/skeleton";
import React from "react";

export const CustomersListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Filters row skeleton - matches CustomerFilters layout */}
      <div className="flex flex-col gap-2">
        {/* Search + Add Customer button row */}
        <div className="flex gap-2 items-center">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-9 w-auto md:h-11 md:w-44 rounded-full shrink-0" />
        </div>
      </div>

      {/* Customer cards skeleton - matches ItemCard structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border dark:border-border bg-surface dark:bg-transparent overflow-hidden shadow-sm flex flex-col"
          >
            <div className="flex-1 flex flex-col px-4 py-3">
              {/* Header with title and edit button */}
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar skeleton */}
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    {/* Title and metadata */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-50" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                  {/* Edit button skeleton */}
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomersListSkeleton;


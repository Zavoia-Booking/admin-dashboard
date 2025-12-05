import { Skeleton } from "../../../../shared/components/ui/skeleton";
import React from "react";

export const ServicesListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Filters row skeleton - matches ServiceFilters layout */}
      <div className="flex flex-col gap-2">
        {/* Search + Add Service button row */}
        <div className="flex gap-2 items-center">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-9 w-auto md:h-11 md:w-44 rounded-full shrink-0" />
        </div>
        
        {/* Sort + Filter buttons row (mobile: equal width, desktop: auto) + Manage Categories */}
        <div className="flex flex-wrap gap-2 items-center">
          <Skeleton className="h-9 flex-1 md:flex-none w-32 md:w-auto rounded-full" />
          <Skeleton className="h-9 flex-1 md:flex-none w-32 md:w-auto rounded-full" />
          <Skeleton className="h-9 w-full md:w-auto md:w-40 rounded-full" />
        </div>
      </div>

      {/* Helper text skeleton (only shown when services exist) */}
      <div className="flex items-end gap-1 mb-6">
        <Skeleton className="h-5 w-48" />
        <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
      </div>

      {/* Services cards skeleton - matches ItemCard structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
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
              </div>

              {/* Category and Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {/* Category badge */}
                <Skeleton className="h-8 w-24 rounded-full" />
                {/* Badges */}
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>

              {/* Metadata and Price */}
              <div className="mt-auto space-y-3">
                <div className="flex items-center justify-between pb-1">
                  {/* Duration metadata */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  {/* Price */}
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesListSkeleton;

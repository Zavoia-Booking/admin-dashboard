import { Skeleton } from "../../../shared/components/ui/skeleton";
import React from "react";

export const ServicesListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Filters row skeleton */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-11 w-44 rounded-full" />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-5 space-y-3"
          >
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Services cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-5 space-y-4"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton
                  key={j}
                  className="h-6 w-20 rounded-full"
                />
              ))}
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesListSkeleton;



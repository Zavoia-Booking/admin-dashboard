import React from "react";
import { Skeleton } from "../../../shared/components/ui/skeleton";

const LaunchPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 px-4 md:px-0">
      {/* Header Skeleton */}
      <div className="text-center py-8 md:py-6 lg:py-8 md:mb-3">
        <Skeleton className="h-8 md:h-9 w-48 mx-auto mb-2" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>

      {/* Divider Skeleton */}
      <div className="flex items-end gap-2 mb-6">
        <Skeleton className="h-4 w-40" />
        <div className="flex-1 h-px bg-border"></div>
      </div>

      {/* Critical Action Card Skeleton */}
      <div className="relative bg-gradient-to-br from-surface to-surface-hover dark:from-neutral-900 dark:to-neutral-800 rounded-2xl py-6 md:py-6 p-4 md:p-6 overflow-hidden">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-4">
            <div className="hidden md:block">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <Skeleton className="h-7 md:h-8 w-3/4 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto md:mx-0" />
            </div>
          </div>
          <div className="flex justify-center md:justify-start">
            <Skeleton className="h-12 w-full md:w-40 rounded-xl" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Skeleton className="h-5 w-32 mx-auto sm:mx-0" />
            <Skeleton className="h-12 w-full sm:w-40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Setup Summary Skeleton */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex-1 h-px bg-border"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Business Card Skeleton */}
          <div className="bg-gradient-to-br from-surface to-surface-hover dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-4 md:p-5 border border-border overflow-hidden">
            <div className="mb-3">
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {/* Location Card Skeleton */}
          <div className="bg-gradient-to-br from-surface to-surface-hover dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-4 md:p-5 border border-border overflow-hidden">
            <div className="mb-3">
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          {/* Team Card Skeleton */}
          <div className="bg-gradient-to-br from-surface to-surface-hover dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-4 md:p-5 border border-border overflow-hidden">
            <div className="mb-3">
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Trial Notification Skeleton */}
      <div>
        <div className="flex items-end gap-2 mb-6">
          <Skeleton className="h-4 w-40" />
          <div className="flex-1 h-px bg-border"></div>
        </div>
        <div className="relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-12 w-full sm:w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* More you can do now Skeleton */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex-1 h-px bg-border"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assignments Card Skeleton */}
          <div className="bg-gradient-to-br from-surface to-surface-hover dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-4 md:p-5 border border-border overflow-hidden">
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="mt-6">
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
            </div>
          </div>
          {/* Locations Card Skeleton */}
          <div className="bg-gradient-to-br from-surface to-surface-hover dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-4 md:p-5 border border-border overflow-hidden">
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="mt-6">
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section Skeleton */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex-1 h-px bg-border"></div>
        </div>
        <div className="relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-12 w-full sm:w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section Skeleton */}
      <div>
        <div className="flex items-end gap-2 mb-6 pt-4">
          <Skeleton className="h-4 w-52" />
          <div className="flex-1 h-px bg-border"></div>
        </div>
        <div className="relative bg-surface dark:bg-neutral-900 rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-12 w-full sm:w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 pb-8 md:pb-0">
        <Skeleton className="h-12 w-full sm:w-40 rounded-full" />
      </div>
    </div>
  );
};

export default LaunchPageSkeleton;


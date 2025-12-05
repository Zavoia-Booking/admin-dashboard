import React from "react";
import { Skeleton } from "../../../../shared/components/ui/skeleton";

export const ServiceFormSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 cursor-default">
      {/* Essential Fields */}
      <div className="space-y-0 mb-0">
        {/* Service Information Section */}
        <div className="space-y-5">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <div className="h-5" />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-28 w-full" />
              <div className="h-5" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-end gap-2 mb-6 pt-4">
          <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
        </div>

        {/* Pricing & Duration Section */}
        <div className="space-y-4">
          <div className="space-y-1 mb-4">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Currency helper text */}
          <Skeleton className="h-3 w-64" />

          {/* Price & Duration on same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Price Input */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <div className="h-5" />
            </div>

            {/* Duration Input */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
              {/* Duration chips */}
              <div className="flex items-center gap-2 pl-0">
                {[15, 30, 45, 60, 120].map((minutes) => (
                  <Skeleton key={minutes} className="h-8 flex-1 rounded-md" />
                ))}
              </div>
            </div>
          </div>

          {/* Helper text */}
          <Skeleton className="h-3 w-72" />
        </div>

        {/* Divider */}
        <div className="flex items-end gap-2 mb-6 pt-8">
          <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
        </div>

        {/* Category Section */}
        <div className="space-y-5">
          <div className="space-y-1">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-end gap-2 mb-6 pt-4">
        <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
      </div>

      {/* Locations Section */}
      <div className="space-y-5">
        <div className="space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="space-y-5">
          {/* Location pills */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface"
              >
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <div className="flex flex-col text-left">
                  <Skeleton className="h-4 w-24 mb-0.5" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-end gap-2 mb-6 pt-0">
        <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
      </div>

      {/* Team Members Section */}
      <div className="space-y-5">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="space-y-5">
          {/* Team member pills */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface"
              >
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <div className="flex flex-col text-left">
                  <Skeleton className="h-4 w-28 mb-0.5" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
    </div>
  );
};

export default ServiceFormSkeleton;

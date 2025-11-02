import React from "react";
import { Skeleton } from "../../../shared/components/ui/skeleton";

const WizardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 cursor-default">
      <div className="grid gap-6">
        <div className="space-y-2">
          <Skeleton className="h-[14px] w-32" />
          <Skeleton className="h-10 w-full" />
          <div className="h-5" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-[14px] w-24" />
          <Skeleton className="h-[12px] w-64" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-[14px] w-40" />
            <Skeleton className="h-[12px] w-12" />
          </div>
          <Skeleton className="h-[72px] w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-[14px] w-28" />
            <Skeleton className="h-10 w-full" />
            <div className="h-5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-[14px] w-32" />
            <Skeleton className="h-10 w-full" />
            <div className="h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardSkeleton;


import type { FC } from "react";
import { Skeleton } from "../../../shared/components/ui/skeleton.tsx";

const CARD_COUNT = 5;

const AppointmentCardSkeleton: FC = () => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
    {/* Color accent bar */}
    <Skeleton className="h-10 w-1 rounded-full flex-shrink-0" />

    {/* Content */}
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="h-3.5 w-16 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-14 rounded" />
      </div>
    </div>

    {/* Staff avatar */}
    <Skeleton className="size-7 rounded-full flex-shrink-0" />
  </div>
);

export const AppointmentListSkeleton: FC = () => (
  <div className="skeleton-delayed-reveal space-y-3">
    {/* Count pills placeholder */}
    <div className="flex items-center justify-end gap-2 px-1">
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>

    {/* Cards */}
    {Array.from({ length: CARD_COUNT }, (_, i) => (
      <AppointmentCardSkeleton key={i} />
    ))}
  </div>
);

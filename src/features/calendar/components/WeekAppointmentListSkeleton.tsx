import type { FC } from "react";
import { Skeleton } from "../../../shared/components/ui/skeleton.tsx";

const DAY_COUNT = 7;
const CARDS_PER_DAY = [3, 2, 3, 1, 2, 3, 2];

const CardSkeleton: FC = () => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
    <Skeleton className="h-10 w-1 rounded-full flex-shrink-0" />
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
    <Skeleton className="size-7 rounded-full flex-shrink-0" />
  </div>
);

export const WeekAppointmentListSkeleton: FC = () => (
  <div className="p-4 pt-0 space-y-6">
    {Array.from({ length: DAY_COUNT }, (_, dayIdx) => (
      <section key={dayIdx} className="space-y-2">
        {/* Day header */}
        <div className="flex items-center justify-between gap-2 px-1 py-1.5">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Cards */}
        <div className="space-y-2">
          {Array.from({ length: CARDS_PER_DAY[dayIdx] }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
    ))}
  </div>
);

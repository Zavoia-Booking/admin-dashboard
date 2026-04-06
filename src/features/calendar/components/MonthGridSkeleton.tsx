import type { FC } from "react";
import { Skeleton } from "../../../shared/components/ui/skeleton.tsx";
import { dayNames } from "../utils.ts";

const ROWS = 5;
const COLS = 7;

export const MonthGridSkeleton: FC = () => (
  <div className="p-4 pb-0">
    {/* Day-of-week header */}
    <div className="grid grid-cols-7 gap-px mb-1">
      {dayNames.map((day) => (
        <div key={day} className="text-center text-xs font-medium text-foreground-2 py-2 cursor-default">
          {day}
        </div>
      ))}
    </div>

    {/* Calendar grid */}
    <div
      className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden"
      style={{
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        height: 'calc(100dvh - 168px)',
      }}
    >
      {Array.from({ length: ROWS * COLS }, (_, i) => {
        const showPreviews = i % 3 !== 2;
        return (
          <div
            key={i}
            className="relative bg-background p-2 space-y-1.5"
          >
            {/* Day number */}
            <div className="flex items-center justify-between mb-1">
              <Skeleton className="size-6 rounded-full" />
              {i % 4 === 0 && <Skeleton className="h-3 w-5 rounded" />}
            </div>

            {/* Appointment previews */}
            {showPreviews && (
              <>
                <Skeleton className="h-4 w-full rounded-md" />
                {i % 2 === 0 && <Skeleton className="h-4 w-3/4 rounded-md" />}
                {i % 5 === 0 && <Skeleton className="h-4 w-5/6 rounded-md" />}
              </>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

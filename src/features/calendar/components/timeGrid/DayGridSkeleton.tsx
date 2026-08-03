import type { FC } from "react";
import { Skeleton } from "../../../../shared/components/ui/skeleton.tsx";
import {
  GRID_HEIGHT_PER_HOUR,
  GUTTER_WIDTH,
} from "./constants.ts";

const SKELETON_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 AM – 11 PM (full 24h)
const SLOT_HEIGHT = GRID_HEIGHT_PER_HOUR / 4; // 15-min slots → 40px
const COLUMN_COUNT = 4;

/** Fake appointment block positions (columnIndex, startSlot, spanSlots) */
const FAKE_BLOCKS: [number, number, number][] = [
  [0, 4, 3],
  [1, 8, 2],
  [2, 2, 4],
  [3, 10, 2],
  [0, 12, 2],
  [1, 14, 3],
  [2, 7, 2],
];

export const DayGridSkeleton: FC = () => {
  const totalSlots = SKELETON_HOURS.length * 4;

  return (
    <div className="skeleton-delayed-reveal relative">
      <div className="flex">
        {/* Time gutter */}
        <div
          className="relative flex flex-col items-end pr-2 select-none flex-shrink-0"
          style={{ width: GUTTER_WIDTH }}
        >
          {/* Header spacer matching h-8 staff header */}
          <div className="h-8 flex-shrink-0 sticky top-0 z-30 bg-white dark:bg-surface" />
          {SKELETON_HOURS.map((hour) =>
            Array.from({ length: 4 }, (_, q) => (
              <div
                key={`${hour}-${q}`}
                className="flex items-start justify-end"
                style={{ height: SLOT_HEIGHT }}
              >
                {q === 0 && (
                  <Skeleton className="h-3 w-8 rounded" />
                )}
              </div>
            )),
          )}
        </div>

        {/* Staff columns */}
        {Array.from({ length: COLUMN_COUNT }, (_, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-1 flex-col border-l border-border"
            style={{ minWidth: 140 }}
          >
            {/* Staff header */}
            <div className="flex items-center justify-center gap-1.5 border-b border-border h-8 px-1 sticky top-0 z-30 bg-white dark:bg-surface">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>

            {/* Slot rows with appointment placeholders */}
            <div className="relative">
              {Array.from({ length: totalSlots }, (_, slotIdx) => (
                <div
                  key={slotIdx}
                  className={`${slotIdx % 4 === 3 ? "border-b border-border" : ""}`}
                  style={{ height: SLOT_HEIGHT }}
                />
              ))}

              {/* Fake appointment blocks */}
              {FAKE_BLOCKS.filter(([ci]) => ci === colIdx).map(
                ([, start, span], i) => (
                  <div
                    key={i}
                    className="absolute left-1 right-1"
                    style={{
                      top: start * SLOT_HEIGHT,
                      height: span * SLOT_HEIGHT - 2,
                    }}
                  >
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

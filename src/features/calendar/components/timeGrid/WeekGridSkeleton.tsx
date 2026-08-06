import type { FC } from "react";
import { Skeleton } from "../../../../shared/components/ui/skeleton.tsx";
import { GRID_HEIGHT_PER_HOUR, GUTTER_WIDTH } from "./constants.ts";

const SKELETON_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 AM – 11 PM (full 24h)
const SLOT_HEIGHT = GRID_HEIGHT_PER_HOUR / 4; // 15-min slots → 40px
const DAY_COUNT = 7;

/** Fake appointment block positions per day column (dayIndex, startSlot, spanSlots) */
const FAKE_BLOCKS: [number, number, number][] = [
  [0, 4, 3],
  [1, 6, 2],
  [1, 12, 3],
  [2, 3, 4],
  [3, 8, 2],
  [3, 14, 2],
  [4, 5, 3],
  [5, 10, 2],
  [6, 2, 2],
  [6, 8, 3],
];

export const WeekGridSkeleton: FC = () => {
  const totalSlots = SKELETON_HOURS.length * 4;

  return (
    <div className="skeleton-delayed-reveal relative flex flex-col">
      {/* WeekDayStrip skeleton */}
      <div className="flex flex-shrink-0 pb-4 px-4 pt-2 gap-2 sticky top-0 z-30 bg-white dark:bg-surface">
        <div style={{ width: GUTTER_WIDTH }} className="flex-shrink-0" />
        <div className="flex-1 flex gap-2">
          {Array.from({ length: DAY_COUNT }, (_, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 rounded-lg border border-border p-2"
            >
              <Skeleton className="h-3 w-8 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Grid body */}
      <div>
        <div className="flex" style={{ minWidth: DAY_COUNT * 100 + GUTTER_WIDTH }}>
          {/* Time gutter */}
          <div
            className="relative flex flex-col items-end pr-2 select-none flex-shrink-0"
            style={{ width: GUTTER_WIDTH }}
          >
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

          {/* Day columns */}
          {Array.from({ length: DAY_COUNT }, (_, dayIdx) => (
            <div
              key={dayIdx}
              className="flex-1 min-w-[100px] border-l border-border"
            >
              <div className="relative mx-1">
                {Array.from({ length: totalSlots }, (_, slotIdx) => (
                  <div
                    key={slotIdx}
                    className={`${slotIdx % 4 === 3 ? "border-b border-border" : ""}`}
                    style={{ height: SLOT_HEIGHT }}
                  />
                ))}

                {/* Fake appointment blocks */}
                {FAKE_BLOCKS.filter(([di]) => di === dayIdx).map(
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
    </div>
  );
};

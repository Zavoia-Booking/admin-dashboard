import { type FC } from "react";

/** Green corner checkmark used on selected "All staff" / status filter pills. */
export const CalendarFilterPillCheckmark: FC = () => (
  <div
    className="absolute -right-0 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-green-400 shadow-sm dark:bg-success"
    aria-hidden
  >
    <svg
      className="h-3 w-3 text-foreground-inverse"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

import type { FC } from 'react';
import { Badge } from '../../../shared/components/ui/badge.tsx';
import { cn } from '../../../shared/lib/utils.ts';

const countPillBase =
  'text-[11px] font-medium px-2 py-0.5 h-6 rounded-full gap-1.5 border shadow-none inline-flex items-center max-w-full';

/**
 * Appointment + block counts in the list-view day/week headers (matches calendar chip styling: dot + rounded pill).
 */
export const CalendarListCountPills: FC<{
  apptCount: number;
  blockCount: number;
  className?: string;
}> = ({ apptCount, blockCount, className }) => {
  if (apptCount <= 0 && blockCount <= 0) return null;
  return (
    <div
      className={cn('flex flex-wrap items-center justify-end gap-1.5', className)}
      role="status"
      aria-label={[
        apptCount > 0 && `${apptCount} appointment${apptCount !== 1 ? 's' : ''}`,
        blockCount > 0 && `${blockCount} block${blockCount !== 1 ? 's' : ''}`,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      {apptCount > 0 ? (
        <Badge
          variant="outline"
          className={cn(
            countPillBase,
            'border-violet-200 bg-violet-50/90 text-violet-900 dark:border-violet-800 dark:bg-violet-950/45 dark:text-violet-200',
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" aria-hidden />
          <span className="truncate">
            {apptCount} appointment{apptCount !== 1 ? 's' : ''}
          </span>
        </Badge>
      ) : null}
      {blockCount > 0 ? (
        <Badge
          variant="outline"
          className={cn(
            countPillBase,
            'border-border bg-muted/60 text-foreground-1',
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
          <span className="truncate">
            {blockCount} block{blockCount !== 1 ? 's' : ''}
          </span>
        </Badge>
      ) : null}
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';

interface SeatBarProps {
  paid: number;
  total: number;
}

export const SeatBar: React.FC<SeatBarProps> = ({ paid, total }) => {
  const { t } = useTranslation();
  const overBy = Math.max(0, total - paid);
  const denom = Math.max(total, paid, 1);
  const paidPct = (paid / denom) * 100;
  const overPct = 100 - paidPct;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-[11.5px] tabular-nums text-foreground-3">
        <span>
          <span className="font-semibold text-foreground-1">{total}</span>{' '}
          {t('teamMembers:seatOverflow.membersWord', { count: total })} ·{' '}
          <span className="text-foreground-2">
            {t('teamMembers:seatOverflow.seatBarPaid', { count: paid, paidSeats: paid })}
          </span>
        </span>
        {overBy > 0 && (
          <span className="font-semibold text-error">
            {t('teamMembers:seatOverflow.seatBarOverShort', { count: overBy })}
          </span>
        )}
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <span
          className="h-full bg-foreground/90 transition-[width] duration-300"
          style={{ width: `${paidPct}%` }}
          aria-hidden
        />
        {overPct > 0 && (
          <span
            className="h-full bg-error/40 transition-[width] duration-300"
            style={{ width: `${overPct}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
};

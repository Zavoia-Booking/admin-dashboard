import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../shared/components/ui/button';
import { cn } from '../../../../shared/lib/utils';
import type { OffboardPreviewAppointment } from '../../api';
import type { EligibleStaffMap } from './eligibility';
import type { Decision } from './useDecisions';

interface BulkActionsBarProps {
  undecidedAppts: OffboardPreviewAppointment[];
  selectedUserId: number | null;
  eligibleStaffMap: EligibleStaffMap;
  onApplyMany: (ids: number[], decision: Decision) => void;
  onOpenCalendar?: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  undecidedAppts,
  onApplyMany,
  onOpenCalendar,
}) => {
  const { t } = useTranslation();

  // Marks only the appointments still without a decision; reassignments stay as they are.
  const cancelRemaining = () => {
    onApplyMany(
      undecidedAppts.map((a) => a.id),
      { kind: 'cancel' },
    );
  };

  const cancelButton = undecidedAppts.length > 0 && (
    <Button
      variant="ghost"
      size="sm"
      rounded="full"
      onClick={cancelRemaining}
      className={cn(
        '!min-h-0 shrink-0 border border-error/60 px-3.5 text-xs text-destructive hover:bg-error-bg/40 hover:text-destructive sm:!h-8',
        onOpenCalendar ? '!h-11' : '!h-9',
      )}
    >
      {t('teamMembers:seatOverflow.bulkCancel', { count: undecidedAppts.length })}
    </Button>
  );

  if (!onOpenCalendar) return cancelButton || null;

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <Button
        type="button"
        variant="outline"
        size="sm"
        rounded="full"
        onClick={onOpenCalendar}
        className="!h-11 !min-h-0 shrink-0 px-3.5 text-xs sm:!h-8"
      >
        {t('assignments:page.appointmentsInUse.goToCalendar')}
      </Button>
      {cancelButton}
    </div>
  );
};

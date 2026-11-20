import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../shared/components/ui/button';
import type { OffboardPreviewAppointment } from '../../api';
import type { EligibleStaffMap } from './eligibility';
import type { Decision } from './useDecisions';

interface BulkActionsBarProps {
  undecidedAppts: OffboardPreviewAppointment[];
  selectedUserId: number | null;
  eligibleStaffMap: EligibleStaffMap;
  onApplyMany: (ids: number[], decision: Decision) => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  undecidedAppts,
  onApplyMany,
}) => {
  const { t } = useTranslation();

  if (undecidedAppts.length === 0) return null;

  // Marks only the appointments still without a decision; reassignments stay as they are.
  const cancelRemaining = () => {
    onApplyMany(
      undecidedAppts.map((a) => a.id),
      { kind: 'cancel' },
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      rounded="full"
      onClick={cancelRemaining}
      className="!h-9 !min-h-0 shrink-0 border border-error/60 px-3.5 text-xs text-destructive hover:bg-error-bg/40 hover:text-destructive sm:!h-8"
    >
      {t('teamMembers:seatOverflow.bulkCancel', { count: undecidedAppts.length })}
    </Button>
  );
};

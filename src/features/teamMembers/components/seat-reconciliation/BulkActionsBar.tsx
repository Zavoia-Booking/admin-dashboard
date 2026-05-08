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

  const cancelAll = () => {
    onApplyMany(
      undecidedAppts.map((a) => a.id),
      { kind: 'cancel' },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        rounded="full"
        onClick={cancelAll}
        className="!h-7 !min-h-0 border border-error/60 px-3 text-xs text-destructive hover:bg-error-bg/40 hover:text-destructive"
      >
        {t('teamMembers:seatOverflow.bulkCancel')}
      </Button>
    </div>
  );
};

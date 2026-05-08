import React from 'react';
import { useTranslation } from 'react-i18next';
import { SeatBar } from './SeatBar';
import { MemberRow } from './MemberRow';
import { DashedDivider } from '../../../../shared/components/common/DashedDivider';
import type { TeamMember } from '../../../../shared/types/team-member';

interface MembersAsideProps {
  paid: number;
  total: number;
  overBy: number;
  selectedUserId: number | null;
  onSelect: (userId: number) => void;
  ownerId?: number;
  candidateMembers: TeamMember[]; // active TEAM_MEMBERs (already filtered)
  ownerMember?: TeamMember | null;
}

export const MembersAside: React.FC<MembersAsideProps> = ({
  paid,
  total,
  overBy,
  selectedUserId,
  onSelect,
  ownerId,
  candidateMembers,
  ownerMember,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-muted/30 dark:bg-background/50">
      <div className="px-4 pt-4 pb-3">
        <div className="text-sm font-semibold text-foreground-1">
          {t('teamMembers:seatOverflow.pickToRemove', { count: overBy })}
        </div>
        <div className="mt-0.5 text-xs text-foreground-3">
          {t('teamMembers:seatOverflow.selectMembersHint')}
        </div>
      </div>

      <div className="px-4 pb-3">
        <SeatBar paid={paid} total={total} />
      </div>

      <DashedDivider marginTop="mt-0" paddingTop="pt-0" className="mb-2" dashPattern="1 1" />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4">
        {ownerMember && (
          <MemberRow
            member={ownerMember}
            selected={false}
            locked
            isYou={ownerId === ownerMember.id}
          />
        )}
        {candidateMembers.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            selected={selectedUserId === m.id}
            onToggle={() => onSelect(m.id)}
          />
        ))}
      </div>
    </aside>
  );
};

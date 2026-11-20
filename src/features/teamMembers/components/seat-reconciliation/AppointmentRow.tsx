import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronDown, Lock, XCircle } from 'lucide-react';
import { PersonAvatar } from '../../../../shared/components/common/PersonAvatar';
import { Button } from '../../../../shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../shared/components/ui/popover';
import { Command, CommandItem, CommandList } from '../../../../shared/components/ui/command';
import { cn } from '../../../../shared/lib/utils';
import type { OffboardPreviewAppointment, EligibleStaffMember } from '../../api';
import type { Decision } from './useDecisions';

interface CurrentStaff {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
}

interface AppointmentRowProps {
  appt: OffboardPreviewAppointment;
  decision: Decision | undefined;
  eligibleStaff: EligibleStaffMember[];
  currentStaff: CurrentStaff | null;
  isOrphan: boolean;
  popoverOpen: boolean;
  onPopoverChange: (open: boolean) => void;
  onPick: (decision: Decision | null) => void;
  /** Phones: "Reassign" opens the shared picker sheet instead of a popover. */
  onOpenPicker?: () => void;
}

export const formatApptTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

const computeDurationMin = (startIso: string, endIso?: string) => {
  if (!endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round(ms / 60000);
};

export const AppointmentRow: React.FC<AppointmentRowProps> = ({
  appt,
  decision,
  eligibleStaff,
  currentStaff,
  isOrphan,
  popoverOpen,
  onPopoverChange,
  onPick,
  onOpenPicker,
}) => {
  const { t } = useTranslation();
  const hasNoEligibleStaff = eligibleStaff.length === 0;
  const isCancelled = !isOrphan && decision?.kind === 'cancel';
  const reassignedTo =
    !isOrphan && decision?.kind === 'reassign'
      ? eligibleStaff.find((s) => s.userId === decision.toUserId) ?? null
      : null;

  const time = formatApptTime(appt.scheduledAt);
  const durationMin = computeDurationMin(appt.scheduledAt, appt.endsAt);
  const customerName = appt.customer
    ? `${appt.customer.firstName ?? ''} ${appt.customer.lastName ?? ''}`.trim()
    : '';
  const serviceName = appt.service?.name ?? '';

  const reassignButton = (
    <Button
      variant="outline"
      size="sm"
      rounded="full"
      disabled={hasNoEligibleStaff}
      title={hasNoEligibleStaff ? t('teamMembers:seatOverflow.noEligibleStaff') : undefined}
      onClick={onOpenPicker}
      className="!h-10 !min-h-0 w-full px-3 text-[13px] leading-none sm:!h-8 sm:w-auto sm:text-xs"
    >
      {t('teamMembers:seatOverflow.reassignAction')}
      <ChevronDown className="ml-1 size-3.5 opacity-70" aria-hidden />
    </Button>
  );

  let decisionArea: React.ReactNode;
  if (isOrphan) {
    // Desktop only; on phones the lock beside the name and the section notice say it.
    decisionArea = (
      <p
        className="flex items-center justify-end gap-1.5 text-xs font-medium text-error"
        title={t('teamMembers:seatOverflow.orphanRowTooltip')}
      >
        <Lock className="size-3.5 shrink-0" aria-hidden />
        {t('teamMembers:seatOverflow.willBeCancelled')}
      </p>
    );
  } else if (isCancelled || reassignedTo) {
    decisionArea = (
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {reassignedTo ? (
          <p className="flex min-w-0 items-center gap-1.5 text-[13px] sm:text-xs">
            <ArrowRight className="size-3.5 shrink-0 text-foreground-3" aria-hidden />
            <span className="sr-only">{t('teamMembers:seatOverflow.reassignedTo')}</span>
            <PersonAvatar
              id={reassignedTo.userId}
              firstName={reassignedTo.firstName}
              lastName={reassignedTo.lastName}
              profileImage={reassignedTo.profileImage}
              className="size-5"
              initialsClassName="text-[8px] font-semibold"
            />
            <span className="truncate font-medium text-foreground-1">
              {reassignedTo.firstName} {reassignedTo.lastName}
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-error sm:text-xs">
            <XCircle className="size-3.5 shrink-0" aria-hidden />
            {t('teamMembers:seatOverflow.willBeCancelled')}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          rounded="full"
          onClick={() => onPick(null)}
          className="!h-9 !min-h-0 shrink-0 px-3 text-[13px] text-foreground-2 sm:!h-8 sm:text-xs"
        >
          {t('teamMembers:seatOverflow.changeDecision')}
        </Button>
      </div>
    );
  } else {
    decisionArea = (
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
        {onOpenPicker ? (
          reassignButton
        ) : (
          <Popover open={popoverOpen} onOpenChange={onPopoverChange} modal>
            <PopoverTrigger asChild>{reassignButton}</PopoverTrigger>
            <PopoverContent className="z-[230] w-[260px] p-0" side="bottom" align="end" sideOffset={4}>
              <Command shouldFilter={false}>
                <CommandList>
                  {eligibleStaff.map((staff) => (
                    <CommandItem
                      key={staff.userId}
                      value={String(staff.userId)}
                      onSelect={() => onPick({ kind: 'reassign', toUserId: staff.userId })}
                      className="h-9 cursor-pointer gap-2"
                    >
                      <PersonAvatar
                        id={staff.userId}
                        firstName={staff.firstName}
                        lastName={staff.lastName}
                        profileImage={staff.profileImage}
                        className="size-6"
                        initialsClassName="text-[9px] font-semibold"
                      />
                      <span className="truncate">
                        {staff.firstName} {staff.lastName}
                      </span>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <Button
          variant="outline"
          size="sm"
          rounded="full"
          onClick={() => onPick({ kind: 'cancel' })}
          className="!h-10 !min-h-0 border-error/40 px-3 text-[13px] leading-none text-destructive hover:bg-error-bg/40 hover:text-destructive sm:!h-8 sm:text-xs"
        >
          {t('teamMembers:seatOverflow.cancelAction')}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3 sm:flex sm:items-center sm:gap-4 sm:px-4">
      {/* When and who */}
      <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
        <div className="w-12 shrink-0 tabular-nums">
          <div className="text-[15px] font-semibold leading-tight text-foreground-1">{time}</div>
          {durationMin != null && (
            <div className="mt-0.5 text-[11px] leading-tight text-foreground-3">
              {t('teamMembers:seatOverflow.durationShort', { minutes: durationMin })}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground-1">
            {customerName || serviceName || t('teamMembers:seatOverflow.unknownService')}
          </div>
          {customerName && serviceName && (
            <div className="truncate text-xs text-foreground-3">{serviceName}</div>
          )}
        </div>
        {isOrphan && (
          <span className="mt-0.5 shrink-0 text-foreground-3 sm:hidden">
            <Lock className="size-4" aria-hidden />
            <span className="sr-only">{t('teamMembers:seatOverflow.willBeCancelled')}</span>
          </span>
        )}
      </div>

      {/* Whose appointment it is now (desktop) */}
      <div className="hidden w-32 shrink-0 items-center gap-2 sm:flex">
        {currentStaff ? (
          <>
            <PersonAvatar
              id={currentStaff.userId}
              firstName={currentStaff.firstName}
              lastName={currentStaff.lastName}
              profileImage={currentStaff.profileImage}
              className="size-7"
              initialsClassName="text-[10px] font-medium"
            />
            <span className="truncate text-sm text-foreground-2">{currentStaff.firstName}</span>
          </>
        ) : null}
      </div>

      {/* What happens to it */}
      <div className={cn('sm:w-[248px] sm:shrink-0', isOrphan ? 'hidden sm:block' : 'mt-3 sm:mt-0')}>
        {decisionArea}
      </div>
    </div>
  );
};

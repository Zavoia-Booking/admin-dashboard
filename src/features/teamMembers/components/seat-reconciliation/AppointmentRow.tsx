import React from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, ChevronDown, MoreHorizontal, Check, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../shared/components/ui/avatar';
import { Button } from '../../../../shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../shared/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../shared/components/ui/dropdown-menu';
import { Command, CommandItem, CommandList } from '../../../../shared/components/ui/command';
import { getAvatarBgColor } from '../../../setupWizard/components/StepTeam';
import { cn } from '../../../../shared/lib/utils';
import type { OffboardPreviewAppointment, EligibleStaffMember } from '../../api';
import type { Decision } from './useDecisions';

interface CurrentStaff {
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
}

const formatTime = (iso: string) =>
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

const initialsOf = (first?: string | null, last?: string | null) =>
  `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}`;

export const AppointmentRow: React.FC<AppointmentRowProps> = ({
  appt,
  decision,
  eligibleStaff,
  currentStaff,
  isOrphan,
  popoverOpen,
  onPopoverChange,
  onPick,
}) => {
  const { t } = useTranslation();
  const hasNoEligibleStaff = eligibleStaff.length === 0;
  const isCancelled = decision?.kind === 'cancel';
  const isReassigned = decision?.kind === 'reassign';
  const reassignedTo = isReassigned
    ? eligibleStaff.find((s) => s.userId === decision.toUserId)
    : null;

  const time = formatTime(appt.scheduledAt);
  const durationMin = computeDurationMin(appt.scheduledAt, appt.endsAt);

  const customerName = appt.customer
    ? `${appt.customer.firstName ?? ''} ${appt.customer.lastName ?? ''}`.trim()
    : '';
  const serviceName = appt.service?.name ?? '';

  // Avatar+name reflects current decision: reassigned target if chosen, else original staff.
  const displayedStaff = reassignedTo
    ? {
        firstName: reassignedTo.firstName,
        lastName: reassignedTo.lastName,
        email: `${reassignedTo.userId}`,
        profileImage: reassignedTo.profileImage,
      }
    : currentStaff;

  return (
    <div className="grid items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,1fr)_auto]">
      {/* Customer + service (+ mobile meta line) */}
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground-1">
          {customerName || t('teamMembers:seatOverflow.unknownService')}
        </div>
        {serviceName && (
          <div className="truncate text-xs text-foreground-3">{serviceName}</div>
        )}
        {/* Mobile-only meta row: time + reassigned staff (cancelled state is rendered as the right-side pill) */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:hidden">
          <span className="inline-flex items-baseline gap-1 tabular-nums text-foreground-2">
            <span className="font-semibold text-foreground-1">{time}</span>
            {durationMin != null && (
              <span className="text-foreground-3">({durationMin}m)</span>
            )}
          </span>
          {reassignedTo && (
            <span className="inline-flex items-center gap-1 text-foreground-2">
              <span aria-hidden className="text-foreground-3">→</span>
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage
                  src={reassignedTo.profileImage || undefined}
                  alt={`${reassignedTo.firstName} ${reassignedTo.lastName}`}
                />
                <AvatarFallback
                  className="text-[8px] font-semibold leading-none"
                  style={{ backgroundColor: getAvatarBgColor(`${reassignedTo.userId}`) }}
                >
                  {initialsOf(reassignedTo.firstName, reassignedTo.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium text-foreground-1">
                {reassignedTo.firstName}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Time + duration */}
      <div className="hidden items-baseline justify-center gap-1.5 text-sm tabular-nums text-foreground-1 sm:flex">
        <span className="font-semibold">{time}</span>
        {durationMin != null && (
          <span className="text-xs text-foreground-3">({durationMin}m)</span>
        )}
      </div>

      {/* Current/reassigned staff display */}
      <div className="hidden min-w-0 items-center justify-center gap-2 sm:flex">
        {displayedStaff ? (
          <>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage
                src={displayedStaff.profileImage || undefined}
                alt={`${displayedStaff.firstName} ${displayedStaff.lastName}`}
              />
              <AvatarFallback
                className="text-[10px] font-medium"
                style={{ backgroundColor: getAvatarBgColor(displayedStaff.email) }}
              >
                {initialsOf(displayedStaff.firstName, displayedStaff.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-foreground-1">
              {displayedStaff.firstName}
            </span>
          </>
        ) : (
          <span className="text-xs text-foreground-3">—</span>
        )}
      </div>

      {/* Right-side actions */}
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        {isOrphan ? (
          <span
            className="inline-flex h-8 min-h-0 items-center gap-1.5 rounded-full border border-error/40 bg-error-bg/40 px-3 text-xs font-medium text-error leading-none dark:bg-error-bg/60"
            title={t('teamMembers:seatOverflow.orphanRowTooltip')}
          >
            <Lock className="h-3.5 w-3.5" />
            {t('teamMembers:seatOverflow.cancelAppointment')}
          </span>
        ) : isCancelled ? (
          <Button
            variant="ghost"
            size="sm"
            rounded="full"
            onClick={() => onPick(null)}
            className="!h-8 !min-h-0 border border-error/40 bg-error-bg/30 px-3 text-xs leading-none text-error hover:bg-error-bg/50 hover:text-error dark:bg-error-bg/50 dark:hover:bg-error-bg/70"
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            {t('teamMembers:seatOverflow.cancelAppointment')}
          </Button>
        ) : (
          <>
            <Popover open={popoverOpen} onOpenChange={onPopoverChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  rounded="full"
                  disabled={hasNoEligibleStaff}
                  className="!h-8 !min-h-0 px-3 text-xs leading-none"
                >
                  {t('teamMembers:seatOverflow.reassignAction')}
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[240px] p-0 z-[230]"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <Command shouldFilter={false}>
                  <CommandList>
                    {eligibleStaff.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-foreground-3">
                        {t('teamMembers:seatOverflow.noEligibleStaff')}
                      </div>
                    ) : (
                      eligibleStaff.map((staff) => (
                        <CommandItem
                          key={staff.userId}
                          value={`${staff.firstName} ${staff.lastName}`}
                          onSelect={() => {
                            onPick({ kind: 'reassign', toUserId: staff.userId });
                          }}
                          className="h-8 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              isReassigned && decision.toUserId === staff.userId
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          <Avatar className="size-5 shrink-0 mr-1.5">
                            <AvatarImage
                              src={staff.profileImage || undefined}
                              alt={`${staff.firstName} ${staff.lastName}`}
                            />
                            <AvatarFallback
                              className="text-[8px] font-semibold leading-none text-foreground-1"
                              style={{
                                backgroundColor: getAvatarBgColor(`${staff.userId}`),
                              }}
                            >
                              {initialsOf(staff.firstName, staff.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          {staff.firstName} {staff.lastName}
                        </CommandItem>
                      ))
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  rounded="full"
                  className="!h-8 !min-h-0 w-8 px-0 text-foreground-3"
                  aria-label={t('teamMembers:seatOverflow.moreActions')}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[230] w-44">
                <DropdownMenuItem
                  onSelect={() => onPick({ kind: 'cancel' })}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('teamMembers:seatOverflow.cancelAppointment')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
};

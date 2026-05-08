import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../shared/components/ui/avatar';
import { getAvatarBgColor } from '../../../setupWizard/components/StepTeam';
import { UserRole } from '../../../../shared/types/auth';
import { cn } from '../../../../shared/lib/utils';
import type { TeamMember } from '../../../../shared/types/team-member';

interface MemberRowProps {
  member: TeamMember;
  selected: boolean;
  locked?: boolean;
  isYou?: boolean;
  onToggle?: () => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  selected,
  locked = false,
  isYou = false,
  onToggle,
}) => {
  const { t } = useTranslation();
  const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
  const name = fullName || member.email;
  const initials = fullName
    ? `${(member.firstName?.[0] ?? '').toUpperCase()}${(member.lastName?.[0] ?? '').toUpperCase()}`
    : (member.email?.[0] ?? '?').toUpperCase();

  const interactive = !locked && !!onToggle;
  const isOwner = member.role === UserRole.OWNER;

  return (
    <button
      type="button"
      onClick={interactive ? onToggle : undefined}
      disabled={!interactive}
      aria-pressed={selected}
      aria-label={name}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg border border-border/60 bg-surface px-3 py-2 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
        interactive && 'cursor-pointer hover:bg-surface-hover',
        !interactive && 'cursor-not-allowed opacity-60',
        selected && 'shadow-sm dark:bg-surface-hover',
      )}
    >
      {/* Selected indicator: red left bar */}
      {selected && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-error"
          aria-hidden
        />
      )}

      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={member.profileImage || undefined} alt={name} />
          <AvatarFallback
            className="text-sm font-medium"
            style={{ backgroundColor: getAvatarBgColor(member.email) }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {selected && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-surface bg-error text-foreground-inverse"
            aria-hidden
          >
            <Check className="size-2.5" strokeWidth={3.5} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground-1">{name}</span>
          {isYou && (
            <span className="text-[11.5px] font-normal text-foreground-3">
              {t('teamMembers:seatOverflow.memberYou')}
            </span>
          )}
        </div>
        {isOwner && (
          <div className="truncate text-[11.5px] text-foreground-3">
            {t('teamMembers:seatOverflow.roleOwner')}
          </div>
        )}
      </div>

      {locked && <Lock className="size-4 shrink-0 text-foreground-3" aria-hidden />}
    </button>
  );
};

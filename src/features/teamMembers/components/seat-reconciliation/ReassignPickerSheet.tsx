import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '../../../../shared/components/ui/drawer';
import { PersonAvatar } from '../../../../shared/components/common/PersonAvatar';
import type { EligibleStaffMember } from '../../api';

export interface ReassignPickerTarget {
  appointmentId: number;
  /** Start time as shown on the row, e.g. "09:00". */
  time: string;
  /** Day, customer and service, e.g. "Tomorrow · Ana Pop · Haircut". */
  summary: string;
  eligibleStaff: EligibleStaffMember[];
}

interface ReassignPickerSheetProps {
  target: ReassignPickerTarget | null;
  onPick: (appointmentId: number, staffUserId: number) => void;
  onClose: () => void;
}

/** Phone sheet for choosing who takes over one appointment; opens above the appointments sheet. */
export const ReassignPickerSheet: React.FC<ReassignPickerSheetProps> = ({ target, onPick, onClose }) => {
  const { t } = useTranslation();

  // Keep the last target so the content does not empty out while the sheet closes.
  const [shown, setShown] = useState<ReassignPickerTarget | null>(target);
  if (target && target !== shown) setShown(target);

  return (
    <Drawer
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      shouldScaleBackground={false}
    >
      <DrawerContent overlayClassName="z-[230] bg-black/40" className="z-[230] bg-background">
        <div className="shrink-0 px-5 pb-2 pt-3">
          <DrawerTitle className="text-[17px] font-semibold leading-snug text-foreground-1">
            {shown ? t('teamMembers:seatOverflow.reassignPickerTitle', { time: shown.time }) : ''}
          </DrawerTitle>
          <DrawerDescription className="mt-1 truncate text-[13px] leading-snug text-foreground-3">
            {shown?.summary ?? ''}
          </DrawerDescription>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {shown &&
            shown.eligibleStaff.map((staff) => (
              <button
                key={staff.userId}
                type="button"
                onClick={() => onPick(shown.appointmentId, staff.userId)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left transition-colors duration-150 hover:bg-muted active:bg-muted"
              >
                <PersonAvatar
                  id={staff.userId}
                  firstName={staff.firstName}
                  lastName={staff.lastName}
                  profileImage={staff.profileImage}
                  className="size-9"
                  initialsClassName="text-[11px] font-semibold"
                />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground-1">
                  {staff.firstName} {staff.lastName}
                </span>
              </button>
            ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

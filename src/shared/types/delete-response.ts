import type { BlockConflictAppointment } from './calendar';

// Delete response types for resources that may have dependencies
export interface DeleteResponse {
  canDelete: boolean;
  message: string;
  usersCount?: number;
  servicesCount?: number;
  appointmentsCount?: number;
  upcomingAppointmentsCount?: number;
  bundlesCount?: number;
  bundleNames?: string[];
  firstAppointment?: BlockConflictAppointment | null;
  locationsCount?: number;
  teamMembersCount?: number;
  activeUsersCount?: number;
  pendingUsersCount?: number;
  websiteGalleryImagesCount?: number;
}

export type ResourceType = 'location' | 'service' | 'team_member' | 'bundle';

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ResourceType;
  resourceName: string;
  deleteResponse: DeleteResponse | null;
  onConfirm: () => void;
  isLoading?: boolean;
  secondaryActions?: {
    label: string;
    onClick: () => void;
  }[];
  /** Blocked by upcoming appointments: opens the calendar on the soonest one. */
  onGoToCalendar?: (appointment: BlockConflictAppointment) => void;
  /** Timezone for the soonest appointment when it carries none. */
  fallbackTimezone?: string;
  className?: string;
  overlayClassName?: string;
}


// Delete response types for resources that may have dependencies
export interface DeleteResponse {
  canDelete: boolean;
  message: string;
  usersCount?: number;
  servicesCount?: number;
  appointmentsCount?: number;
  locationsCount?: number;
  teamMembersCount?: number;
  activeUsersCount?: number;
  pendingUsersCount?: number;
  isVisibleInMarketplace?: boolean;
}

export type ResourceType = 'location' | 'service' | 'team_member';

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
  className?: string;
  overlayClassName?: string;
}


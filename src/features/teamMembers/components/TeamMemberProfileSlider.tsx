import React, { useState, useEffect } from 'react';
import { Mail, Phone, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { toast } from 'sonner';
import type { TeamMember } from '../../../shared/types/team-member';
import { deleteTeamMemberAction, fetchTeamMemberByIdAction } from '../actions';
import { selectIsDeleting, selectDeleteResponse, selectCurrentTeamMember, selectIsFetchingTeamMember } from '../selectors';
import { DeleteConfirmDialog } from '../../../shared/components/common/DeleteConfirmDialog';
import type { DeleteResponse } from '../../../shared/types/delete-response';

interface TeamMemberProfileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  teamMember: TeamMember;
  onUpdate: (data: Partial<TeamMember>) => void;
  onDelete: (id: string | number) => void;
  locations: Array<{ id: string; name: string }>;
}

const TeamMemberProfileSlider: React.FC<TeamMemberProfileSliderProps> = ({
  isOpen,
  onClose,
  teamMember,
  onUpdate,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDeleting = useSelector(selectIsDeleting) as boolean;
  const deleteResponseFromState = useSelector(selectDeleteResponse);
  const currentTeamMember = useSelector(selectCurrentTeamMember) as TeamMember | null;
  const isFetchingTeamMember = useSelector(selectIsFetchingTeamMember) as boolean;
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState<DeleteResponse | null>(null);
  const [hasAttemptedDelete, setHasAttemptedDelete] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [localTeamMember, setLocalTeamMember] = useState<TeamMember | null>(null);

  // Fetch team member by ID when slider opens
  useEffect(() => {
    if (isOpen && teamMember?.id) {
      dispatch(fetchTeamMemberByIdAction.request({ id: teamMember.id }));
    }
  }, [isOpen, teamMember?.id, dispatch]);

  // Handle delete response from Redux state
  useEffect(() => {
    if (deleteResponseFromState && hasAttemptedDelete) {
      if (deleteResponseFromState.canDelete === false) {
        // Cannot delete - update dialog to show blocking info
        setDeleteResponse(deleteResponseFromState as DeleteResponse);
      } else {
        // Successfully deleted - close dialog
        setShowDeleteDialog(false);
        setDeleteResponse(null);
        setHasAttemptedDelete(false);
        onClose();
      }
    }
  }, [deleteResponseFromState, hasAttemptedDelete, onClose]);

  // Update local state when currentTeamMember from Redux changes
  useEffect(() => {
    if (currentTeamMember) {
      setLocalTeamMember({ ...currentTeamMember });
    }
  }, [currentTeamMember]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const badgeClasses = status === 'active' 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40' 
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40';
    return (
      <Badge className={badgeClasses}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const handleStatusToggle = () => {
    if (!localTeamMember) return;
    const newStatus = localTeamMember.status === 'active' ? 'inactive' : 'active';
    onUpdate({ status: newStatus });
  };

  const handleDeleteClick = () => {
    // Show confirmation dialog first with optimistic state
    setDeleteResponse({
      canDelete: true,
      message: '',
    });
    setShowDeleteDialog(true);
    setHasAttemptedDelete(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteResponse?.canDelete || !displayTeamMember) return;
    // User confirmed - now make the backend call
    setHasAttemptedDelete(true);
    dispatch(deleteTeamMemberAction.request({ id: displayTeamMember.id }));
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setShowDeleteDialog(false);
      setDeleteResponse(null);
      setHasAttemptedDelete(false);
    }
  };

  // Use localTeamMember (from fetched data) or fallback to prop
  const displayTeamMember = localTeamMember || teamMember;

  // Check if we have valid data
  const hasValidData = displayTeamMember && displayTeamMember.firstName && displayTeamMember.lastName;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={hasValidData ? `${displayTeamMember.firstName} ${displayTeamMember.lastName}` : 'Loading...'}
        footer={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (localTeamMember && currentTeamMember) {
                  // Check for any changes
                  const hasLocationChange = localTeamMember.location !== currentTeamMember.location;
                  const hasEmailChange = localTeamMember.email !== currentTeamMember.email;
                  const hasPhoneChange = localTeamMember.phone !== currentTeamMember.phone;
                  const hasServicesChange = JSON.stringify(localTeamMember.services) !== JSON.stringify(currentTeamMember.services);
                  
                  if (hasLocationChange || hasEmailChange || hasPhoneChange || hasServicesChange) {
                    const updates: Partial<TeamMember> = {};
                    if (hasLocationChange) updates.location = localTeamMember.location;
                    if (hasEmailChange) updates.email = localTeamMember.email;
                    if (hasPhoneChange) updates.phone = localTeamMember.phone;
                    if (hasServicesChange) updates.services = localTeamMember.services;
                    onUpdate(updates);
                  }
                }
                toast.success('Team member updated successfully');
                onClose();
              }}
              className="flex-1"
              disabled={isFetchingTeamMember || !hasValidData}
            >
              {isFetchingTeamMember || !hasValidData ? 'Loading...' : 'Update Member'}
            </Button>
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
          {isFetchingTeamMember || !hasValidData ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-8 cursor-default">
            
              {/* Section 1: Profile Summary */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    Profile Information
                  </h3>
                </div>

                <div className="flex items-start gap-4">
                  {/* Avatar with verification badge */}
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                        {displayTeamMember.firstName?.[0] || '?'}{displayTeamMember.lastName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  {/* Name and Role */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-xl font-semibold text-foreground-1">
                          {displayTeamMember.firstName || 'N/A'} {displayTeamMember.lastName || 'N/A'}
                        </h4>
                        <p className="text-sm text-foreground-3 dark:text-foreground-2">
                          {displayTeamMember.role}
                        </p>
                      </div>
                      {getStatusBadge(displayTeamMember.status)}
                    </div>
                  </div>
                </div>
              
              {/* Contact Info */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-foreground-2">
                  <Mail className="h-4 w-4" />
                  <span className="flex-1">{localTeamMember?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground-2">
                  <Phone className="h-4 w-4" />
                  <span className="flex-1">{localTeamMember?.phone}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-end gap-2 mb-6 pt-4">
              <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
            </div>

            {/* Section 2: Assignments */}
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground-1">
                  Assignments
                </h3>
              </div>

              <div className="rounded-lg border border-border dark:border-border-strong bg-surface-2 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground-2 dark:text-foreground-1 leading-relaxed mb-3">
                      All assignments for this team member, including services, locations, custom pricing, and custom working hours, 
                      are managed in the dedicated Assignments section.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate(`/assignments?tab=team_members&userId=${displayTeamMember.id}`);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Go to Assignments
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-end gap-2 mb-6 pt-4">
              <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
            </div>

            {/* Remove Team Member */}
            <div className="space-y-4 rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-foreground-1">
                  Remove Team Member
                </h3>
                <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                  This will remove the team member from your organisation and revoke their access.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isDeleting as boolean}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove from organisation'
                  )}
                </Button>
              </div>
            </div>
            </div>
          )}
        </div>
      </BaseSlider>

      {/* Status Change Confirmation Dialog */}
      {hasValidData && (
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Account Status</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change the status of this account to
                {displayTeamMember.status === 'active' ? 'inactive' : 'active'} ? Your customers will no longer see this team member.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleStatusToggle}
                className={displayTeamMember.status === 'active' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
              >
                Change Status
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      {hasValidData && (
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={handleCloseDialog}
          resourceType="team_member"
          resourceName={`${displayTeamMember.firstName} ${displayTeamMember.lastName}`}
          deleteResponse={deleteResponse}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          className="z-[80]"
          overlayClassName="z-[80]"
          secondaryActions={[
            ...(deleteResponse?.isVisibleInMarketplace
              ? [{
                  label: 'Go to Marketplace',
                  onClick: () => {
                    handleCloseDialog(false);
                    navigate('/marketplace');
                  }
                }]
              : []),
            {
              label: 'Go to Assignments',
              onClick: () => {
                handleCloseDialog(false);
                navigate(`/assignments?tab=team_members&userId=${displayTeamMember.id}`);
              }
            },
          ]}
        />
      )}
    </>
  );
};

export default TeamMemberProfileSlider; 
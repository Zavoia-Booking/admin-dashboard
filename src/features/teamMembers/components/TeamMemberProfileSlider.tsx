import React, { useState, useEffect } from 'react';
import { Mail, Phone, Check, Loader2, Calendar, MapPin, User, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import type { TeamMember, TeamMemberAppointment } from '../../../shared/types/team-member';
import { deleteTeamMemberAction, fetchTeamMemberByIdAction } from '../actions';
import { selectIsDeleting, selectDeleteResponse, selectCurrentTeamMember, selectIsFetchingTeamMember } from '../selectors';
import { DeleteConfirmDialog } from '../../../shared/components/common/DeleteConfirmDialog';
import { AssignmentsCard } from '../../../shared/components/common/AssignmentsCard';
import type { DeleteResponse } from '../../../shared/types/delete-response';
import { format } from 'date-fns';

interface TeamMemberProfileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  teamMember: TeamMember;
}

const TeamMemberProfileSlider: React.FC<TeamMemberProfileSliderProps> = ({
  isOpen,
  onClose,
  teamMember,
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

  const getAppointmentStatusBadge = (status: string) => {
    const badgeClasses = status === 'confirmed'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
      : status === 'pending'
      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900/40';
    return (
      <Badge className={badgeClasses}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAppointmentTime = (scheduledAt: string, endsAt: string) => {
    const start = new Date(scheduledAt);
    const end = new Date(endsAt);
    return `${format(start, 'MMM d, yyyy')} · ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
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

                  {/* Name and status */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col gap-2">
                        <div>
                          <h4 className="text-xl font-semibold text-foreground-1">
                            {displayTeamMember.firstName || 'N/A'} {displayTeamMember.lastName || 'N/A'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground-2">
                          <Mail className="h-4 w-4" />
                          <span className="flex-1">{localTeamMember?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground-2">
                          <Phone className="h-4 w-4" />
                          <span className="flex-1">{localTeamMember?.phone}</span>
                        </div>
                      </div>
                      {getStatusBadge(displayTeamMember.roleStatus)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Section 2: Upcoming Appointments */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    Upcoming Appointments
                  </h3>
                </div>

                {displayTeamMember.upcomingAppointments && displayTeamMember.upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {displayTeamMember.upcomingAppointments.map((appointment: TeamMemberAppointment) => (
                      <div 
                        key={appointment.id}
                        className="rounded-lg border border-border dark:border-border-strong bg-surface-2 p-4 hover:bg-surface-3 transition-colors"
                      >
                        <div className="space-y-3">
                          {/* Header with service and status */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-foreground-1">
                              {appointment.service.name}
                            </h4>
                            {getAppointmentStatusBadge(appointment.status)}
                          </div>

                          {/* Appointment details */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-foreground-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{formatAppointmentTime(appointment.scheduledAt, appointment.endsAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground-2">
                              <User className="h-4 w-4 flex-shrink-0" />
                              <span>{appointment.customer.firstName} {appointment.customer.lastName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span>{appointment.location.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      rounded="full"
                      onClick={() => {
                        navigate(`/appointments?teamMemberId=${displayTeamMember.id}`);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Go to Appointments
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-foreground-3 dark:text-foreground-2 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground-2 dark:text-foreground-1 leading-relaxed">
                            This team member has no upcoming appointments.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      rounded="full"
                      onClick={() => {
                        navigate(`/appointments?teamMemberId=${displayTeamMember.id}`);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Go to Appointments
                    </Button>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-end gap-2 mb-6 pt-4">
                <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
              </div>

              {/* Section 3: Assignments */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground-1">
                    Assignments
                  </h3>
                </div>

                <AssignmentsCard
                  stats={[
                    { label: 'Services', value: displayTeamMember.servicesCount || 0 },
                    { label: 'Locations', value: displayTeamMember.locationsCount || 0 },
                    { label: 'Appointments', value: displayTeamMember.totalAppointments || 0 },
                  ]}
                  description="All assignments for this team member, including services, locations, custom pricing, and custom working hours, are managed in the dedicated Assignments section."
                  buttonLabel="Go to Assignments"
                  onButtonClick={() => {
                    navigate('/assignments');
                  }}
                />
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

                <div className="flex flex-col gap-3 items-center">
                  <Button
                    variant="outline"
                    rounded="full"
                    onClick={handleDeleteClick}
                    className="w-1/2 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                navigate('/assignments');
              }
            },
          ]}
        />
      )}
    </>
  );
};

export default TeamMemberProfileSlider; 
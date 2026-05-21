import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Check, Loader2, Calendar, MapPin, User, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { PersonAvatar } from '../../../shared/components/common/PersonAvatar';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import type { TeamMember, TeamMemberAppointment } from '../../../shared/types/team-member';
import { UserRole } from '../../../shared/types/auth';
import { deleteTeamMemberAction, fetchTeamMemberByIdAction, offboardTeamMemberAction } from '../actions';
import { selectIsDeleting, selectDeleteResponse, selectCurrentTeamMember, selectIsFetchingTeamMember, selectIsOffboarding, selectOffboardError } from '../selectors';
import { getOffboardPreviewApi } from '../api';
import { openReconciliationAction } from '../../reconciliation/actions';
import { DeleteConfirmDialog } from '../../../shared/components/common/DeleteConfirmDialog';
import { AssignmentsCard } from '../../../shared/components/common/AssignmentsCard';
import type { DeleteResponse } from '../../../shared/types/delete-response';

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
  const { t, i18n } = useTranslation('teamMembers');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDeleting = useSelector(selectIsDeleting) as boolean;
  const isOffboarding = useSelector(selectIsOffboarding) as boolean;
  const offboardError = useSelector(selectOffboardError) as string | null;
  const deleteResponseFromState = useSelector(selectDeleteResponse);
  const currentTeamMember = useSelector(selectCurrentTeamMember) as TeamMember | null;
  const isFetchingTeamMember = useSelector(selectIsFetchingTeamMember) as boolean;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState<DeleteResponse | null>(null);
  const [hasAttemptedDelete, setHasAttemptedDelete] = useState(false);
  const [hasAttemptedOffboard, setHasAttemptedOffboard] = useState(false);
  const [localTeamMember, setLocalTeamMember] = useState<TeamMember | null>(null);
  const wasOffboardingRef = useRef(false);

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

  // Close slider after a successful offboard (new flow). Mirrors the legacy delete effect above
  // but for the offboard action chain (direct empty-actions path OR completion via reconciliation modal).
  useEffect(() => {
    if (isOffboarding) {
      wasOffboardingRef.current = true;
      return;
    }
    if (wasOffboardingRef.current && !isOffboarding && hasAttemptedOffboard) {
      wasOffboardingRef.current = false;
      if (!offboardError) {
        setShowDeleteDialog(false);
        setDeleteResponse(null);
        setHasAttemptedOffboard(false);
        onClose();
      } else {
        setHasAttemptedOffboard(false);
      }
    }
  }, [isOffboarding, offboardError, hasAttemptedOffboard, onClose]);

  // Update local state when currentTeamMember from Redux changes
  useEffect(() => {
    if (currentTeamMember) {
      setLocalTeamMember({ ...currentTeamMember });
    }
  }, [currentTeamMember]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const badgeClasses = status === 'active'
      ? 'bg-green-100 text-green-800 hover:bg-green-100'
      : 'bg-red-100 text-red-800 hover:bg-red-100';
    return (
      <Badge className={badgeClasses}>
        {status === 'active' ? t('profileSlider.status.active') : t('profileSlider.status.inactive')}
      </Badge>
    );
  };

  const getAppointmentStatusBadge = (status: string) => {
    const badgeClasses = status === 'confirmed'
      ? 'bg-green-100 text-green-800 hover:bg-green-100'
      : status === 'pending'
      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      : 'bg-secondary text-foreground-2 hover:bg-secondary-hover';
    return (
      <Badge className={badgeClasses}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatAppointmentTime = (scheduledAt: string, endsAt: string) => {
    const start = new Date(scheduledAt);
    const end = new Date(endsAt);
    const locale = i18n.language === 'ro' ? 'ro-RO' : 'en-US';
    const dateStr = start.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    const startTime = start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = end.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} · ${startTime} - ${endTime}`;
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

  const handleConfirmDelete = async () => {
    if (!deleteResponse?.canDelete || !displayTeamMember) return;
    try {
      // Fetch the offboard preview so we know if appointments need reconciliation.
      const preview = await getOffboardPreviewApi(displayTeamMember.id);
      if (!preview.appointments || preview.appointments.length === 0) {
        // No appointments → direct full offboard (unlinks services + locations + removes role).
        setHasAttemptedOffboard(true);
        dispatch(
          offboardTeamMemberAction.request({
            id: displayTeamMember.id,
            appointmentActions: [],
          }),
        );
        return;
      }
      // Has appointments → open reconciliation modal in remove_member mode.
      // The slider stays open in the background; it'll auto-close after the modal commits
      // a successful offboard (the offboard saga drives the same isOffboarding flag).
      setHasAttemptedOffboard(true);
      setShowDeleteDialog(false);
      dispatch(
        openReconciliationAction({
          mode: 'remove_member',
          userId: displayTeamMember.id,
        }),
      );
    } catch {
      // Preview failed → fall back to the legacy delete flow.
      setHasAttemptedDelete(true);
      dispatch(deleteTeamMemberAction.request({ id: displayTeamMember.id }));
    }
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
        title={hasValidData ? `${displayTeamMember.firstName} ${displayTeamMember.lastName}` : t('profileSlider.loading')}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 py-6 pt-0 md:p-6 md:pt-0 bg-surface">
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
                    {t('profileSlider.profileInfo')}
                  </h3>
                </div>

                <div className="flex items-start gap-4">
                  {/* Avatar with verification badge */}
                  <div className="relative">
                    <PersonAvatar
                      id={displayTeamMember.id}
                      firstName={displayTeamMember.firstName}
                      lastName={displayTeamMember.lastName}
                      profileImage={displayTeamMember.profileImage}
                      className="h-16 w-16"
                      initialsClassName="text-lg font-semibold"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Name and status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div>
                          <h4 className="text-xl font-semibold text-foreground-1 break-words">
                            {displayTeamMember.firstName || 'N/A'} {displayTeamMember.lastName || 'N/A'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground-2 min-w-0">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{localTeamMember?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground-2 min-w-0">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{localTeamMember?.phone}</span>
                        </div>
                      </div>
                      <div className="shrink-0">{getStatusBadge(displayTeamMember.roleStatus)}</div>
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
                    {t('profileSlider.upcomingAppointments')}
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
                      {t('profileSlider.goToAppointments')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-foreground-3 dark:text-foreground-2 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground-2 dark:text-foreground-1 leading-relaxed">
                            {t('profileSlider.noAppointments')}
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
                      {t('profileSlider.goToAppointments')}
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
                    {t('profileSlider.assignments')}
                  </h3>
                </div>

                <AssignmentsCard
                  stats={[
                    { label: t('profileSlider.stats.services'), value: displayTeamMember.servicesCount || 0 },
                    { label: t('profileSlider.stats.locations'), value: displayTeamMember.locationsCount || 0 },
                    { label: t('profileSlider.stats.appointments'), value: displayTeamMember.totalAppointments || 0 },
                  ]}
                  description={t('profileSlider.assignmentsDescription')}
                  buttonLabel={t('profileSlider.goToAssignments')}
                  onButtonClick={() => {
                    navigate('/assignments');
                  }}
                />
              </div>

              {/* Remove Team Member - hide for owners */}
              {displayTeamMember.role !== UserRole.OWNER && (
                <>
                  <div className="flex items-end gap-2 mb-6 pt-4">
                    <div className="flex-1 h-px bg-border dark:bg-border-strong"></div>
                  </div>

                  <div className="space-y-4 rounded-lg border border-border dark:border-border-strong bg-surface-2 p-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium text-foreground-1">
                        {t('profileSlider.removeTeamMember')}
                      </h3>
                      <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
                        {t('profileSlider.removeTeamMemberDescription')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 items-center">
                      <Button
                        variant="outline"
                        rounded="full"
                        onClick={handleDeleteClick}
                        className="w-full max-w-xs px-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isDeleting || isOffboarding}
                      >
                        {isDeleting || isOffboarding ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('profileSlider.removing')}
                          </>
                        ) : (
                          t('profileSlider.removeFromOrganisation')
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
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
          isLoading={isDeleting || isOffboarding}
          className="z-[80]"
          overlayClassName="z-[80]"
          secondaryActions={[
            {
              label: t('profileSlider.goToAssignments'),
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
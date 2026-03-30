import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { selectCurrentUser } from '../../auth/selectors';
import { UserRole } from '../../../shared/types/auth';
import { selectSubscriptionSummary, selectIsLoadingSubscriptionSummary } from '../../settings/selectors';
import { getSubscriptionSummaryAction } from '../../settings/actions';
import { selectTeamMembers, selectIsOffboarding } from '../selectors';
import { listTeamMembersAction, offboardTeamMemberAction } from '../actions';
import type { TeamMember } from '../../../shared/types/team-member';
import type { AppointmentActionItem } from '../api';
import { getLocationContextRequest } from '../../calendar/actions';

/**
 * SeatOverflowGate - Blocks UI when paidSeats < usedSeats
 *
 * Shows when:
 * - currentUser.role === OWNER
 * - isEntitled === true (subscription is active)
 * - paidSeats > 0
 * - usedSeats > paidSeats (seat overflow detected)
 */
export const SeatOverflowGate: React.FC = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const currentUser = useSelector(selectCurrentUser);
  const subscriptionSummary = useSelector(selectSubscriptionSummary);
  const isLoadingSubscription = useSelector(selectIsLoadingSubscriptionSummary);
  const teamMembers = useSelector(selectTeamMembers);
  const isOffboarding = useSelector(selectIsOffboarding);

  // Local state for wizard
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [locationContexts, setLocationContexts] = useState<Map<number, any>>(new Map());
  const [appointmentActions, setAppointmentActions] = useState<Map<number, number | null>>(new Map());
  const [isFetchingAppointments, setIsFetchingAppointments] = useState(false);

  // Fetch subscription summary and team members on mount
  useEffect(() => {
    if (currentUser?.role === UserRole.OWNER) {
      if (!subscriptionSummary) {
        dispatch(getSubscriptionSummaryAction.request());
      }
      dispatch(listTeamMembersAction.request());
    }
  }, []);

  // Determine if gate should be shown
  const isEntitled = currentUser?.entitlements?.entitled ?? false;
  const paidSeats = subscriptionSummary?.paidSeats ?? 0;
  const usedSeats = subscriptionSummary?.usedSeats ?? 0;
  const shouldShow =
    currentUser?.role === UserRole.OWNER &&
    isEntitled === true &&
    paidSeats > 0 &&
    usedSeats > paidSeats;

  if (!shouldShow) {
    return null;
  }

  // Filter team members: exclude OWNER role members
  const selectableMembersForRemoval = teamMembers.filter(
    (m) => m.role !== UserRole.OWNER && m.id !== currentUser?.id
  );

  const handleSelectMemberAndFetch = async (member: TeamMember) => {
    setSelectedMember(member);
    setIsFetchingAppointments(true);

    try {
      // TODO: Fetch upcoming appointments for this member
      // This would call: POST /appointments/list with { teamMember: member.id, status: 'pending' | 'confirmed' }
      // For now, set empty appointments (will be implemented with API call)
      const appointmentsData: any[] = [];

      if (appointmentsData.length === 0) {
        // No appointments - skip step 2 and offboard directly
        dispatch(
          offboardTeamMemberAction.request({
            id: member.id,
            appointmentActions: [],
          })
        );
      } else {
        // Fetch location contexts for each unique location in appointments
        const uniqueLocationIds = [...new Set(appointmentsData.map((a) => a.locationId))];
        const contextMap = new Map();

        // TODO: Fetch location context for each location
        // This would call: GET /calendar/location-context/:locationId
        // For now, just proceed with empty context

        setAppointments(appointmentsData);
        setLocationContexts(contextMap);
        // Initialize appointmentActions with null (cancel) for all
        const actionsMap = new Map(appointmentsData.map((a) => [a.id, null]));
        setAppointmentActions(actionsMap);
        setStep(2);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setIsFetchingAppointments(false);
    }
  };

  const handleConfirmOffboard = () => {
    if (!selectedMember) return;

    const actions: AppointmentActionItem[] = Array.from(appointmentActions.entries()).map(
      ([appointmentId, newStaffUserId]) => ({
        appointmentId,
        newStaffUserId,
        cancel: newStaffUserId === null,
      })
    );

    dispatch(offboardTeamMemberAction.request({ id: selectedMember.id, appointmentActions: actions }));
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center backdrop-blur-sm bg-black/80">
      <Card className="max-w-2xl w-full border-amber-200 shadow-lg">
        <CardHeader className="border-b">
          {/* Header with icon and title */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-amber-900 dark:text-amber-100">
                {t('teamMembers:seatOverflow.title')}
              </CardTitle>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                {t('teamMembers:seatOverflow.subtitle', {
                  paidSeats,
                  usedSeats,
                })}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {step === 1
                ? t('teamMembers:seatOverflow.step1Title')
                : t('teamMembers:seatOverflow.step2Title')}
            </span>
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setSelectedMember(null);
                  setAppointments([]);
                  setAppointmentActions(new Map());
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('teamMembers:seatOverflow.back')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {step === 1 ? (
            // Step 1: Select Member
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {selectableMembersForRemoval.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectMemberAndFetch(member)}
                    disabled={isFetchingAppointments}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedMember?.id === member.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                    } ${isFetchingAppointments ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {member.firstName?.[0]}
                        {member.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleSelectMemberAndFetch(selectedMember!)}
                  disabled={!selectedMember || isFetchingAppointments || isOffboarding}
                  className="flex-1"
                >
                  {isFetchingAppointments ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    t('teamMembers:seatOverflow.next')
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Step 2: Reassign Appointments
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('teamMembers:seatOverflow.step2Subtitle', {
                  name: `${selectedMember?.firstName} ${selectedMember?.lastName}`,
                })}
              </p>

              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('teamMembers:seatOverflow.noAppointments')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {appointment.serviceName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(appointment.scheduledAt).toLocaleString(i18n.language)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {appointment.customerName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointmentActions.get(appointment.id) === null ? (
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                              Will cancel
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              Will reassign
                            </span>
                          )}
                        </div>
                      </div>
                      {/* TODO: Add staff picker here when fetching appointments */}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmOffboard}
                  disabled={isOffboarding || selectedMember === null}
                  className="flex-1"
                >
                  {isOffboarding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('teamMembers:seatOverflow.removing')}
                    </>
                  ) : (
                    t('teamMembers:seatOverflow.confirmRemove')
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatOverflowGate;

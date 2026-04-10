import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { Button } from "../../../shared/components/ui/button";
import { Plus, Mail, Phone, Edit, Clock, Send, XCircle, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../shared/components/ui/dialog";
import { toast } from 'sonner';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Badge } from "../../../shared/components/ui/badge";
import InviteTeamMemberSlider from '../components/InviteTeamMemberSlider';
import TeamMemberProfileSlider from '../components/TeamMemberProfileSlider';
import TrialBanner from '../components/TrialBanner';
import { TeamMemberFilters } from '../components/TeamMemberFilters';
import type { TeamMember } from '../../../shared/types/team-member';
import { useDispatch, useSelector } from 'react-redux';
import { cancelInvitationAction, listTeamMembersAction, resendInvitationAction } from '../actions.ts';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { selectTeamMembers, selectTeamMembersLoading } from '../selectors';
import { ItemCard, type ItemCardAction } from '../../../shared/components/common/ItemCard';
import { Avatar, AvatarImage, AvatarFallback } from '../../../shared/components/ui/avatar';
import { getAvatarBgColor } from '../../setupWizard/components/StepTeam';
import { highlightMatches as highlight } from '../../../shared/utils/highlight';
import { EmptyState } from '../../../shared/components/common/EmptyState';
import TeamMembersListSkeleton from '../components/TeamMembersListSkeleton';

export default function TeamMembersPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const text = useTranslation("teamMembers").t;
  const teamMembers = useSelector(selectTeamMembers);
  const isTeamMembersLoading = useSelector(selectTeamMembersLoading);
  const [isInviteSliderOpen, setIsInviteSliderOpen] = useState(false);
  const [isProfileSliderOpen, setIsProfileSliderOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'resend' | 'toggleStatus' | 'cancelInvite';
    teamMemberId?: number;
    teamMemberName?: string;
    email?: string;
    toggleStatusData?: { id: string; name: string; currentStatus: string; newStatus: string };
  } | null>(null);
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    dispatch(listTeamMembersAction.request());
  }, [dispatch]);

  useEffect(() => {
    if (deepLinkHandled.current) return;
    const actionParam = searchParams.get("action");
    if (actionParam === "invite") {
      deepLinkHandled.current = true;
      setSearchParams({}, { replace: true });
      setIsInviteSliderOpen(true);
      return;
    }
    const memberIdParam = searchParams.get("memberId");
    if (!memberIdParam) return;
    if (isTeamMembersLoading || teamMembers.length === 0) return;

    const memberId = Number(memberIdParam);
    if (Number.isNaN(memberId)) return;

    deepLinkHandled.current = true;
    setSearchParams({}, { replace: true });

    const member = teamMembers.find((m: TeamMember) => m.id === memberId);
    if (member) {
      setSelectedTeamMember(member);
      setIsProfileSliderOpen(true);
    }
  }, [searchParams, setSearchParams, teamMembers, isTeamMembersLoading]);

  const confirmResend = async () => {
    if (!pendingAction || pendingAction.type !== 'resend' || !pendingAction.teamMemberId) return;
    dispatch(resendInvitationAction.request({ id: pendingAction.teamMemberId }));
    setIsConfirmDialogOpen(false);
    setPendingAction(null);
  };

  const confirmCancelInvite = async () => {
    if (!pendingAction || pendingAction.type !== 'cancelInvite' || !pendingAction.teamMemberId) return;
    try {
      dispatch(cancelInvitationAction.request({ id: pendingAction.teamMemberId }));
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const openEditSlider = (teamMember: TeamMember) => {
    openProfileSlider(teamMember);
  };

  const openProfileSlider = (teamMember: TeamMember) => {
    setSelectedTeamMember(teamMember);
    setIsProfileSliderOpen(true);
  };

  // Highlight helper using shared utility
  const highlightMatches = (text: string) => {
    return highlight(text, searchTerm);
  };

  const getConfirmDialogContent = () => {
    if (!pendingAction) return null;

    switch (pendingAction.type) {
      case 'toggleStatus':
        return {
          title: text('page.confirmDialog.updateStatus'),
          description: text('page.confirmDialog.updateStatusDescription', {
            name: pendingAction.toggleStatusData?.name,
            currentStatus: pendingAction.toggleStatusData?.currentStatus,
            newStatus: pendingAction.toggleStatusData?.newStatus,
          }),
          confirmText: text('page.confirmDialog.updateStatus'),
          onConfirm: () => {
            // confirmToggleStatus
          }
        };

      case 'resend':
        return {
          title: text('page.confirmDialog.resendInvitation'),
          description: text('page.confirmDialog.resendInvitationDescription', {
            email: pendingAction.email || pendingAction.teamMemberName,
          }),
          confirmText: text('page.confirmDialog.resend'),
          onConfirm: confirmResend
        };
      case 'cancelInvite':
        return {
          title: text('page.confirmDialog.cancelInvitation'),
          description: text('page.confirmDialog.cancelInvitationDescription', {
            email: pendingAction.email,
          }),
          confirmText: text('page.confirmDialog.confirmRevoke'),
          onConfirm: confirmCancelInvite,
        };
      default:
        return null;
    }
  };


  // Filter team members based on search (name or email)
  const filteredTeamMembers = teamMembers.filter((member: TeamMember) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (member.firstName || '').toLowerCase().includes(searchLower) ||
      (member.lastName || '').toLowerCase().includes(searchLower) ||
      (member.email || '').toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  // Split into active and pending members
  const activeMembers = filteredTeamMembers.filter((member: TeamMember) => member.roleStatus === 'active');
  const pendingMembers = filteredTeamMembers.filter((member: TeamMember) => member.roleStatus === 'pending_acceptance');

  const confirmDialogContent = getConfirmDialogContent();

  return (
    <AppLayout>
      <BusinessSetupGate>
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-4 w-full border-b border-border-strong hidden md:block">
              <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
                {text("page.title")}
              </h1>
            </div>

            {/* Trial Banner */}
            <TrialBanner />

            {/* While team members are loading, show full-page skeleton (including filters) */}
            {isTeamMembersLoading ? (
              <TeamMembersListSkeleton />
            ) : (
              <>
                {/* Team Member Filters */}
                <TeamMemberFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onAddClick={() => setIsInviteSliderOpen(true)}
                />

                {/* Empty State */}
                {filteredTeamMembers.length === 0 && (
                <EmptyState
                  title={searchTerm 
                    ? text("page.emptyState.noResults")
                    : text("page.emptyState.noTeamMembers")}
                  description={searchTerm
                    ? text("page.emptyState.noResultsDescription")
                    : text("page.emptyState.noTeamMembersDescription")}
                  icon={Users}
                  actionButton={!searchTerm ? {
                    label: text("page.actions.inviteMember"),
                    onClick: () => setIsInviteSliderOpen(true),
                    icon: Plus,
                  } : undefined}
                />
              )}

              {filteredTeamMembers.length > 0 && (
                <>
                  {/* Active Team Members */}
                  {activeMembers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                      {activeMembers.map((member: TeamMember) => {
                const memberRoleStatus = member.roleStatus;
                const canEdit = memberRoleStatus !== 'pending_acceptance';
                const displayName = `${member.firstName || text('page.displayNameFallback.pending')} ${member.lastName || text('page.displayNameFallback.invite')}`.trim();
                
                // Create initials for avatar
                const initials = member.firstName && member.lastName
                  ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                  : (member.email?.[0] || '?').toUpperCase();

                // Create avatar/thumbnail
                const thumbnail = (
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage 
                      src={member.profileImage || undefined} 
                      alt={displayName}
                    />
                    <AvatarFallback 
                      className="text-sm font-medium"
                      style={{ backgroundColor: getAvatarBgColor(member.email) }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                );

                // Build custom description with email and phone
                const customContent = (
                  <div className="flex flex-col gap-2 mt-1">
                    {/* Pending Invitation Badge */}
                    {memberRoleStatus === 'pending_acceptance' && (
                      <Badge
                        variant="secondary"
                        className="font-medium text-xs h-8 w-fit py-2 px-3 bg-info-bg border-info-border text-info"
                      >
                        <Clock className="h-3 w-3 mr-1.5 mt-0.5" />
                        {text("page.badges.invitationSent")}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-foreground-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{highlightMatches(member.email || '')}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-foreground-2">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{member.phone}</span>
                      </div>
                    )}
                  </div>
                );

                // Build actions array
                const actions = [];
                if (canEdit) {
                  actions.push({
                    icon: Edit,
                    label: text("page.actionsLabel.editTeamMember"),
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      openEditSlider(member);
                    },
                  });
                }

                return (
                  <ItemCard
                    key={member.id}
                    title={highlightMatches(displayName || member.email)}
                    customContent={customContent}
                    actions={actions}
                    thumbnail={thumbnail}
                    onClick={() => {
                      if (!canEdit) {
                        toast.info(text('page.toasts.cannotEditPending'));
                        return;
                      }
                      openProfileSlider(member);
                    }}
                  />
                );
                      })}
                    </div>
                  )}

                  {/* Divider with "Invitation Sent" Badge */}
                  {pendingMembers.length > 0 && (
                    <div className="relative flex items-center justify-center my-8">
                      <div className="flex-grow border-t border-border"></div>
                      <Badge
                        variant="secondary"
                        className="font-medium text-xs h-8 w-fit py-2 px-3 bg-info-bg border-info-border text-info"
                      >
                        <Clock className="h-3 w-3 mr-1.5 mt-0.5" />
                        {text("page.badges.invitationSent")}
                      </Badge>
                      <div className="flex-grow border-t border-border"></div>
                    </div>
                  )}

                  {/* Pending Team Members */}
                  {pendingMembers.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                      {pendingMembers.map((member: TeamMember) => {
                        const displayName = `${member.firstName || text('page.displayNameFallback.pending')} ${member.lastName || text('page.displayNameFallback.invite')}`.trim();
                        
                        // Create initials for avatar
                        const initials = member.firstName && member.lastName
                          ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                          : (member.email?.[0] || '?').toUpperCase();

                        // Create avatar/thumbnail
                        const thumbnail = (
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarImage 
                              src={member.profileImage || undefined} 
                              alt={displayName}
                            />
                            <AvatarFallback 
                              className="text-sm font-medium"
                              style={{ backgroundColor: getAvatarBgColor(member.email) }}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        );

                        // Build custom description with email and phone
                        const customContent = (
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-sm text-foreground-2">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{highlightMatches(member.email || '')}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2 text-sm text-foreground-2">
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{member.phone}</span>
                              </div>
                            )}
                          </div>
                        );

                        // Build bottom action buttons for pending members
                        const bottomActions = (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              type="button"
                              variant="info"
                              rounded="full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingAction({ 
                                  type: 'resend', 
                                  teamMemberId: member.id, 
                                  teamMemberName: displayName || member.email,
                                  email: member.email
                                });
                                setIsConfirmDialogOpen(true);
                              }}
                              className="flex-1"
                            >
                              <Send className="h-4 w-4" />
                              {text("page.confirmDialog.resend")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              rounded="full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingAction({ 
                                  type: 'cancelInvite', 
                                  teamMemberId: member.id, 
                                  email: member.email 
                                });
                                setIsConfirmDialogOpen(true);
                              }}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4" />
                              {text("page.confirmDialog.cancelInvitationBtn")}
                            </Button>
                          </div>
                        );

                        // Build actions array (empty for pending members)
                        const actions: ItemCardAction[] = [];

                        return (
                          <ItemCard
                            key={member.id}
                            title={highlightMatches(displayName || member.email)}
                            customContent={customContent}
                            actions={actions}
                            thumbnail={thumbnail}
                            bottomActions={bottomActions}
                            onClick={() => {
                              toast.info(text('page.toasts.pendingNotAccepted'));
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Confirmation Dialog */}
              <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{confirmDialogContent?.title}</DialogTitle>
                    <DialogDescription>
                      {confirmDialogContent?.description}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Button
                      onClick={confirmDialogContent?.onConfirm}
                      rounded="full"
                      className="flex-1"
                    >
                      {confirmDialogContent?.confirmText}
                    </Button>
                    <Button
                      variant="outline"
                      rounded="full"
                      onClick={() => setIsConfirmDialogOpen(false)}
                    >
                      {text("page.confirmDialog.cancel")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          </div>

          {/* Invite Team Member Slider - Outside conditional to prevent unmounting */}
          <InviteTeamMemberSlider
            isOpen={isInviteSliderOpen}
            onClose={() => setIsInviteSliderOpen(false)}
          />

          {/* Team Member Profile Slider - Outside conditional to prevent unmounting */}
          <TeamMemberProfileSlider
            isOpen={isProfileSliderOpen}
            onClose={() => setIsProfileSliderOpen(false)}
            teamMember={selectedTeamMember as TeamMember}
          />
        </BusinessSetupGate>
      </AppLayout>
  );
}


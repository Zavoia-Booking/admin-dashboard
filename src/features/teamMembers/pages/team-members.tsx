import { useState, useEffect } from 'react';
import { UserRole } from '../../../shared/types/auth';
import { Button } from "../../../shared/components/ui/button";
import { Plus, Mail, Search, Filter, X, MapPin, Phone, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../shared/components/ui/dialog";
import { toast } from 'sonner';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Badge } from "../../../shared/components/ui/badge";
import InviteTeamMemberSlider from '../components/InviteTeamMemberSlider';
import TeamMemberProfileSlider from '../components/TeamMemberProfileSlider';
import TrialBanner from '../components/TrialBanner';
import type { TeamMember } from '../../../shared/types/team-member';
import { Input } from '../../../shared/components/ui/input';
import { FilterPanel } from '../../../shared/components/common/FilterPanel';
import { useDispatch, useSelector } from 'react-redux';
import { cancelInvitationAction, listTeamMembersAction, resendInvitationAction } from '../actions.ts';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { selectTeamMembers } from '../selectors';

export default function TeamMembersPage() {
  const dispatch = useDispatch();
  const teamMembers = useSelector(selectTeamMembers);
  const [isInviteSliderOpen, setIsInviteSliderOpen] = useState(false);
  const [isProfileSliderOpen, setIsProfileSliderOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'resend' | 'toggleStatus' | 'cancelInvite';
    teamMemberId?: number;
    teamMemberName?: string;
    email?: string;
    toggleStatusData?: { id: string; name: string; currentStatus: string; newStatus: string };
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Local filter state (used in filter card only)
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localLocationFilter, setLocalLocationFilter] = useState(locationFilter);

  useEffect(() => {
    dispatch(listTeamMembersAction.request());
  }, []);

  // When opening the filter card, sync local state with main state
  useEffect(() => {
    if (showFilters) {
      setLocalStatusFilter(statusFilter);
      setLocalLocationFilter(locationFilter);
    }
  }, [showFilters, statusFilter, locationFilter]);

  const confirmResend = async () => {
    if (!pendingAction || pendingAction.type !== 'resend' || !pendingAction.teamMemberId) return;
    dispatch(resendInvitationAction.request({ id: pendingAction.teamMemberId }));
    setIsConfirmDialogOpen(false);
    setPendingAction(null);
  };

  // TODO: Replace with actual API call
  const locations: any[] = [];

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

  const getConfirmDialogContent = () => {
    if (!pendingAction) return null;

    switch (pendingAction.type) {
      case 'toggleStatus':
        return {
          title: 'Update Status',
          description: `Are you sure you want to change ${pendingAction.toggleStatusData?.name}'s status from ${pendingAction.toggleStatusData?.currentStatus} to ${pendingAction.toggleStatusData?.newStatus}?`,
          confirmText: 'Update Status',
          onConfirm: () => {
            // confirmToggleStatus
          }
        };

      case 'resend':
        return {
          title: 'Resend Invitation',
          description: `Are you sure you want to resend the invitation to ${pendingAction.teamMemberName}?`,
          confirmText: 'Resend',
          onConfirm: confirmResend
        };
      case 'cancelInvite':
        return {
          title: 'Cancel Invitation',
          description: `Cancel the invitation for ${pendingAction.email}?`,
          confirmText: 'Cancel Invitation',
          onConfirm: confirmCancelInvite,
        };
      default:
        return null;
    }
  };

  const getStatusBadge = (roleStatus: string) => {
    switch (roleStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 w-fit">Active</Badge>;
      case 'pending_acceptance':
        return <Badge className="bg-orange-100 text-orange-800 w-fit">Pending Acceptance</Badge>;
      default:
        return <Badge className="w-fit">{roleStatus.toUpperCase().replace('_', ' ')}</Badge>;
    }
  };

  // Filter team members based on search, status, role, and location
  const filteredTeamMembers = teamMembers.filter((member: TeamMember) => {
    const matchesSearch = (member.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const memberRoleStatus = (member as any).roleStatus || member.status;
    const matchesStatus = statusFilter === 'all' || memberRoleStatus === statusFilter;
    const matchesRole = roleFilter === 'all' || (roleFilter === 'team_member' && member.role === UserRole.TEAM_MEMBER);
    const matchesLocation = locationFilter === 'all' || (`${member?.location}` === locationFilter);
    return matchesSearch && matchesStatus && matchesRole && matchesLocation;
  });

  // Get unique roles from data
  const uniqueRoles = Array.from(new Set(teamMembers.map((m: TeamMember) => m.role)));

  // Stats
  const totalMembers = teamMembers.length;
  const rolesCount = uniqueRoles.length;
  const filteredCount = filteredTeamMembers.length;

  const confirmDialogContent = getConfirmDialogContent();

  // Calculate number of active filters
  const activeFiltersCount = [
    !!searchTerm,
    statusFilter !== 'all',
    roleFilter !== 'all',
    locationFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <AppLayout>
      <BusinessSetupGate>
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Trial Banner */}
          <TrialBanner />

          {/* Top Controls: Search, Filter, Add */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-11 text-base pr-12 pl-4 rounded-lg border border-input bg-white"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            <button
              className={`
              relative flex items-center justify-center h-9 w-9 rounded-md border border-input transition-all duration-200 ease-out
              ${showFilters
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
              onClick={() => setShowFilters(v => !v)}
              aria-label="Show filters"
            >
              <Filter className={`h-5 w-5 ${showFilters ? 'text-primary-foreground' : ''}`} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <Button
              className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2"
              onClick={() => setIsInviteSliderOpen(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Invite Member</span>
            </Button>
          </div>
          {/* Filter Panel (dropdown style) */}
          {showFilters && (
            <FilterPanel
              open={showFilters}
              onOpenChange={setShowFilters}
              fields={[
                {
                  type: 'select',
                  key: 'status',
                  label: 'Status',
                  value: localStatusFilter,
                  options: [
                    { value: 'all', label: 'All statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'pending_acceptance', label: 'Pending Acceptance' },
                  ],
                  searchable: true,
                },
                {
                  type: 'select',
                  key: 'location',
                  label: 'Location',
                  value: localLocationFilter,
                  options: [
                    { value: 'all', label: 'All locations' },
                    ...locations.map(location => ({ value: String(location.id), label: location.name }))
                  ],
                  searchable: true,
                },
                {
                  type: 'text',
                  key: 'search',
                  label: 'Search',
                  value: searchTerm,
                  placeholder: 'Search by name or email...'
                },
              ]}
              onApply={values => {
                setStatusFilter(values.status);
                setRoleFilter(values.role);
                setLocationFilter(values.location);
                setSearchTerm(values.search);
                setShowFilters(false);
              }}
              onClear={() => {
                setStatusFilter('all');
                setRoleFilter('all');
                setLocationFilter('all');
                setSearchTerm('');
              }}
            />
          )}
          {/* Active Filter Badges - Always show when there are active filters */}
          {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || locationFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-2">
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setSearchTerm('')}
                >
                  Search: &#34;{searchTerm}&#34;
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {roleFilter !== 'all' && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setRoleFilter('all')}
                >
                  Role: {roleFilter}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
              {locationFilter !== 'all' && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                  onClick={() => setLocationFilter('all')}
                >
                  Location: {locations.find(loc => String(loc.id) === locationFilter)?.name}
                  <X className="h-4 w-4 ml-1" />
                </Badge>
              )}
            </div>
          )}
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredCount === totalMembers ? totalMembers : filteredCount}</div>
              <div className="text-xs text-gray-500 mt-1">{filteredCount === totalMembers ? 'Total Members' : 'Filtered Members'}</div>
            </div>
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{filteredTeamMembers.filter((m: TeamMember) => ((m as any).roleStatus || m.status) === 'active').length}</div>
              <div className="text-xs text-gray-500 mt-1">Active</div>
            </div>
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{rolesCount}</div>
              <div className="text-xs text-gray-500 mt-1">Roles</div>
            </div>
          </div>
          <div className="space-y-3">
            {filteredTeamMembers.length === 0 ? (
              <div className="rounded-lg border bg-white p-8 text-center">
                <div className="mb-4 text-gray-500">No team members found matching your filters.</div>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); setLocationFilter('all'); setShowFilters(false); }}>Clear filters</Button>
              </div>
            ) : (
              filteredTeamMembers.map((member: TeamMember) => {
                const memberRoleStatus = (member as any).roleStatus || member.status;
                const canEdit = memberRoleStatus !== 'pending_acceptance';
                const displayName = `${member.firstName || 'Pending'} ${member.lastName || 'Invite'}`.trim();
                const safeInitials = `${(member.firstName?.[0] || member.email?.[0] || '?')}${(member.lastName?.[0] || '')}`;
                const displayPhone = member.phone || 'Phone not set yet';
                return (
                  <div
                    key={member.id}
                    className="rounded-xl border bg-white p-4 flex flex-col gap-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => {
                      if (!canEdit) {
                        toast.info('Cannot edit a pending team member until they complete registration.');
                        return;
                      }
                      openProfileSlider(member);
                    }}
                  >
                    <div className="flex flex-row items-start gap-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center text-white font-bold text-lg">
                        {safeInitials}
                      </div>
                      <div className="flex flex-col justify-start min-w-0">
                        <span className="font-semibold text-base truncate">{displayName || member.email}</span>
                        <span className="text-sm text-gray-500 truncate">{member.role}</span>
                        {getStatusBadge(memberRoleStatus)}
                      </div>
                      <div className="flex-1 flex justify-end items-start gap-1">
                        {memberRoleStatus === 'pending_acceptance' && (
                          <div className="flex items-center gap-1">
                            <button
                              className="p-2 rounded hover:bg-muted text-blue-600"
                              title="Resend Invitation"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingAction({ type: 'resend', teamMemberId: member.id, teamMemberName: displayName || member.email });
                                setIsConfirmDialogOpen(true);
                              }}
                            >
                              <Mail className="h-5 w-5" />
                            </button>
                            <button
                              className="p-2 rounded hover:bg-red-50 text-red-600"
                              title="Cancel Invitation"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingAction({ type: 'cancelInvite', teamMemberId: member.id, email: member.email });
                                setIsConfirmDialogOpen(true);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {canEdit && (
                          <button
                            className="p-2 rounded hover:bg-muted"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSlider(member);
                            }}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row gap-4 mt-1">
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="h-4 w-4" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4" />
                          <span>{displayPhone}</span>
                        </div>
                        {member.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4" />
                            <span>{locations.find(loc => String(loc.id) === `${member.location}`)?.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
                className="flex-1"
              >
                {confirmDialogContent?.confirmText}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite Team Member Slider */}
        <InviteTeamMemberSlider
          isOpen={isInviteSliderOpen}
          onClose={() => setIsInviteSliderOpen(false)}
        />

        {/* Team Member Profile Slider */}
        <TeamMemberProfileSlider
          isOpen={isProfileSliderOpen}
          onClose={() => setIsProfileSliderOpen(false)}
          teamMember={selectedTeamMember as TeamMember}
          onUpdate={() => {
            // handleUpdateTeamMember
          }}
          onDelete={() => {
            // handleDeleteTeamMember
          }}
          locations={locations.map(loc => ({ id: String(loc.id), name: loc.name }))}
        />
      </BusinessSetupGate>
    </AppLayout>
  );
}


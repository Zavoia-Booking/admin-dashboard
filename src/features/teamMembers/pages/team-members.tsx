
import React, { useState, useEffect } from 'react';
import { UserRole } from '../../../shared/types/auth';
import { Button } from "../../../shared/components/ui/button";
import { Plus, Mail, Search, Filter, X, MapPin, Phone, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../shared/components/ui/dialog";
import { toast } from 'sonner';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Badge } from "../../../shared/components/ui/badge";
import InviteTeamMemberSlider from '../components/InviteTeamMemberSlider';
import TeamMemberProfileSlider from '../components/TeamMemberProfileSlider';
import { mockLocations } from '../../../mocks/locations.mock';
import type { TeamMember } from '../../../shared/types/team-member';
import { Input } from '../../../shared/components/ui/input';
import { FilterPanel } from '../../../shared/components/common/FilterPanel';
import { useDispatch, useSelector } from 'react-redux';
import { inviteTeamMemberAction, listTeamMembersAction } from '../../teamMembers/actions';
import type { RootState } from '../../../app/providers/store';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import BusinessSetupGate from '../../../shared/components/guards/BusinessSetupGate';
import { selectTeamMembers } from '../selectors';

export default function TeamMembersPage() {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const { error: inviteError } = useSelector((state: RootState) => state.teamMembers);
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
    type: 'delete' | 'resend' | 'toggleStatus';
    teamMemberId?: string;
    teamMemberName?: string;
    toggleStatusData?: { id: string; name: string; currentStatus: string; newStatus: string };
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // Locations provided via mocks

  // Local filter state (used in filter card only)
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localRoleFilter, setLocalRoleFilter] = useState(roleFilter);
  const [localLocationFilter, setLocalLocationFilter] = useState(locationFilter);

  useEffect(() => {
    dispatch(listTeamMembersAction.request());
  }, []);

  console.log('teamMembers', teamMembers);

  // When opening the filter card, sync local state with main state
  useEffect(() => {
    if (showFilters) {
      setLocalStatusFilter(statusFilter);
      setLocalRoleFilter(roleFilter);
      setLocalLocationFilter(locationFilter);
    }
  }, [showFilters, statusFilter, roleFilter, locationFilter]);

  const handleInviteTeamMember = async (inviteData: { email: string; role: string; location: string }) => {
    // Map UI role labels to API roles
    const apiRole = inviteData.role === 'Manager' ? UserRole.MANAGER : UserRole.TEAM_MEMBER;
    const locationId = Number(inviteData.location);
    dispatch(inviteTeamMemberAction.request({ email: inviteData.email, role: apiRole, locationId }));
  };

  useEffect(() => {
    if (inviteError) {
      toast.error(inviteError);
    }
  }, [inviteError]);

  // const handleUpdateTeamMember = async (updateData: Partial<TeamMember>) => {
  //   if (!selectedTeamMember) return;

  //   try {
  //     // TODO: Replace with actual API call
  //     // Mock update - update the team member in the list

  //     // Update local state
  //     setTeamMembers(prev => prev.map(member =>
  //       member.id === selectedTeamMember.id ? { ...member, ...updateData } : member
  //     ));

  //     // Update selected team member
  //     setSelectedTeamMember(prev => prev ? { ...prev, ...updateData } : null);

  //     toast.success('Team member updated successfully');
  //   } catch (error) {
  //     toast.error('Failed to update team member');
  //   }
  // };

  // const confirmToggleStatus = async () => {
  //   if (!pendingAction || pendingAction.type !== 'toggleStatus' || !pendingAction.toggleStatusData) return;

  //   try {
  //     // TODO: Replace with actual API call
  //     // Mock status update
  //     setTeamMembers(prev => prev.map(member =>
  //       member.id === pendingAction.toggleStatusData!.id
  //         ? { ...member, status: pendingAction.toggleStatusData!.newStatus as 'active' | 'inactive' }
  //         : member
  //     ));

  //     toast.success(`Status updated to ${pendingAction.toggleStatusData.newStatus}`);
  //   } catch (error) {
  //     toast.error('Failed to update status');
  //   } finally {
  //     setIsConfirmDialogOpen(false);
  //     setPendingAction(null);
  //   }
  // };

  // const handleDeleteTeamMember = async (id: string) => {
  //   try {
  //     // TODO: Replace with actual API call
  //     // Mock delete - remove from team members list
  //     setTeamMembers(prev => prev.filter(member => member.id !== id));

  //     toast.success('Team member removed successfully');
  //   } catch (error) {
  //     toast.error('Failed to remove team member');
  //   }
  // };

  // const handleResendInvitation = async (id: string) => {
  //   setPendingAction({
  //     type: 'resend',
  //     teamMemberId: id,
  //     teamMemberName: teamMembers.find(tm => tm.id === id)?.firstName + ' ' + teamMembers.find(tm => tm.id === id)?.lastName
  //   });
  //   setIsConfirmDialogOpen(true);
  // };

  const confirmResend = async () => {
    if (!pendingAction || pendingAction.type !== 'resend' || !pendingAction.teamMemberId) return;

    try {
      // TODO: Replace with actual API call
      // Mock resend invitation
      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
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
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 w-fit">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 w-fit">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 w-fit">Pending</Badge>;
      default:
        return <Badge className="w-fit">{status.toUpperCase()}</Badge>;
    }
  };

  // Filter team members based on search, status, role, and location
  const filteredTeamMembers = teamMembers.filter((member: TeamMember) => {
    const matchesSearch = member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'manager' && member.role === UserRole.MANAGER) ||
      (roleFilter === 'team_member' && member.role === UserRole.TEAM_MEMBER);
    const matchesLocation = locationFilter === 'all' || member.location === locationFilter;
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
        <div className={`space-y-4 ${isMobile ? 'max-w-2xl mx-auto' : ''}`}>
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
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'pending', label: 'Pending' },
                  ],
                  searchable: true,
                },
                // {
                //   type: 'select',
                //   key: 'role',
                //   label: 'Role',
                //   value: localRoleFilter,
                //   options: [
                //     { value: 'all', label: 'All roles' },
                //     ...uniqueRoles.map((role: UserRole) => ({ value: role, label: role as string }))
                //   ],
                //   searchable: true,
                // },
                {
                  type: 'select',
                  key: 'location',
                  label: 'Location',
                  value: localLocationFilter,
                  options: [
                    { value: 'all', label: 'All locations' },
                    ...mockLocations.map(location => ({ value: location.id, label: location.name }))
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
                  Location: {mockLocations.find(loc => loc.id === locationFilter)?.name}
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
              <div className="text-2xl font-bold text-green-600">{filteredTeamMembers.filter((m: TeamMember) => m.status === 'active').length}</div>
              <div className="text-xs text-gray-500 mt-1">Active</div>
            </div>
            <div className="rounded-lg border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{rolesCount}</div>
              <div className="text-xs text-gray-500 mt-1">Roles</div>
            </div>
          </div>
          {isMobile ? (
            <div className="space-y-3">
              {filteredTeamMembers.length === 0 ? (
                <div className="rounded-lg border bg-white p-8 text-center">
                  <div className="mb-4 text-gray-500">No team members found matching your filters.</div>
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); setLocationFilter('all'); setShowFilters(false); }}>Clear filters</Button>
                </div>
              ) : (
                filteredTeamMembers.map((member: TeamMember) => (
                  <div
                    key={member.id}
                    className="rounded-xl border bg-white p-4 flex flex-col gap-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => openProfileSlider(member)}
                  >
                    <div className="flex flex-row items-start gap-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center text-white font-bold text-lg">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div className="flex flex-col justify-start min-w-0">
                        <span className="font-semibold text-base truncate">{member.firstName} {member.lastName}</span>
                        <span className="text-sm text-gray-500 truncate">{member.role}</span>
                        {getStatusBadge(member.status)}
                      </div>
                      <div className="flex-1 flex justify-end items-start gap-1">
                        {member.status === 'pending' && (
                          <button
                            className="p-2 rounded hover:bg-muted text-blue-600"
                            title="Resend Invitation"
                            onClick={(e) => {
                              e.stopPropagation();
                              // handleResendInvitation(member.id);
                            }}
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                        )}
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
                          <span>{member.phone}</span>
                        </div>
                        {member.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4" />
                            <span>{mockLocations.find(loc => loc.id === member.location)?.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-white">
              {filteredTeamMembers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No team members found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeamMembers.map((member: TeamMember) => (
                      <tr key={member.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{member.firstName} {member.lastName}</td>
                        <td className="px-4 py-3">{member.email}</td>
                        <td className="px-4 py-3">{member.role}</td>
                        <td className="px-4 py-3">{getStatusBadge(member.status)}</td>
                        <td className="px-4 py-3">{mockLocations.find(loc => loc.id === member.location)?.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {member.status === 'pending' && (
                              <button
                                className="px-2 py-1 text-blue-600 hover:underline"
                                onClick={() => {
                                  // handleResendInvitation(member.id);
                                }}
                              >
                                Resend
                              </button>
                            )}
                            <button
                              className="px-2 py-1 hover:underline"
                              onClick={() => openEditSlider(member)}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
          onInvite={handleInviteTeamMember}
          locations={mockLocations.map(loc => ({ id: loc.id, name: loc.name }))}
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
          locations={mockLocations.map(loc => ({ id: loc.id, name: loc.name }))}
        />
      </BusinessSetupGate>
    </AppLayout>
  );
}


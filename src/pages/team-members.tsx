'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserRole } from '@/types/auth';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Mail, Users, PowerOff, Power, Search, Filter, MoreVertical, X, MapPin, Phone, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import InviteTeamMemberSlider from '@/components/InviteTeamMemberSlider';
import EditTeamMemberSlider from '@/components/EditTeamMemberSlider';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  location?: string;
  services?: string[];
}

export default function TeamMembersPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      firstName: 'Emma',
      lastName: 'Thompson',
      email: 'emma@salon.com',
      phone: '+1 (555) 123-4567',
      role: 'Senior Stylist',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      location: 'Main Branch',
      services: ['Hair Cut', 'Hair Color', 'Styling']
    },
    {
      id: '2',
      firstName: 'Alex',
      lastName: 'Rodriguez',
      email: 'alex@wellness.com',
      phone: '+1 (555) 234-5678',
      role: 'Massage Therapist',
      status: 'active',
      createdAt: '2024-02-01T15:45:00Z',
      location: 'Wellness Center',
      services: ['Deep Tissue', 'Swedish', 'Hot Stone']
    },
    {
      id: '3',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david@barbershop.com',
      phone: '+1 (555) 456-7890',
      role: 'Barber',
      status: 'active',
      createdAt: '2024-01-20T09:15:00Z',
      location: 'Barber Shop',
      services: ['Hair Cut', 'Beard Trim', 'Shave']
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@example.com',
      phone: '+1 (555) 456-7890',
      role: UserRole.TEAM_MEMBER,
      status: 'inactive',
      createdAt: '2024-01-10T14:20:00Z',
      location: 'Uptown Branch',
      services: ['Facial', 'Skin Care']
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.b@example.com',
      phone: '+1 (555) 567-8901',
      role: UserRole.TEAM_MEMBER,
      status: 'active',
      createdAt: '2024-02-05T11:30:00Z',
      location: 'Downtown',
      services: ['Massage', 'Hot Stone']
    },
    {
      id: '6',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.d@example.com',
      phone: '+1 (555) 678-9012',
      role: UserRole.TEAM_MEMBER,
      status: 'pending',
      createdAt: '2024-02-10T16:45:00Z',
      location: 'Spa Center',
      services: ['Swedish', 'Facial']
    },
    {
      id: '7',
      firstName: 'Robert',
      lastName: 'Miller',
      email: 'robert.m@example.com',
      phone: '+1 (555) 789-0123',
      role: UserRole.ADMIN,
      status: 'active',
      createdAt: '2024-01-25T13:15:00Z',
      location: 'Main Branch',
      services: ['Hair Cut', 'Styling']
    },
    {
      id: '8',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.a@example.com',
      phone: '+1 (555) 890-1234',
      role: UserRole.TEAM_MEMBER,
      status: 'inactive',
      createdAt: '2024-01-05T10:20:00Z',
      location: 'Beauty Studio',
      services: ['Skin Care', 'Microdermabrasion']
    },
    {
      id: '9',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.w@example.com',
      phone: '+1 (555) 901-2345',
      role: UserRole.TEAM_MEMBER,
      status: 'active',
      createdAt: '2024-02-15T09:30:00Z',
      location: 'Wellness Center',
      services: ['Deep Tissue', 'Hot Stone']
    },
    {
      id: '10',
      firstName: 'Maria',
      lastName: 'Taylor',
      email: 'maria.t@example.com',
      phone: '+1 (555) 012-3456',
      role: UserRole.TEAM_MEMBER,
      status: 'pending',
      createdAt: '2024-02-20T15:45:00Z',
      location: 'Main Branch',
      services: ['Facial', 'Skin Care']
    }]);
  const [isInviteSliderOpen, setIsInviteSliderOpen] = useState(false);
  const [isEditSliderOpen, setIsEditSliderOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
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
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([]);

  // Local filter state (used in filter card only)
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const [localRoleFilter, setLocalRoleFilter] = useState(roleFilter);
  const [localLocationFilter, setLocalLocationFilter] = useState(locationFilter);

  // Popover states
  const [statusOpen, setStatusOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Fetch team members and locations on component mount
  useEffect(() => {
    fetchTeamMembers();
    fetchLocations();
  }, []);

  // When opening the filter card, sync local state with main state
  React.useEffect(() => {
    if (showFilters) {
      setLocalStatusFilter(statusFilter);
      setLocalRoleFilter(roleFilter);
      setLocalLocationFilter(locationFilter);
    }
  }, [showFilters, statusFilter, roleFilter, locationFilter]);

  const fetchTeamMembers = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/team-members');
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      toast.error('Failed to fetch team members');
    }
  };

  const fetchLocations = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/locations');
      const data = await response.json();
      setLocations(data.map((loc: any) => ({ id: loc.id, name: loc.name })));
    } catch (error) {
      toast.error('Failed to fetch locations');
    }
  };

  const handleInviteTeamMember = async (inviteData: { email: string; role: string; location: string }) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/team-members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) throw new Error('Failed to send invitation');

      toast.success('Invitation sent successfully');
      setIsInviteSliderOpen(false);
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };



  const handleEditTeamMember = async (memberData: TeamMember) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/team-members/${memberData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      if (!response.ok) throw new Error('Failed to update team member');

      toast.success('Team member updated successfully');
      setIsEditSliderOpen(false);
      setEditingTeamMember(null);
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to update team member');
    }
  };



  const handleToggleStatus = async (teamMember: TeamMember) => {
    const newStatus = teamMember.status === 'active' ? 'inactive' : 'active';
    
    setPendingAction({
      type: 'toggleStatus',
      toggleStatusData: {
        id: teamMember.id,
        name: `${teamMember.firstName} ${teamMember.lastName}`,
        currentStatus: teamMember.status,
        newStatus: newStatus
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!pendingAction || pendingAction.type !== 'toggleStatus' || !pendingAction.toggleStatusData) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/team-members/${pendingAction.toggleStatusData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: pendingAction.toggleStatusData.newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Status updated to ${pendingAction.toggleStatusData.newStatus}`);
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    setPendingAction({
      type: 'delete',
      teamMemberId: id,
      teamMemberName: teamMembers.find(tm => tm.id === id)?.firstName + ' ' + teamMembers.find(tm => tm.id === id)?.lastName
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingAction || pendingAction.type !== 'delete' || !pendingAction.teamMemberId) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/team-members/${pendingAction.teamMemberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete team member');

      toast.success('Team member removed successfully');
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to remove team member');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleResendInvitation = async (id: string) => {
    setPendingAction({
      type: 'resend',
      teamMemberId: id,
      teamMemberName: teamMembers.find(tm => tm.id === id)?.firstName + ' ' + teamMembers.find(tm => tm.id === id)?.lastName
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmResend = async () => {
    if (!pendingAction || pendingAction.type !== 'resend' || !pendingAction.teamMemberId) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/team-members/${pendingAction.teamMemberId}/resend-invitation`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to resend invitation');

      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const openEditSlider = (teamMember: TeamMember) => {
    setEditingTeamMember(teamMember);
    setIsEditSliderOpen(true);
  };

  const getConfirmDialogContent = () => {
    if (!pendingAction) return null;

    switch (pendingAction.type) {
      case 'toggleStatus':
        return {
          title: 'Update Status',
          description: `Are you sure you want to change ${pendingAction.toggleStatusData?.name}'s status from ${pendingAction.toggleStatusData?.currentStatus} to ${pendingAction.toggleStatusData?.newStatus}?`,
          confirmText: 'Update Status',
          onConfirm: confirmToggleStatus
        };
      case 'delete':
        return {
          title: 'Remove Team Member',
          description: `Are you sure you want to remove ${pendingAction.teamMemberName} from the organisation?`,
          confirmText: 'Remove',
          onConfirm: confirmDelete
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case UserRole.OWNER:
        return <Badge className="bg-blue-100 text-blue-800">Owner</Badge>;
      case UserRole.MANAGER:
        return <Badge className="bg-orange-100 text-orange-800">Manager</Badge>;
      case UserRole.TEAM_MEMBER:
        return <Badge className="bg-gray-100 text-gray-800">Team Member</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Filter team members based on search, status, role, and location
  const filteredTeamMembers = teamMembers.filter(member => {
    const matchesSearch = member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'admin' && member.role === UserRole.ADMIN) ||
      (roleFilter === 'manager' && member.role === UserRole.MANAGER) ||
      (roleFilter === 'team_member' && member.role === UserRole.TEAM_MEMBER);
    const matchesLocation = locationFilter === 'all' || member.location === locationFilter;
    return matchesSearch && matchesStatus && matchesRole && matchesLocation;
  });

  // Get unique roles from data
  const uniqueRoles = Array.from(new Set(teamMembers.map(m => m.role)));

  // Stats
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
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
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Top Controls: Search, Filter, Add */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search members..."
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
          <div className="rounded-lg border border-input bg-white p-4 flex flex-col gap-4 shadow-md">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <Label className="mb-1 block">Status</Label>
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={statusOpen}
                      className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                    >
                      {localStatusFilter === 'all' ? 'All statuses' : localStatusFilter.charAt(0).toUpperCase() + localStatusFilter.slice(1)}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 z-[80]">
                    <Command>
                      <CommandInput placeholder="Search statuses..." />
                      <CommandList>
                        <CommandEmpty>No statuses found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setLocalStatusFilter('all');
                              setStatusOpen(false);
                            }}
                          >
                            All statuses
                          </CommandItem>
                          <CommandItem
                            value="active"
                            onSelect={() => {
                              setLocalStatusFilter('active');
                              setStatusOpen(false);
                            }}
                          >
                            Active
                          </CommandItem>
                          <CommandItem
                            value="inactive"
                            onSelect={() => {
                              setLocalStatusFilter('inactive');
                              setStatusOpen(false);
                            }}
                          >
                            Inactive
                          </CommandItem>
                          <CommandItem
                            value="pending"
                            onSelect={() => {
                              setLocalStatusFilter('pending');
                              setStatusOpen(false);
                            }}
                          >
                            Pending
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Role Filter */}
              <div className="flex-1">
                <Label className="mb-1 block">Role</Label>
                <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roleOpen}
                      className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                    >
                      {localRoleFilter === 'all' ? 'All roles' : localRoleFilter}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 z-[80]">
                    <Command>
                      <CommandInput placeholder="Search roles..." />
                      <CommandList>
                        <CommandEmpty>No roles found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setLocalRoleFilter('all');
                              setRoleOpen(false);
                            }}
                          >
                            All roles
                          </CommandItem>
                          {uniqueRoles.map(role => (
                            <CommandItem
                              key={role}
                              value={role}
                              onSelect={() => {
                                setLocalRoleFilter(role);
                                setRoleOpen(false);
                              }}
                            >
                              {role}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Location Filter */}
              <div className="flex-1">
                <Label className="mb-1 block">Location</Label>
                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={locationOpen}
                      className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                    >
                      {localLocationFilter === 'all' ? 'All locations' : localLocationFilter}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0 z-[80]">
                    <Command>
                      <CommandInput placeholder="Search locations..." />
                      <CommandList>
                        <CommandEmpty>No locations found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setLocalLocationFilter('all');
                              setLocationOpen(false);
                            }}
                          >
                            All locations
                          </CommandItem>
                          {Array.from(new Set(teamMembers.map(m => m.location).filter(Boolean))).map(location => (
                            <CommandItem
                              key={location}
                              value={location}
                              onSelect={() => {
                                                               setLocalLocationFilter(location!);
                               setLocationOpen(false);
                             }}
                           >
                             {location}
                           </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setLocalStatusFilter('all');
                  setLocalRoleFilter('all');
                  setLocalLocationFilter('all');
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setStatusFilter(localStatusFilter);
                  setRoleFilter(localRoleFilter);
                  setLocationFilter(localLocationFilter);
                  setShowFilters(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
        {/* Active Filter Badges - Always show when there are active filters */}
        {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || locationFilter !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
                onClick={() => setSearchTerm('')}
              >
                Search: "{searchTerm}"
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
                Location: {locationFilter}
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
            <div className="text-2xl font-bold text-green-600">{filteredTeamMembers.filter(m => m.status === 'active').length}</div>
            <div className="text-xs text-gray-500 mt-1">Active</div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{rolesCount}</div>
            <div className="text-xs text-gray-500 mt-1">Roles</div>
          </div>
        </div>
        {/* Member Cards */}
        <div className="space-y-3">
          {filteredTeamMembers.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="mb-4 text-gray-500">No team members found matching your filters.</div>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); setLocationFilter('all'); setShowFilters(false); }}>Clear filters</Button>
            </div>
          ) : (
            filteredTeamMembers.map(member => (
              <div key={member.id} className="rounded-xl border bg-white p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex flex-row items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center text-white font-bold text-lg">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  {/* Name, Role, Status */}
                  <div className="flex flex-col justify-start min-w-0">
                    <span className="font-semibold text-base truncate">{member.firstName} {member.lastName}</span>
                    <span className="text-sm text-gray-500 truncate">{member.role}</span>
                    {getStatusBadge(member.status)}
                  </div>
                  {/* Edit/Delete Icons */}
                  <div className="flex-1 flex justify-end items-start gap-1">
                    {member.status === 'pending' && (
                      <button 
                        className="p-2 rounded hover:bg-muted text-blue-600" 
                        title="Resend Invitation"
                        onClick={() => handleResendInvitation(member.id)}
                      >
                        <Mail className="h-5 w-5" />
                      </button>
                    )}
                    <button 
                      className="p-2 rounded hover:bg-muted" 
                      title="Edit"
                      onClick={() => openEditSlider(member)}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button 
                      className="p-2 rounded hover:bg-muted text-red-600" 
                      title="Delete"
                      onClick={() => handleDeleteTeamMember(member.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* Contact Info and Services, flush left under avatar */}
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
                        <span>{member.location}</span>
                      </div>
                    )}
                    {member.services && member.services.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Services:</div>
                        <div className="flex flex-wrap gap-2">
                          {member.services.map((s: string) => (
                            <span key={s} className="bg-white border px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
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
        onInvite={handleInviteTeamMember}
        locations={locations}
      />
      
      {/* Edit Team Member Slider */}
      <EditTeamMemberSlider 
        isOpen={isEditSliderOpen}
        onClose={() => setIsEditSliderOpen(false)}
        onUpdate={handleEditTeamMember}
        teamMember={editingTeamMember}
        locations={locations}
      />
    </AppLayout>
  );
}

// Add required roles for authentication
// TeamMembersPage.requireAuth = true;
// TeamMembersPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER];

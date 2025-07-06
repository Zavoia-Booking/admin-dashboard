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
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: 'Team Member',
    location: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'resend' | 'invite' | 'update' | 'toggleStatus';
    teamMemberId?: string;
    teamMemberName?: string;
    inviteData?: { email: string; role: string };
    updateData?: TeamMember;
    toggleStatusData?: { id: string; name: string; currentStatus: string; newStatus: string };
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([]);

  // Fetch team members and locations on component mount
  useEffect(() => {
    fetchTeamMembers();
    fetchLocations();
  }, []);

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

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show confirmation dialog instead of immediately sending
    setPendingAction({
      type: 'invite',
      inviteData: { email: newInvite.email, role: newInvite.role }
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmInvite = async () => {
    if (!pendingAction || pendingAction.type !== 'invite' || !pendingAction.inviteData) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/team-members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingAction.inviteData),
      });

      if (!response.ok) throw new Error('Failed to send invitation');

      toast.success('Invitation sent successfully');
      setIsInviteDialogOpen(false);
      setNewInvite({ email: '', role: 'Team Member', location: '' });
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleEditTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTeamMember) return;

    setPendingAction({
      type: 'update',
      updateData: editingTeamMember
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingAction || pendingAction.type !== 'update' || !pendingAction.updateData) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/team-members/${pendingAction.updateData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingAction.updateData),
      });

      if (!response.ok) throw new Error('Failed to update team member');

      toast.success('Team member updated successfully');
      setIsEditDialogOpen(false);
      setEditingTeamMember(null);
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to update team member');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
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

  const openEditDialog = (teamMember: TeamMember) => {
    setEditingTeamMember(teamMember);
    setIsEditDialogOpen(true);
  };

  const getConfirmDialogContent = () => {
    if (!pendingAction) return null;

    switch (pendingAction.type) {
      case 'invite':
        return {
          title: 'Send Invitation',
          description: `Are you sure you want to send an invitation to ${pendingAction.inviteData?.email}?`,
          confirmText: 'Send Invitation',
          onConfirm: confirmInvite
        };
      case 'update':
        return {
          title: 'Update Team Member',
          description: `Are you sure you want to update ${pendingAction.updateData?.firstName} ${pendingAction.updateData?.lastName}?`,
          confirmText: 'Update',
          onConfirm: confirmUpdate
        };
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

  // Filter team members based on search, status, and role
  const filteredTeamMembers = teamMembers.filter(member => {
    const matchesSearch = member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' ||
      (roleFilter === 'admin' && member.role === UserRole.ADMIN) ||
      (roleFilter === 'manager' && member.role === UserRole.MANAGER) ||
      (roleFilter === 'team_member' && member.role === UserRole.TEAM_MEMBER);
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Get unique roles from data
  const uniqueRoles = Array.from(new Set(teamMembers.map(m => m.role)));

  // Stats
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const rolesCount = uniqueRoles.length;
  const filteredCount = filteredTeamMembers.length;

  const confirmDialogContent = getConfirmDialogContent();

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
            className="flex items-center justify-center h-11 w-11 rounded-lg border border-input bg-white hover:bg-muted transition-colors"
            onClick={() => setShowFilters(v => !v)}
            aria-label="Show filters"
          >
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 px-4 rounded-lg bg-black hover:bg-gray-800 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Invite Member</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteTeamMember} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="mb-2 block">Role</Label>
                  <Select value={newInvite.role} onValueChange={(value) => setNewInvite({ ...newInvite, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="mb-2 block">Location</Label>
                  <Select value={newInvite.location} onValueChange={(value) => setNewInvite({ ...newInvite, location: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Send Invitation</Button>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Team Member Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Team Member</DialogTitle>
                <DialogDescription>
                  Update team member information.
                </DialogDescription>
              </DialogHeader>
              {editingTeamMember && (
                <form onSubmit={handleEditTeamMember} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="mb-2 block">First Name</Label>
                      <Input
                        id="firstName"
                        value={editingTeamMember.firstName}
                        onChange={(e) => setEditingTeamMember({ ...editingTeamMember, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="mb-2 block">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editingTeamMember.lastName}
                        onChange={(e) => setEditingTeamMember({ ...editingTeamMember, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editEmail" className="mb-2 block">Email</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editingTeamMember.email}
                      onChange={(e) => setEditingTeamMember({ ...editingTeamMember, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhone" className="mb-2 block">Phone</Label>
                    <Input
                      id="editPhone"
                      value={editingTeamMember.phone}
                      onChange={(e) => setEditingTeamMember({ ...editingTeamMember, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRole" className="mb-2 block">Role</Label>
                    <Select 
                      value={editingTeamMember.role} 
                      onValueChange={(value) => setEditingTeamMember({ ...editingTeamMember, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.TEAM_MEMBER}>Team Member</SelectItem>
                        <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editLocation" className="mb-2 block">Location</Label>
                    <Select 
                      value={editingTeamMember.location || 'none'} 
                      onValueChange={(value) => setEditingTeamMember({ ...editingTeamMember, location: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No location</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Update Team Member</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {/* Filter Panel (dropdown style) */}
        {showFilters && (
          <div className="rounded-lg border border-input bg-white p-4 flex flex-col gap-4 shadow-md">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="mb-1 block">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {uniqueRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="mb-1 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setShowFilters(false); }}>Clear filters</Button>
            </div>
          </div>
        )}
        {/* Active Filters as tags */}
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Search: "{searchTerm}"
              <button className="ml-2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></button>
            </span>
          )}
          {roleFilter !== 'all' && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Role: {roleFilter}
              <button className="ml-2" onClick={() => setRoleFilter('all')}><X className="h-4 w-4" /></button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
              Status: {statusFilter}
              <button className="ml-2" onClick={() => setStatusFilter('all')}><X className="h-4 w-4" /></button>
            </span>
          )}
        </div>
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
              <Button variant="outline" onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); setShowFilters(false); }}>Clear filters</Button>
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
                      onClick={() => openEditDialog(member)}
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
    </AppLayout>
  );
}

// Add required roles for authentication
// TeamMembersPage.requireAuth = true;
// TeamMembersPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER];

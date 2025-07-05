'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserRole } from '@/types/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Mail, Users, PowerOff, Power, Filter, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
// TODO: fix sonner / toast component
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
}

export default function TeamMembersPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      role: UserRole.ADMIN,
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 234-5678',
      role: UserRole.TEAM_MEMBER,
      status: 'active',
      createdAt: '2024-02-01T15:45:00Z'
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.j@example.com',
      phone: '+1 (555) 345-6789',
      role: UserRole.ADMIN,
      status: 'active',
      createdAt: '2024-01-20T09:15:00Z'
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@example.com',
      phone: '+1 (555) 456-7890',
      role: UserRole.TEAM_MEMBER,
      status: 'inactive',
      createdAt: '2024-01-10T14:20:00Z'
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.b@example.com',
      phone: '+1 (555) 567-8901',
      role: UserRole.TEAM_MEMBER,
      status: 'active',
      createdAt: '2024-02-05T11:30:00Z'
    },
    {
      id: '6',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.d@example.com',
      phone: '+1 (555) 678-9012',
      role: UserRole.TEAM_MEMBER,
      status: 'pending',
      createdAt: '2024-02-10T16:45:00Z'
    },
    {
      id: '7',
      firstName: 'Robert',
      lastName: 'Miller',
      email: 'robert.m@example.com',
      phone: '+1 (555) 789-0123',
      role: UserRole.ADMIN,
      status: 'active',
      createdAt: '2024-01-25T13:15:00Z'
    },
    {
      id: '8',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.a@example.com',
      phone: '+1 (555) 890-1234',
      role: UserRole.TEAM_MEMBER,
      status: 'inactive',
      createdAt: '2024-01-05T10:20:00Z'
    },
    {
      id: '9',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.w@example.com',
      phone: '+1 (555) 901-2345',
      role: UserRole.TEAM_MEMBER,
      status: 'active',
      createdAt: '2024-02-15T09:30:00Z'
    },
    {
      id: '10',
      firstName: 'Maria',
      lastName: 'Taylor',
      email: 'maria.t@example.com',
      phone: '+1 (555) 012-3456',
      role: UserRole.TEAM_MEMBER,
      status: 'pending',
      createdAt: '2024-02-20T15:45:00Z'
    }]);

  // Filter and pagination state
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Existing state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: 'Team Member',
  });
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'resend' | 'invite' | 'update' | 'toggleStatus';
    teamMemberId?: string;
    teamMemberName?: string;
    inviteData?: { email: string; role: string };
    updateData?: TeamMember;
    toggleStatusData?: { id: string; name: string; currentStatus: string; newStatus: string };
  } | null>(null);

  // Filter and pagination logic
  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter(teamMember => {
      const matchesSearch = appliedFilters.search === '' || 
        teamMember.firstName.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        teamMember.lastName.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        teamMember.email.toLowerCase().includes(appliedFilters.search.toLowerCase());
      
      const matchesRole = appliedFilters.role === 'all' || teamMember.role === appliedFilters.role;
      const matchesStatus = appliedFilters.status === 'all' || teamMember.status === appliedFilters.status;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [teamMembers, appliedFilters]);

  const paginatedTeamMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTeamMembers.slice(startIndex, endIndex);
  }, [filteredTeamMembers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTeamMembers.length / itemsPerPage);

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const handleRemoveFilters = () => {
    setFilters({ search: '', role: 'all', status: 'all' });
    setAppliedFilters({ search: '', role: 'all', status: 'all' });
    setCurrentPage(1);
  };

  const hasActiveFilters = appliedFilters.search !== '' || appliedFilters.role !== 'all' || appliedFilters.status !== 'all';

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Fetch team members on component mount
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/team-members');
      const data = await response.json();
      setTeamMembers(data);
    } catch (_error) {
      toast.error('Failed to fetch team members');
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
      setNewInvite({ email: '', role: 'Team Member' });
      fetchTeamMembers();
    } catch (_error) {
      toast.error('Failed to send invitation');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleEditTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeamMember) return;

    // Show confirmation dialog instead of immediately updating
    setPendingAction({
      type: 'update',
      updateData: editingTeamMember
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingAction || pendingAction.type !== 'update' || !pendingAction.updateData) return;

    try {
      // Mock implementation - update in local state
      setTeamMembers(prev => prev.map(teamMember => 
        teamMember.id === pendingAction.updateData!.id ? pendingAction.updateData! : teamMember
      ));
      
      toast.success('Team member updated successfully');
      setIsEditDialogOpen(false);
      setEditingTeamMember(null);
    } catch (error) {
      toast.error('Failed to update team member');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleToggleStatus = async (teamMember: TeamMember) => {
    const newStatus = teamMember.status === 'active' ? 'inactive' : 'active';
    
    // Show confirmation dialog
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
      // Mock implementation - update status in local state
      setTeamMembers(prev => prev.map(teamMember => 
        teamMember.id === pendingAction.toggleStatusData!.id 
          ? { ...teamMember, status: pendingAction.toggleStatusData!.newStatus as 'active' | 'inactive' }
          : teamMember
      ));
      
      const actionText = pendingAction.toggleStatusData.newStatus === 'active' ? 'activated' : 'deactivated';
      toast.success(`Account ${actionText} successfully`);
    } catch (error) {
      toast.error('Failed to update team member status');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    const teamMember = teamMembers.find(s => s.id === id);
    setPendingAction({
      type: 'delete',
      teamMemberId: id,
      teamMemberName: teamMember ? `${teamMember.firstName} ${teamMember.lastName}` : undefined
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingAction) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/team-members/${pendingAction.teamMemberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete team member');

      toast.success('Team member removed successfully');
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to delete team member');
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleResendInvitation = async (id: string) => {
    const teamMember = teamMembers.find(s => s.id === id);
    setPendingAction({
      type: 'resend',
      teamMemberId: id,
      teamMemberName: teamMember ? `${teamMember.firstName} ${teamMember.lastName}` : undefined
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmResend = async () => {
    if (!pendingAction) return;

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
    if (!pendingAction) return { title: '', description: '' };

    if (pendingAction.type === 'delete') {
      return {
        title: 'Remove Team Member',
        description: `Are you sure you want to remove ${pendingAction.teamMemberName || 'this team member'} from the organization?`
      };
    } else if (pendingAction.type === 'resend') {
      return {
        title: 'Resend Invitation',
        description: `Are you sure you want to resend the invitation to ${pendingAction.teamMemberName || 'this team member'}?`
      };
    } else if (pendingAction.type === 'invite') {
      const roleText = pendingAction.inviteData?.role === 'Manager' ? 'Manager' : 'Team Member';
      return {
        title: 'Send Invitation',
        description: `Are you sure you want to send an invitation to ${pendingAction.inviteData?.email} as a ${roleText}?`
      };
    } else if (pendingAction.type === 'update') {
      return {
        title: 'Update Team Member',
        description: `Are you sure you want to update ${pendingAction.updateData?.firstName} ${pendingAction.updateData?.lastName}?`
      };
    } else if (pendingAction.type === 'toggleStatus') {
      const actionText = pendingAction.toggleStatusData?.newStatus === 'active' ? 'activated' : 'deactivated';
      return {
        title: `${pendingAction.toggleStatusData?.newStatus === 'active' ? 'Activate' : 'Deactivate'} Account`,
        description: `Are you sure you want to ${actionText} the account for ${pendingAction.toggleStatusData?.name}?`
      };
    }
    
    return { title: '', description: '' };
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Team Members</h1>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Invite a team member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team. They will receive an email with registration instructions.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteTeamMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newInvite.email}
                      onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newInvite.role}
                      onValueChange={(value) => setNewInvite({ ...newInvite, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Team Member">Team Member</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Send Invitation
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Confirmation Dialog */}
          <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{getConfirmDialogContent().title}</DialogTitle>
                <DialogDescription>
                  {getConfirmDialogContent().description}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsConfirmDialogOpen(false);
                    setPendingAction(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={pendingAction?.type === 'delete' ? confirmDelete : 
                          pendingAction?.type === 'resend' ? confirmResend : 
                          pendingAction?.type === 'invite' ? confirmInvite :
                          pendingAction?.type === 'update' ? confirmUpdate :
                          pendingAction?.type === 'toggleStatus' ? confirmToggleStatus : undefined}
                >
                  {pendingAction?.type === 'delete' ? 'Remove' : 
                   pendingAction?.type === 'resend' ? 'Resend' : 
                   pendingAction?.type === 'invite' ? 'Send Invitation' :
                   pendingAction?.type === 'update' ? 'Update' :
                   pendingAction?.type === 'toggleStatus' ? (pendingAction.toggleStatusData?.newStatus === 'active' ? 'Activate' : 'Deactivate') : ''}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Team Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditTeamMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={editingTeamMember?.firstName || ''}
                      onChange={(e) => setEditingTeamMember(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={editingTeamMember?.lastName || ''}
                      onChange={(e) => setEditingTeamMember(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingTeamMember?.email || ''}
                    onChange={(e) => setEditingTeamMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone Number</Label>
                  <Input
                    id="editPhone"
                    value={editingTeamMember?.phone || ''}
                    onChange={(e) => setEditingTeamMember(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select
                    value={editingTeamMember?.role || ''}
                    onValueChange={(value) => setEditingTeamMember(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Update Team Member
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Filters Section */}
          <div className="mb-6">
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                                 {hasActiveFilters && (
                   <Badge variant="secondary" className="ml-2">
                     {[
                       appliedFilters.search !== '',
                       appliedFilters.role !== 'all',
                       appliedFilters.status !== 'all'
                     ].filter(Boolean).length} active filter{[
                       appliedFilters.search !== '',
                       appliedFilters.role !== 'all',
                       appliedFilters.status !== 'all'
                     ].filter(Boolean).length !== 1 ? 's' : ''}
                   </Badge>
                 )}
              </div>
              
              <CollapsibleContent className="mt-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Search by name or email..."
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="roleFilter">Role</Label>
                      <Select
                        value={filters.role}
                        onValueChange={(value) => setFilters({ ...filters, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="Team Member">Team Member</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="statusFilter">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleApplyFilters}>
                      Apply Filters
                    </Button>
                    <Button variant="outline" onClick={handleRemoveFilters}>
                      Remove Filters
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Table className="rounded-xl bg-white overflow-hidden">
            <TableHeader>
              <TableRow className="bg-gray-100 border-b-2 border-gray-200">
                <TableHead className="font-semibold text-gray-700 px-6 py-4">First Name</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Last Name</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Email</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Phone</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Role</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Account Status</TableHead>
                <TableHead className="font-semibold text-gray-700 px-6 py-4">Created At</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeamMembers.map((teamMember, index) => (
                <TableRow key={teamMember.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors border-b border-gray-200`}>
                  <TableCell className="font-medium px-6 py-4">{teamMember.firstName}</TableCell>
                  <TableCell className="font-medium px-6 py-4">{teamMember.lastName}</TableCell>
                  <TableCell className="px-6 py-4">{teamMember.email}</TableCell>
                  <TableCell className="px-6 py-4">{teamMember.phone}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      teamMember.role === 'Manager' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {teamMember.role}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      teamMember.status === 'active' ? 'bg-green-100 text-green-800' :
                      teamMember.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {teamMember.status.charAt(0).toUpperCase() + teamMember.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">{new Date(teamMember.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {teamMember.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleResendInvitation(teamMember.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleStatus(teamMember)}
                        title={teamMember.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {teamMember.status === 'active' ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(teamMember)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteTeamMember(teamMember.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredTeamMembers.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTeamMembers.length)} of {filteredTeamMembers.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm text-gray-500">
                    Items per page:
                  </Label>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current page
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => {
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page > prevPage + 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {filteredTeamMembers.length === 0 && (
            <div className="mt-6 text-center py-8 text-gray-500">
              {hasActiveFilters ? 'No team members match the current filters.' : 'No team members found.'}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Add required roles for authentication
// TeamMembersPage.requireAuth = true;
// TeamMembersPage.requiredRoles = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER];

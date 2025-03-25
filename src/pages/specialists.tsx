'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientContext } from '@/contexts/clientContext';
// TODO: fix sonner / toast component
import { toast } from 'sonner';
import { AppLayout } from '@/components/layouts/app-layout';

interface Specialist {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
}

export default function SpecialistsPage() {
  const router = useRouter();
  const { data: { user } } = useClientContext();
  const [specialists, setSpecialists] = useState<Specialist[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 234-5678',
      status: 'pending',
      createdAt: '2024-02-01T15:45:00Z'
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.j@example.com',
      phone: '+1 (555) 345-6789',
      status: 'active',
      createdAt: '2024-01-20T09:15:00Z'
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@example.com',
      phone: '+1 (555) 456-7890',
      status: 'inactive',
      createdAt: '2024-01-10T14:20:00Z'
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.b@example.com',
      phone: '+1 (555) 567-8901',
      status: 'active',
      createdAt: '2024-02-05T11:30:00Z'
    },
    {
      id: '6',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.d@example.com',
      phone: '+1 (555) 678-9012',
      status: 'pending',
      createdAt: '2024-02-10T16:45:00Z'
    },
    {
      id: '7',
      firstName: 'Robert',
      lastName: 'Miller',
      email: 'robert.m@example.com',
      phone: '+1 (555) 789-0123',
      status: 'active',
      createdAt: '2024-01-25T13:15:00Z'
    },
    {
      id: '8',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.a@example.com',
      phone: '+1 (555) 890-1234',
      status: 'inactive',
      createdAt: '2024-01-05T10:20:00Z'
    },
    {
      id: '9',
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.w@example.com',
      phone: '+1 (555) 901-2345',
      status: 'active',
      createdAt: '2024-02-15T09:30:00Z'
    },
    {
      id: '10',
      firstName: 'Maria',
      lastName: 'Taylor',
      email: 'maria.t@example.com',
      phone: '+1 (555) 012-3456',
      status: 'pending',
      createdAt: '2024-02-20T15:45:00Z'
    }]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [newSpecialist, setNewSpecialist] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Fetch specialists on component mount
  useEffect(() => {
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/specialists');
      const data = await response.json();
      setSpecialists(data);
    } catch (error) {
      toast.error('Failed to fetch specialists');
    }
  };

  const handleCreateSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/specialists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSpecialist),
      });

      if (!response.ok) throw new Error('Failed to create specialist');

      toast.success('Specialist created successfully');
      setIsCreateDialogOpen(false);
      setNewSpecialist({ firstName: '', lastName: '', email: '', phone: '' });
      fetchSpecialists();
    } catch (error) {
      toast.error('Failed to create specialist');
    }
  };

  const handleEditSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialist) return;

    try {
      const response = await fetch(`/api/specialists/${editingSpecialist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: editingSpecialist.firstName,
          lastName: editingSpecialist.lastName,
          email: editingSpecialist.email,
          phone: editingSpecialist.phone,
        }),
      });

      if (!response.ok) throw new Error('Failed to update specialist');

      toast.success('Specialist updated successfully');
      setIsEditDialogOpen(false);
      setEditingSpecialist(null);
      fetchSpecialists();
    } catch (error) {
      toast.error('Failed to update specialist');
    }
  };

  const handleDeleteSpecialist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialist?')) return;

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/specialists/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete specialist');

      toast.success('Specialist deleted successfully');
      fetchSpecialists();
    } catch (error) {
      toast.error('Failed to delete specialist');
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/specialists/${id}/resend-invitation`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to resend invitation');

      toast.success('Invitation resent successfully');
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  const openEditDialog = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    setIsEditDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Specialists</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Specialist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Specialist</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSpecialist} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newSpecialist.firstName}
                      onChange={(e) => setNewSpecialist({ ...newSpecialist, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newSpecialist.lastName}
                      onChange={(e) => setNewSpecialist({ ...newSpecialist, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSpecialist.email}
                    onChange={(e) => setNewSpecialist({ ...newSpecialist, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newSpecialist.phone}
                    onChange={(e) => setNewSpecialist({ ...newSpecialist, phone: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Specialist
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Specialist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSpecialist} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editingSpecialist?.firstName || ''}
                    onChange={(e) => setEditingSpecialist(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editingSpecialist?.lastName || ''}
                    onChange={(e) => setEditingSpecialist(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingSpecialist?.email || ''}
                  onChange={(e) => setEditingSpecialist(prev => prev ? { ...prev, email: e.target.value } : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={editingSpecialist?.phone || ''}
                  onChange={(e) => setEditingSpecialist(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Update Specialist
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specialists.map((specialist) => (
              <TableRow key={specialist.id}>
                <TableCell>{`${specialist.firstName} ${specialist.lastName}`}</TableCell>
                <TableCell>{specialist.email}</TableCell>
                <TableCell>{specialist.phone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    specialist.status === 'active' ? 'bg-green-100 text-green-800' :
                    specialist.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {specialist.status.charAt(0).toUpperCase() + specialist.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{new Date(specialist.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {specialist.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleResendInvitation(specialist.id)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(specialist)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteSpecialist(specialist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "../../../shared/components/ui/button";
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';

// TODO: fix sonner / toast component
import { toast } from 'sonner';
import { AppLayout } from '../../../shared/components/layouts/app-layout';

import { Plus, Trash2, Upload, Clock, MapPin, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { UserRole } from '../../../shared/types/auth';

interface BusinessProfile {
  id: string;
  name: string;
  heroText: string;
  about: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  images: {
    id: string;
    url: string;
    type: 'slideshow' | 'hero' | 'logo';
    order?: number;
  }[];
  workingHours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  displayedTeamMembers: string[]; // Array of team member IDs
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile>({
    id: '1',
    name: 'Beauty Salon',
    heroText: 'Welcome to our salon',
    about: 'We provide high-quality beauty services...',
    contact: {
      email: 'contact@beautysalon.com',
      phone: '+1 (555) 123-4567',
      address: '123 Beauty Street',
    },
    images: [
      {
        id: '1',
        url: '/images/slideshow-1.jpg',
        type: 'slideshow',
        order: 1,
      },
      {
        id: '2',
        url: '/images/hero.jpg',
        type: 'hero',
      },
      {
        id: '3',
        url: '/images/logo.png',
        type: 'logo',
      },
    ],
    workingHours: [
      { day: 'Monday', open: '09:00', close: '18:00', isClosed: false },
      { day: 'Tuesday', open: '09:00', close: '18:00', isClosed: false },
      { day: 'Wednesday', open: '09:00', close: '18:00', isClosed: false },
      { day: 'Thursday', open: '09:00', close: '18:00', isClosed: false },
      { day: 'Friday', open: '09:00', close: '18:00', isClosed: false },
      { day: 'Saturday', open: '10:00', close: '16:00', isClosed: false },
      { day: 'Sunday', open: '', close: '', isClosed: true },
    ],
    location: {
      address: '123 Beauty Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      coordinates: {
        lat: 40.7128,
        lng: -74.0060,
      },
    },
    displayedTeamMembers: ['1', '2', '3'],
  });

  const [teamMembers, setTeamMembers] = useState<any[]>([]); // Replace with proper type
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'add' | 'remove' | null>(null);

  useEffect(() => {
    // Populate with example team members
    setTeamMembers([
      {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@beautysalon.com',
        phone: '+1 (555) 123-4567',
        status: 'active'
      },
      {
        id: '2',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.c@beautysalon.com',
        phone: '+1 (555) 234-5678',
        status: 'active'
      },
      {
        id: '3',
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma.d@beautysalon.com',
        phone: '+1 (555) 345-6789',
        status: 'active'
      },
      {
        id: '4',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.w@beautysalon.com',
        phone: '+1 (555) 456-7890',
        status: 'active'
      },
      {
        id: '5',
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.a@beautysalon.com',
        phone: '+1 (555) 567-8901',
        status: 'active'
      }
    ]);
  }, []);

  const handleImageUpload = async (type: 'slideshow' | 'hero' | 'logo', file: File) => {
    // TODO: Implement image upload
    toast.success('Image uploaded successfully');
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement profile update
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Business Profile Settings</h1>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="hours">Working Hours</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="team-members">Team Members</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroText">Hero Text</Label>
                  <Input
                    id="heroText"
                    value={profile.heroText}
                    onChange={(e) => setProfile({ ...profile, heroText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    value={profile.about}
                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Information</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Email"
                      value={profile.contact.email}
                      onChange={(e) => setProfile({
                        ...profile,
                        contact: { ...profile.contact, email: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Phone"
                      value={profile.contact.phone}
                      onChange={(e) => setProfile({
                        ...profile,
                        contact: { ...profile.contact, phone: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 border rounded-lg flex items-center justify-center">
                      {profile.images.find(img => img.type === 'logo') ? (
                        <img
                          src={profile.images.find(img => img.type === 'logo')?.url}
                          alt="Logo"
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                {/* Hero Background Upload */}
                <div className="space-y-2">
                  <Label>Hero Background</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-full h-48 border rounded-lg flex items-center justify-center">
                      {profile.images.find(img => img.type === 'hero') ? (
                        <img
                          src={profile.images.find(img => img.type === 'hero')?.url}
                          alt="Hero"
                          className="max-w-full max-h-full object-cover"
                        />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Hero
                    </Button>
                  </div>
                </div>

                {/* Slideshow Images */}
                <div className="space-y-2">
                  <Label>Slideshow Images</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {profile.images
                      .filter(img => img.type === 'slideshow')
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-video border rounded-lg overflow-hidden">
                            <img
                              src={image.url}
                              alt="Slideshow"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    <Button variant="outline" className="aspect-video">
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Working Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.workingHours.map((hours, index) => (
                  <div key={hours.day} className="flex items-center gap-4">
                    <div className="w-24">{hours.day}</div>
                    <Switch
                      checked={!hours.isClosed}
                      onCheckedChange={(checked) => {
                        const newHours = [...profile.workingHours];
                        newHours[index] = {
                          ...hours,
                          isClosed: !checked,
                        };
                        setProfile({ ...profile, workingHours: newHours });
                      }}
                    />
                    {!hours.isClosed && (
                      <>
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => {
                            const newHours = [...profile.workingHours];
                            newHours[index] = {
                              ...hours,
                              open: e.target.value,
                            };
                            setProfile({ ...profile, workingHours: newHours });
                          }}
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => {
                            const newHours = [...profile.workingHours];
                            newHours[index] = {
                              ...hours,
                              close: e.target.value,
                            };
                            setProfile({ ...profile, workingHours: newHours });
                          }}
                        />
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.location.address}
                    onChange={(e) => setProfile({
                      ...profile,
                      location: { ...profile.location, address: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.location.city}
                      onChange={(e) => setProfile({
                        ...profile,
                        location: { ...profile.location, city: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profile.location.state}
                      onChange={(e) => setProfile({
                        ...profile,
                        location: { ...profile.location, state: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={profile.location.zipCode}
                      onChange={(e) => setProfile({
                        ...profile,
                        location: { ...profile.location, zipCode: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.location.country}
                      onChange={(e) => setProfile({
                        ...profile,
                        location: { ...profile.location, country: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team-members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Showcased Team Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Select onValueChange={(value) => {
                        setSelectedTeamMember(value);
                        setDialogAction('add');
                        setIsDialogOpen(true);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((teamMember) => (
                            <SelectItem key={teamMember.id} value={teamMember.id}>
                              {teamMember.firstName} {teamMember.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {dialogAction === 'add' ? 'Showcase a Team Member' : 'Remove Team Member'}
                        </DialogTitle>
                        <DialogDescription>
                          {dialogAction === 'add' 
                            ? 'Are you sure you want to showcase this team member on your landing page?'
                            : 'Are you sure you want to stop showcasing this team member on your landing page?'}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setSelectedTeamMember(null);
                            setDialogAction(null);
                          }}
                        >
                          No
                        </Button>
                        <Button
                          variant={dialogAction === 'remove' ? 'destructive' : 'default'}
                          onClick={() => {
                            // Handle adding/removing team member from displayed list
                            setIsDialogOpen(false);
                            setSelectedTeamMember(null);
                            setDialogAction(null);
                          }}
                        >
                          Yes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Phone</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((teamMember) => (
                        <tr key={teamMember.id} className="border-b">
                          <td className="p-4 align-middle">
                            {teamMember.firstName} {teamMember.lastName}
                          </td>
                          <td className="p-4 align-middle">{teamMember.email}</td>
                          <td className="p-4 align-middle">{teamMember.phone}</td>
                          <td className="p-4 align-middle">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTeamMember(teamMember.id);
                                setDialogAction('remove');
                                setIsDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveProfile}>
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import InviteTeamMemberSlider from '@/components/TeamMembers/InviteTeamMemberSlider';
import { BaseSlider } from '@/components/common/BaseSlider';

interface Location {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  description: string;
  workingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  status: 'active' | 'inactive';
  createdAt: string;
}

interface EditLocationSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (locationData: Location) => void;
  location: Location | null;
}

const mockTeamMembers = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma@salon.com',
    phone: '+1 (555) 123-4567',
    role: 'Senior Stylist',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    location: 'Downtown Salon',
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
    location: 'Westside Branch',
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
    location: 'Mall Location',
  },
];

const EditLocationSlider: React.FC<EditLocationSliderProps> = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  location 
}) => {
  const [formData, setFormData] = useState<Location | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isInviteSliderOpen, setIsInviteSliderOpen] = useState(false);

  useEffect(() => {
    if (location && isOpen) {
      setFormData({ ...location });
    }
  }, [location, isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setFormData(null), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    if (formData) {
      onUpdate(formData);
      setShowConfirmDialog(false);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!formData) return null;

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Location"
        contentClassName="bg-muted/50 scrollbar-hide"
        footer={
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-location-form"
              className="flex-1"
            >
              Update Location
            </Button>
          </div>
        }
      >
        <form id="edit-location-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
            <CardContent className="space-y-8">
              {/* Location Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Location Information</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">Location Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter location name..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-foreground">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter full address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="border-0 bg-muted/50 focus:bg-background text-base resize-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the location..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="border-0 bg-muted/50 focus:bg-background text-base resize-none"
                  />
                </div>
                {/* Team Members Assigned Section */}
                <div className="space-y-2 mt-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Assigned Team Members</h3>
                    <Button
                      type="button"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setIsInviteSliderOpen(true)}
                    >
                      Invite Member
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {mockTeamMembers.filter(m => m.location === formData.name).length > 0 ? (
                      mockTeamMembers.filter(m => m.location === formData.name).map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{member.firstName} {member.lastName}</div>
                              <div className="text-xs text-muted-foreground">{member.email} &middot; {member.role}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border/50 text-center">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No team members assigned to this location</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number..."
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Update Location
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to update the location "{formData.name}"? This will save all changes.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Update Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Team Member Slider */}
      <InviteTeamMemberSlider
        isOpen={isInviteSliderOpen}
        onClose={() => setIsInviteSliderOpen(false)}
        onInvite={() => setIsInviteSliderOpen(false)}
        locations={[
          { id: formData.id, name: formData.name }
        ]}
      />
    </>
  );
};

export default EditLocationSlider; 
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { MapPin, Phone, AlertCircle, Users } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import InviteTeamMemberSlider from '../../teamMembers/components/InviteTeamMemberSlider';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import type { LocationType } from '../../../shared/types/location';
import type { EditLocationType } from '../types';
import { updateLocationAction } from '../actions';
import { mockTeamMembers } from '../../../mocks/team-members.mock';
import { Switch } from '../../../shared/components/ui/switch';
import { mapLocationForEdit } from '../utils';

interface EditLocationSliderProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationType | null;
}

const EditLocationSlider: React.FC<EditLocationSliderProps> = ({ 
  isOpen, 
  onClose, 
  location 
}) => {
  const dispatch = useDispatch();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isInviteSliderOpen, setIsInviteSliderOpen] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<EditLocationType>();

  useEffect(() => {
    if (location && isOpen) {
      reset({
        name: location.name,
        address: location.address,
        email: location.email,
        phone: location.phone,
        description: location.description,
        timezone: location.timezone,
        isRemote: location.isRemote,
        isActive: location.isActive,
      });
    }
  }, [location, isOpen, reset]);

  if (!location) return null;

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    const updates = watch();
    const mappedLocation: EditLocationType = mapLocationForEdit(location);
    const payload: EditLocationType = { ...mappedLocation, ...updates };
    dispatch(updateLocationAction.request({ location: payload }));
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

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
        <form id="edit-location-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
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
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                    {...register('name', { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-foreground">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter full address..."
                    rows={3}
                    className="border-0 bg-muted/50 focus:bg-background text-base resize-none"
                    {...register('address', { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the location..."
                    rows={3}
                    className="border-0 bg-muted/50 focus:bg-background text-base resize-none"
                    {...register('description')}
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
                    {mockTeamMembers.filter(m => m.location === watch('name')).length > 0 ? (
                      mockTeamMembers.filter(m => m.location === watch('name')).map(member => (
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
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                    {...register('email', { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number..."
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                    {...register('phone', { required: true })}
                  />
                </div>
              </div>

              {/* Location Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">Active</Label>
                  </div>
                  <Switch
                    checked={!!watch('isActive')}
                    onCheckedChange={(checked) => {
                      const current = watch();
                      const next: EditLocationType = { ...current, isActive: checked } as EditLocationType;
                      reset(next);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">Remote location</Label>
                  </div>
                  <Switch
                    checked={!!watch('isRemote')}
                    onCheckedChange={(checked) => {
                      const current = watch();
                      // ensure we keep other values intact
                      const next: EditLocationType = { ...current, isRemote: checked } as EditLocationType;
                      reset(next);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-medium text-foreground">Timezone</Label>
                  <Input
                    id="timezone"
                    type="text"
                    placeholder="e.g., America/New_York"
                    className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                    {...register('timezone', { required: true })}
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
              {`Are you sure you want to update the location "${watch('name')}"? This will save all changes.`}
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
          { id: location.id, name: watch('name') }
        ]}
      />
    </>
  );
};

export default EditLocationSlider; 
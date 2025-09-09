import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, UserPlus, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { useForm } from 'react-hook-form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import { cn } from '../../../shared/lib/utils';
import { UserRole } from '../../../shared/types/auth';

interface InviteTeamMemberSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (inviteData: { email: string; role: string; }) => void;
  locations: Array<{ id: string; name: string }>;
}

interface InviteFormData {
  email: string;
  role: UserRole;
  location: string;
}

const initialFormData: InviteFormData = {
  email: '',
  role: UserRole.TEAM_MEMBER,
  location: ''
};

const InviteTeamMemberSlider: React.FC<InviteTeamMemberSliderProps> = ({ 
  isOpen, 
  onClose, 
  onInvite, 
  locations 
}) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, watch } = useForm<InviteFormData>({
    defaultValues: initialFormData
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Popover states
  const [roleOpen, setRoleOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Available roles
  const roles = [
    { value: UserRole.MANAGER, label: 'Manager' },
    { value: UserRole.TEAM_MEMBER, label: 'Team Member' }
  ];

  // Reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
    }
  }, [isOpen, reset]);

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmInvite = () => {
    const data: InviteFormData = {
      email: watch('email'),
      role: watch('role') as UserRole,
      location: watch('location')
    };
    onInvite(data);
    setShowConfirmDialog(false);
    onClose();
    reset(initialFormData);
  };

  const handleCancel = () => {
    onClose();
    reset(initialFormData);
  };

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title="Invite Team Member"
        contentClassName="bg-muted/50 scrollbar-hide"
        footer={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="invite-team-member-form"
              className="flex-1 gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        }
      >
        <form id="invite-team-member-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
            <CardContent className="space-y-8">
              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address..."
                    aria-invalid={!!errors.email}
                    className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                    {...register('email', { required: true })}
                  />
                </div>
              </div>

              {/* Role Assignment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Role Assignment</h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Role</Label>
                  <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={roleOpen}
                        className="w-full h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm justify-between"
                      >
                        {/* role is stored via RHF hidden input */}
                        {/* Show selected value by watching via UI state replacement */}
                        {/* For simplicity, we display from data attr later */}
                        Select role...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search roles..." />
                        <CommandList>
                          <CommandEmpty>No roles found.</CommandEmpty>
                          <CommandGroup>
                            {roles.map((role) => (
                              <CommandItem
                                key={role.value}
                                value={role.value}
                                onSelect={(currentValue) => {
                                  setValue('role', currentValue as UserRole, { shouldDirty: true, shouldTouch: true });
                                  setRoleOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    "opacity-0"
                                  )}
                                />
                                {role.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" {...register('role')} name="role" value={undefined as any} />
                </div>
              </div>

              {/* Location Assignment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Location Assignment</h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Primary Location</Label>
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={locationOpen}
                        className="w-full h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm justify-between"
                      >
                        Select location...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search locations..." />
                        <CommandList>
                          <CommandEmpty>No locations found.</CommandEmpty>
                          <CommandGroup>
                            {locations.map((location) => (
                              <CommandItem
                                key={location.id}
                                value={location.name}
                                onSelect={() => {
                                  setValue('location', location.id, { shouldDirty: true, shouldTouch: true });
                                  setLocationOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    "opacity-0"
                                  )}
                                />
                                {location.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" {...register('location', { required: true })} name="location" value={undefined as any} />
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
            <AlertDialogTitle>Send Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send an invitation to {watch('email')} as a {watch('role')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInvite}>
              Send Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InviteTeamMemberSlider; 
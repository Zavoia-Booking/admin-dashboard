import React, { useState, useEffect } from 'react';
import { User, Mail, UserPlus, ChevronsUpDown, Check, MapPin } from 'lucide-react';
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
import type { InviteTeamMemberPayload } from '../types';
import { userRoles } from '../../../shared/constants';
import { useDispatch, useSelector } from 'react-redux';
import { getAllLocationsSelector, getCurrentLocationSelector } from '../../locations/selectors';
import { inviteTeamMemberAction } from '../actions';

interface InviteTeamMemberSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFormData: InviteTeamMemberPayload = {
  email: '',
  role: UserRole.TEAM_MEMBER,
  locationIds: [],
};

const InviteTeamMemberSlider: React.FC<InviteTeamMemberSliderProps> = ({ 
  isOpen, 
  onClose, 
}) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, setValue, reset, formState: { errors }, watch } = useForm<InviteTeamMemberPayload>({
    defaultValues: initialFormData
  });
  const locations = useSelector(getAllLocationsSelector);
  const currentLocation = useSelector(getCurrentLocationSelector);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Popover states
  const [roleOpen, setRoleOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Prefill/lock location based on current location, and reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      return;
    }
    if (currentLocation?.id) {
      setValue('locationIds', [currentLocation.id], { shouldDirty: true, shouldTouch: true });
    } else {
      // allow free selection on All locations
      setValue('locationIds', [], { shouldDirty: true, shouldTouch: true });
    }
  }, [isOpen, reset, setValue, currentLocation?.id]);

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmInvite = () => {
    const data: InviteTeamMemberPayload = {
      email: watch('email'),
      role: watch('role') as UserRole,
      locationIds: watch('locationIds')
    };
    dispatch(inviteTeamMemberAction.request(data));
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
                        {(() => {
                          const value = watch('role') as unknown as UserRole | undefined;
                          const selected = userRoles.find(r => r.value === value);
                          return selected ? selected.label : 'Select role...';
                        })()}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search roles..." />
                        <CommandList>
                          <CommandEmpty>No roles found.</CommandEmpty>
                          <CommandGroup>
                            {userRoles.map((role) => (
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
                                    (watch('role') === role.value ? 'opacity-100' : 'opacity-0')
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
                  <Label className="text-sm font-medium text-foreground">Location</Label>
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={locationOpen}
                        className="w-full h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm justify-between"
                        disabled={!!currentLocation?.id}
                      >
                        {(() => {
                          const selected = (watch('locationIds') || []) as number[];
                          if (currentLocation?.id) return currentLocation.name;
                          if (selected.length === 0) return 'Select locations...';
                          const names = selected
                            .map(id => locations.find(l => l.id === id)?.name)
                            .filter(Boolean) as string[];
                          return names.length === 1 ? names[0] : `${names.length} selected`;
                        })()}
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
                                  if (currentLocation?.id) return;
                                  const current = new Set((watch('locationIds') || []) as number[]);
                                  if (current.has(location.id)) {
                                    current.delete(location.id);
                                  } else {
                                    current.add(location.id);
                                  }
                                  setValue('locationIds', Array.from(current), { shouldDirty: true, shouldTouch: true });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    (((watch('locationIds') || []) as number[]).includes(location.id) ? 'opacity-100' : 'opacity-0')
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
                  <input type="hidden" {...register('locationIds', { required: true })} name="locationIds" value={undefined as any} />
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
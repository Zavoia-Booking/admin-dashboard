import React, { useState } from 'react';
import { User, Mail, MapPin, UserPlus, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { BaseSlider } from '../common/BaseSlider';
import { cn } from '../../lib/utils';

interface InviteTeamMemberSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (inviteData: { email: string; role: string; location: string }) => void;
  locations: Array<{ id: string; name: string }>;
}

interface InviteFormData {
  email: string;
  role: string;
  location: string;
}

const initialFormData: InviteFormData = {
  email: '',
  role: 'Team Member',
  location: ''
};

const InviteTeamMemberSlider: React.FC<InviteTeamMemberSliderProps> = ({ 
  isOpen, 
  onClose, 
  onInvite, 
  locations 
}) => {
  const [formData, setFormData] = useState<InviteFormData>(initialFormData);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Popover states
  const [roleOpen, setRoleOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Available roles
  const roles = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Team Member', label: 'Team Member' }
  ];

  // Reset form when slider closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmInvite = () => {
    onInvite(formData);
    setShowConfirmDialog(false);
    onClose();
    setFormData(initialFormData);
  };

  const handleCancel = () => {
    onClose();
    setFormData(initialFormData);
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
        <form id="invite-team-member-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                    required
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
                        {formData.role || "Select role..."}
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
                                  setFormData({ ...formData, role: currentValue });
                                  setRoleOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.role === role.value ? "opacity-100" : "opacity-0"
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
                        {formData.location 
                          ? locations.find(loc => loc.id === formData.location)?.name 
                          : "Select location..."}
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
                                  setFormData({ ...formData, location: location.id });
                                  setLocationOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.location === location.id ? "opacity-100" : "opacity-0"
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
              Are you sure you want to send an invitation to {formData.email} as a {formData.role}?
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
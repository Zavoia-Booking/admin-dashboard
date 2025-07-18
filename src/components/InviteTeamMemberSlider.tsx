import React, { useState, useRef } from 'react';
import { ArrowLeft, User, Mail, MapPin, UserPlus, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

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
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Popover states
  const [roleOpen, setRoleOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Reset form when slider closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen]);

  // Handle animation timing
  React.useEffect(() => {
    if (isOpen) {
      // Ensure component is in closed state first, then animate
      setShouldAnimate(false);
      const timer = setTimeout(() => setShouldAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isOpen]);

  // Swipe gesture handling
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const isMouseDown = useRef<boolean>(false);

  const handleStart = (clientX: number) => {
    touchStartX.current = clientX;
    touchCurrentX.current = clientX;
    setIsDragging(true);
    isMouseDown.current = true;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging && !isMouseDown.current) return;
    
    touchCurrentX.current = clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    
    // Only allow rightward swipes (positive diff)
    if (diff > 0) {
      setDragOffset(Math.min(diff, 300)); // Cap at 300px
    }
  };

  const handleEnd = () => {
    if (!isDragging && !isMouseDown.current) return;
    
    const diff = touchCurrentX.current - touchStartX.current;
    
    // If swiped more than 100px to the right, close the slider
    if (diff > 100) {
      onClose();
      setFormData(initialFormData);
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    isMouseDown.current = false;
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.closest('button') || target.closest('input') || target.closest('select') || target.closest('[role="button"]') || target.closest('[role="combobox"]')) {
      return;
    }
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleEnd();
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.closest('button') || target.closest('input') || target.closest('select') || target.closest('[role="button"]') || target.closest('[role="combobox"]')) {
      return;
    }
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleEnd();
  };

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
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-60 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-full bg-background shadow-2xl z-70 ${
          !isDragging ? 'transition-transform duration-300 ease-out' : ''
        } ${isOpen && shouldAnimate ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          transform: isDragging 
            ? `translateX(${dragOffset}px)` 
            : undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-2 border-b bg-card/50 relative">
            <div className="bg-muted rounded-full p-1.5 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-muted-foreground/10"
                style={{ height: '2rem', width: '2rem', minHeight: '2rem', minWidth: '2rem' }}
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Invite Team Member</h2>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50 scrollbar-hide">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
                <CardContent className="space-y-8">
                  {/* Email Section */}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* Role Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Role & Permissions</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-foreground">Role</Label>
                      <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={roleOpen}
                            className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                          >
                            {formData.role || "Select role"}
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
                                  value="Team Member"
                                  onSelect={() => {
                                    setFormData(prev => ({ ...prev, role: "Team Member" }));
                                    setRoleOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.role === "Team Member" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Team Member
                                </CommandItem>
                                <CommandItem
                                  value="Manager"
                                  onSelect={() => {
                                    setFormData(prev => ({ ...prev, role: "Manager" }));
                                    setRoleOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.role === "Manager" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Manager
                                </CommandItem>
                                <CommandItem
                                  value="Admin"
                                  onSelect={() => {
                                    setFormData(prev => ({ ...prev, role: "Admin" }));
                                    setRoleOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.role === "Admin" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Admin
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Location Assignment</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-foreground">Primary Location</Label>
                      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={locationOpen}
                            className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                          >
                            {formData.location ? locations.find(loc => loc.id === formData.location)?.name || "Select location" : "Select location"}
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
                                      setFormData(prev => ({ ...prev, location: location.id }));
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
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-card/50">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Send Invitation
              </Button>
            </div>
          </div>
        </div>
      </div>

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
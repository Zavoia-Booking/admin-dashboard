import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, DollarSign, Clock, FileText, Settings, AlertCircle, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffAssignment {
  name: string;
  price?: number;
  duration?: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  status: 'enabled' | 'disabled';
  createdAt: string;
  category?: string;
  bookings?: number;
  staff: StaffAssignment[];
}

interface EditServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (serviceData: Service) => void;
  service: Service | null;
}

const EditServiceSlider: React.FC<EditServiceSliderProps> = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  service 
}) => {
  const [formData, setFormData] = useState<Service | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  // Available staff for selection (mock data - replace with actual API call)
  const availableStaff = [
    'Emma Thompson',
    'David Kim', 
    'Alex Rodriguez',
    'Maria Garcia',
    'Sarah Wilson',
    'Michael Chen',
    'Lisa Johnson',
    'Robert James'
  ];

  // Populate form with service data when opened
  useEffect(() => {
    if (service && isOpen) {
      // Normalize staff: convert string[] to {name: string}[] if needed
      let normalizedStaff: any[] = [];
      if (Array.isArray(service.staff)) {
        normalizedStaff = service.staff.map((s: any) =>
          typeof s === 'string' ? { name: s } : s
        );
      } else {
        normalizedStaff = [];
      }
      setFormData({ ...service, staff: normalizedStaff });
    }
  }, [service, isOpen]);

  // Reset form when slider closes (with delay to allow closing animation)
  React.useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setFormData(null), 300); // Match animation duration
      return () => clearTimeout(timer);
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
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragOffset(0);
    isMouseDown.current = false;
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle swipe on the container, not on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="button"]')) {
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
    // Only handle swipe on the container, not on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="button"]')) {
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
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Edit Service</h2>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50 scrollbar-hide">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
                <CardContent className="space-y-8">
                  {/* Service Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Service Information</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-foreground">Service Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter service name..."
                        value={formData.name}
                        onChange={(e) => formData && setFormData({ ...formData, name: e.target.value })}
                        className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the service..."
                        value={formData.description}
                        onChange={(e) => formData && setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="border-0 bg-muted/50 focus:bg-background text-base resize-none"
                      />
                    </div>
                  </div>

                  {/* Pricing & Duration Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Pricing & Duration</h3>
                    </div>
                    <div className="mb-2 text-xs text-muted-foreground">
                      All assigned team members will use this price and duration unless a custom value is set for them below.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-medium text-foreground">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price || ''}
                          onChange={(e) => formData && setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-sm font-medium text-foreground">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          placeholder="30"
                          value={formData.duration || ''}
                          onChange={(e) => formData && setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                          className="border-0 bg-muted/50 focus:bg-background h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Settings className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Status</h3>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">Service Status</Label>
                      <div className="relative">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${formData.status === 'enabled' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <div>
                              <div className="font-medium text-sm">
                                {formData.status === 'enabled' ? 'Enabled' : 'Disabled'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formData.status === 'enabled' 
                                  ? 'Service is active and bookable' 
                                  : 'Service is hidden from clients'
                                }
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={formData.status === 'enabled'}
                            onCheckedChange={(checked) => formData && setFormData({ ...formData, status: checked ? 'enabled' : 'disabled' })}
                            className={`!h-5 !w-9 !min-h-0 !min-w-0`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Available Staff Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Available Staff</h3>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">Assigned Staff Members</Label>
                      
                      {/* Current Staff List */}
                      <div className="space-y-2">
                        {(formData.staff ?? []).map((staffMember, idx) => (
                            <div key={staffMember.name} className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Users className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="text-sm font-medium">{staffMember.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (formData) {
                                      setFormData({
                                        ...formData,
                                        staff: (formData.staff || []).filter((s: StaffAssignment) => s.name !== staffMember.name)
                                      });
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-destructive/10 text-destructive"
                                  title="Remove staff member"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              {/* Toggle for custom price/duration */}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">Custom price and duration?</span>
                                <Switch
                                  checked={staffMember.price !== undefined || staffMember.duration !== undefined}
                                  onCheckedChange={(checked: boolean) => {
                                    if (!formData) return;
                                    const updated = [...formData.staff];
                                    if (checked) {
                                      updated[idx] = {
                                        ...updated[idx],
                                        price: formData.price,
                                        duration: formData.duration
                                      };
                                    } else {
                                      updated[idx] = { ...updated[idx], price: undefined, duration: undefined };
                                    }
                                    setFormData({ ...formData, staff: updated });
                                  }}
                                  className="!h-5 !w-9 !min-h-0 !min-w-0"
                                />
                              </div>
                              {(staffMember.price !== undefined || staffMember.duration !== undefined) && (
                                <div className="flex gap-2 mt-2">
                                  <div className="flex flex-col w-32">
                                    <Label className="text-xs mb-1">Price ($)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder={`Custom Price (default: $${formData.price})`}
                                      value={staffMember.price === undefined ? '' : staffMember.price}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        if (!formData) return;
                                        const updated = [...formData.staff];
                                        const val = e.target.value;
                                        updated[idx] = { ...updated[idx], price: val === '' ? undefined : parseFloat(val) };
                                        setFormData({ ...formData, staff: updated });
                                      }}
                                      className="border-0 bg-muted/50 focus:bg-background h-10 text-sm"
                                    />
                                  </div>
                                  <div className="flex flex-col w-40">
                                    <Label className="text-xs mb-1">Duration (minutes)</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder={`Custom Duration (default: ${formData.duration}m)`}
                                      value={staffMember.duration === undefined ? '' : staffMember.duration}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        if (!formData) return;
                                        const updated = [...formData.staff];
                                        const val = e.target.value;
                                        updated[idx] = { ...updated[idx], duration: val === '' ? undefined : parseInt(val) };
                                        setFormData({ ...formData, staff: updated });
                                      }}
                                      className="border-0 bg-muted/50 focus:bg-background h-10 text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        {(formData.staff ?? []).length === 0 && (
                          <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border/50 text-center">
                            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No staff members assigned</p>
                            <p className="text-xs text-muted-foreground">Add staff members who can provide this service</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Add Staff Button */}
                      <Popover open={staffOpen} onOpenChange={setStaffOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-10 border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Staff Member
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 z-[80]">
                          <Command>
                            <CommandInput placeholder="Search staff members..." />
                            <CommandList>
                              <CommandEmpty>No staff members found.</CommandEmpty>
                              <CommandGroup>
                                {availableStaff
                                  .filter(staff => !(formData && (formData.staff || []).some((s: StaffAssignment) => s.name === staff)))
                                  .map((staff) => (
                                    <CommandItem
                                      key={staff}
                                      value={staff}
                                      onSelect={() => {
                                        if (formData) {
                                          setFormData({
                                            ...formData,
                                            staff: [...(formData.staff || []), { name: staff }]
                                          });
                                        }
                                        setStaffOpen(false);
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      {staff}
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
                className="flex-1"
              >
                Update Service
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Update Service
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the service "{formData.name}"? This will modify the service in your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Update Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditServiceSlider; 
import React, { useState } from 'react';
import { DollarSign, FileText, Settings, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BaseSlider } from '@/components/common/BaseSlider';
import { mockTeamMembers } from '@/mocks/team-members.mock';

interface AddServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (serviceData: { name: string; price: number; duration: number; description: string; status: 'enabled' | 'disabled'; staff: StaffAssignment[] }) => void;
}

interface StaffAssignment {
  name: string;
  price?: number;
  duration?: number;
}

interface ServiceFormData {
  name: string;
  price: number;
  duration: number;
  description: string;
  status: 'enabled' | 'disabled';
  staff: StaffAssignment[];
}

const initialFormData: ServiceFormData = {
  name: '',
  price: 0,
  duration: 0,
  description: '',
  status: 'enabled',
  staff: [],
};

const AddServiceSlider: React.FC<AddServiceSliderProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

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

  const handleConfirmCreate = () => {
    // No change needed: staff array already contains optional price/duration, and defaults are in formData
    onCreate({
      ...formData,
    });
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
        title="Add New Service"
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
              form="add-service-form"
              className="flex-1"
            >
              Create Service
            </Button>
          </div>
        }
      >
        <form id="add-service-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this service includes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[80px] text-base border-border/50 bg-background/50 backdrop-blur-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Pricing & Duration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Pricing & Duration</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium text-foreground">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-foreground">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Staff Assignment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Staff Assignment</h3>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Assigned Staff Members</Label>
                  
                  {/* Current Staff List */}
                  <div className="space-y-2">
                    {formData.staff.length > 0 ? (
                      formData.staff.map((staffMember, idx) => (
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
                                setFormData({
                                  ...formData,
                                  staff: formData.staff.filter(s => s.name !== staffMember.name)
                                });
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
                      ))
                    ) : (
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
                            {mockTeamMembers
                              .filter(staff => !formData.staff.some(s => s.name === staff.firstName + ' ' + staff.lastName))
                              .map((staff) => (
                                <CommandItem
                                  key={staff.id}
                                  value={staff.firstName + ' ' + staff.lastName}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      staff: [...formData.staff, { name: staff.firstName + ' ' + staff.lastName }]
                                    });
                                    setStaffOpen(false);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  {staff.firstName + ' ' + staff.lastName}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Service Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Service Settings</h3>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">Service Status</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.status === 'enabled' 
                        ? 'Service is available for booking' 
                        : 'Service is hidden from clients'}
                    </p>
                  </div>
                  <Switch
                    checked={formData.status === 'enabled'}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, status: checked ? 'enabled' : 'disabled' })
                    }
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
            <AlertDialogTitle>Create New Service</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to create "{formData.name}" with a price of ${formData.price} and duration of {formData.duration} minutes?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>
              Create Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddServiceSlider; 
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { DollarSign, FileText, Settings } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Switch } from '../../../shared/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
// import { mockTeamMembers } from '../../../mocks/team-members.mock';
import { createServicesAction } from '../actions.ts';
import { getCurrentLocationSelector } from '../../locations/selectors.ts';
import type { CreateServicePayload } from '../types.ts';
 

interface AddServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

// interface StaffAssignment {
//   name: string;
//   price?: number;
//   duration?: number;
// }

interface ServiceFormData {
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
  // removed locationIds; apply to all when no current location
}

const initialFormData: ServiceFormData = {
  name: '',
  price: 0,
  duration: 0,
  description: '',
  isActive: true,
  
};

const AddServiceSlider: React.FC<AddServiceSliderProps> = ({
  isOpen, 
  onClose
}) => {
  const dispatch = useDispatch();
  const currentLocation = useSelector(getCurrentLocationSelector);
  // Keep selector in case future UI needs; currently showing info when All locations
  // const allLocations = useSelector(getAllLocationsSelector);
  const { register, handleSubmit, watch, setValue, reset, getValues } = useForm<ServiceFormData>({
    defaultValues: initialFormData,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // const [staffOpen, setStaffOpen] = useState(false);
  // const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);

  // Reset form when slider closes
  useEffect(() => {
    if (!isOpen) {
      reset(initialFormData);
      // setStaffAssignments([]);
    }
  }, [isOpen, reset]);

  // no per-form location state when All locations

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = () => {
    const { name, price, duration, description } = getValues();
    const payload: CreateServicePayload = {
      name,
      price,
      duration,
      description,
      isActive: true,
    };
    dispatch(createServicesAction.request(payload));
    setShowConfirmDialog(false);
    onClose();
    reset(initialFormData);
    // setStaffAssignments([]);
  };

  const handleCancel = () => {
    onClose();
    reset(initialFormData);
    // setStaffAssignments([]);
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
        <form id="add-service-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
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
                    {...register('name', { required: true })}
                    className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this service includes..."
                    {...register('description')}
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
                      {...register('price', { required: true, valueAsNumber: true, min: 0 })}
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
                      {...register('duration', { required: true, valueAsNumber: true, min: 1 })}
                      className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Staff Assignment Section - commented for future use */}
              {/**
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Staff Assignment</h3>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Assigned Staff Members</Label>
                  <div className="space-y-2">
                    {staffAssignments.length > 0 ? (
                      staffAssignments.map((staffMember, idx) => (
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
                                setStaffAssignments(prev => prev.filter(s => s.name !== staffMember.name));
                              }}
                              className="p-1 rounded hover:bg-destructive/10 text-destructive"
                              title="Remove staff member"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Custom price and duration?</span>
                            <Switch
                              checked={staffMember.price !== undefined || staffMember.duration !== undefined}
                              onCheckedChange={(checked: boolean) => {
                                const updated = [...staffAssignments];
                                if (checked) {
                                  updated[idx] = {
                                    ...updated[idx],
                                    price: watch('price'),
                                    duration: watch('duration')
                                  };
                                } else {
                                  updated[idx] = { ...updated[idx], price: undefined, duration: undefined };
                                }
                                setStaffAssignments(updated);
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
                                  placeholder={`Custom Price (default: $${watch('price')})`}
                                  value={staffMember.price === undefined ? '' : staffMember.price}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const updated = [...staffAssignments];
                                    const val = e.target.value;
                                    updated[idx] = { ...updated[idx], price: val === '' ? undefined : parseFloat(val) };
                                    setStaffAssignments(updated);
                                  }}
                                  className="border-0 bg-muted/50 focus:bg-background h-10 text-sm"
                                />
                              </div>
                              <div className="flex flex-col w-40">
                                <Label className="text-xs mb-1">Duration (minutes)</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder={`Custom Duration (default: ${watch('duration')}m)`}
                                  value={staffMember.duration === undefined ? '' : staffMember.duration}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const updated = [...staffAssignments];
                                    const val = e.target.value;
                                    updated[idx] = { ...updated[idx], duration: val === '' ? undefined : parseInt(val) };
                                    setStaffAssignments(updated);
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
                              .filter(staff => !staffAssignments.some(s => s.name === staff.firstName + ' ' + staff.lastName))
                              .map((staff) => (
                                <CommandItem
                                  key={staff.id}
                                  value={staff.firstName + ' ' + staff.lastName}
                                  onSelect={() => {
                                    setStaffAssignments(prev => ([...prev, { name: staff.firstName + ' ' + staff.lastName }]));
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
              */}

              {/* Service Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Service Settings</h3>
                </div>
                {currentLocation ? (
                  <div className="text-sm text-muted-foreground">
                    Assigning to current location: <span className="font-medium text-foreground">{currentLocation.name}</span>.
                    Switch location in the header to apply to another location.
                  </div>
                ) : (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
                    This service will be created across all business locations. Switch to a specific location in the header to create it only there.
                  </div>
                )}
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">Service Status</Label>
                    <p className="text-xs text-muted-foreground">
                      {watch('isActive') === true 
                        ? 'Service is available for booking' 
                        : 'Service is hidden from clients'}
                    </p>
                  </div>
                  <Switch
                    checked={watch('isActive') === true}
                    onCheckedChange={(checked) => setValue('isActive', checked ? true : false)}
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
              {`Are you sure you want to create "${getValues('name')}" with a price of $${getValues('price')} and duration of ${getValues('duration')} minutes?`}
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
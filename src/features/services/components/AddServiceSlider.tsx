import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DollarSign, FileText, Settings, Clock, Info, Sparkles } from 'lucide-react';
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
  const text = useTranslation('services').t;
  const dispatch = useDispatch();
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
    const { name, price, duration, description, isActive } = getValues();
    const payload: CreateServicePayload = {
      name,
      price,
      duration,
      description,
      isActive,
    };
    dispatch(createServicesAction.request(payload));
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
        title={text('addService.title')}
        contentClassName="bg-muted/50 scrollbar-hide"
        footer={
          <div className="flex gap-3 p-4 bg-gradient-to-b from-background to-muted/20 backdrop-blur-sm">
            <Button 
              type="button"
              variant="outline" 
              onClick={handleCancel}
              className="flex-1 h-11 font-medium transition-all duration-200 hover:bg-muted/50"
            >
              {text('addService.buttons.cancel')}
            </Button>
            <Button 
              type="submit"
              form="add-service-form"
              className="flex-1 h-11 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              {text('addService.buttons.create')}
            </Button>
          </div>
        }
      >
        <form 
          id="add-service-form" 
          onSubmit={handleSubmit(onSubmit)} 
          className="h-full flex flex-col max-w-md mx-auto md:max-w-none md:m-0 md:h-full"
        >
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
            <Card className="border-0 py-0 bg-card/70 backdrop-blur-sm transition-all duration-300 md:bg-transparent md:border-0">
              <CardContent className="space-y-10 md:p-0">
              {/* Service Information Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-1">
                  <div className="p-2.5 rounded-xl bg-primary/10 shadow-sm">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{text('addService.sections.serviceInfo')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Basic details about your service</p>
                  </div>
                </div>
                
                <div className="space-y-3 pl-1">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {text('addService.form.name.label')}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        placeholder={text('addService.form.name.placeholder')}
                        {...register('name', { required: true })}
                        className="h-12 text-base border-border/60 bg-background/80 hover:bg-background focus:bg-background transition-all duration-200 pl-4 pr-4"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {text('addService.form.description.label')}
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={text('addService.form.description.placeholder')}
                      {...register('description')}
                      className="min-h-[100px] text-base border-border/60 bg-background/80 hover:bg-background focus:bg-background resize-none transition-all duration-200 px-4 py-3"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Info className="h-3 w-3" />
                      Optional: Add details that help customers understand this service
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Duration Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-1">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 shadow-sm">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{text('addService.sections.pricingDuration')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Set pricing and time requirements</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pl-1">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {text('addService.form.price.label')}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        {...register('price', { required: true, valueAsNumber: true, min: 0 })}
                        className="h-12 text-base border-border/60 bg-background/80 hover:bg-background focus:bg-background transition-all duration-200 pl-10 pr-4"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Base price in USD</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {text('addService.form.duration.label')}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="30"
                        {...register('duration', { required: true, valueAsNumber: true, min: 1 })}
                        className="h-12 text-base border-border/60 bg-background/80 hover:bg-background focus:bg-background transition-all duration-200 pl-10 pr-4"
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Duration in minutes</p>
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
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-1">
                  <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/20 shadow-sm">
                    <Settings className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{text('addService.sections.settings')}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Control service availability</p>
                  </div>
                </div>
                
                <div className="pl-1">
                  <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-br from-background/80 to-muted/30 backdrop-blur-sm border border-border/60 hover:border-border transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-semibold text-foreground cursor-pointer">
                          {text('addService.form.status.label')}
                        </Label>
                        {watch('isActive') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Sparkles className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {watch('isActive') === true 
                          ? text('addService.form.status.activeDescription')
                          : text('addService.form.status.inactiveDescription')}
                      </p>
                    </div>
                    <Switch
                      checked={watch('isActive') === true}
                      onCheckedChange={(checked) => setValue('isActive', checked ? true : false)}
                      className="ml-4"
                    />
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Action Buttons - Desktop: inside form, Mobile: in footer */}
          <div className="hidden md:flex gap-3 p-6 border-t border-border/60 bg-gradient-to-b from-background to-muted/20 backdrop-blur-sm">
            <Button 
              type="button"
              variant="outline" 
              onClick={handleCancel}
              className="flex-1 h-11 font-medium transition-all duration-200 hover:bg-muted/50"
            >
              {text('addService.buttons.cancel')}
            </Button>
            <Button 
              type="submit"
              className="flex-1 h-11 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              {text('addService.buttons.create')}
            </Button>
          </div>
        </form>
      </BaseSlider>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text('addService.confirmDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {text('addService.confirmDialog.description', { 
                name: getValues('name'), 
                price: getValues('price'), 
                duration: getValues('duration') 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{text('addService.confirmDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>
              {text('addService.confirmDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddServiceSlider; 
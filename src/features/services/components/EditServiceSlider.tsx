import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { DollarSign, FileText, Settings, AlertCircle } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Switch } from '../../../shared/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import type { Service } from '../../../shared/types/service';
import type { EditServicePayload } from '../types.ts';
import { editServicesAction } from '../actions.ts';
import { getCurrentLocationSelector } from '../../locations/selectors.ts';

interface EditServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

const EditServiceSlider: React.FC<EditServiceSliderProps> = ({
  isOpen,
  onClose,
  service
}) => {
  const dispatch = useDispatch();
  const currentLocation = useSelector(getCurrentLocationSelector);
  
  const { register, handleSubmit, reset, setValue, getValues, watch } = useForm<EditServicePayload>({
    defaultValues: {
      id: service?.id ?? 0,
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration: service?.duration ?? 0,
      price: service?.price ?? 0,
      isActive: service?.isActive ?? true,
    }
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Populate form with service data when opened
  useEffect(() => {
    if (service && isOpen) {
      reset({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        isActive: service.isActive,
      });
    }
  }, [service, isOpen, reset, currentLocation]);

  // Reset form when slider closes (with delay to allow closing animation)
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => reset(), 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset]);

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    const { id, name, description, duration, price, isActive } = getValues();
    const payload: EditServicePayload = {
      id,
      name,
      description,
      duration,
      price,
      isActive,
      
    };
    dispatch(editServicesAction.request(payload));
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!service) return null;

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Service"
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
              form="edit-service-form"
              className="flex-1"
            >
              Update Service
            </Button>
          </div>
        }
      >
        <form id="edit-service-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
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
                    placeholder="Describe the service..."
                    {...register('description')}
                    rows={3}
                    className="min-h-[80px] text-base border-border/50 bg-background/50 backdrop-blur-sm resize-none"
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
                      {...register('price', { required: true, valueAsNumber: true, min: 0 })}
                      className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-foreground">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="30"
                      {...register('duration', { required: true, valueAsNumber: true, min: 1 })}
                      className="h-12 text-base border-border/50 bg-background/50 backdrop-blur-sm"
                      required
                    />
                  </div>
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
                {currentLocation ? (
                  <div className="text-sm text-muted-foreground">
                    Updating for current location: <span className="font-medium text-foreground">{currentLocation.name}</span>. Switch location in the header to edit this service in another location.
                  </div>
                ) : (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-md">
                    This update will apply across all business locations. Switch to a specific location in the header to target only that location.
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
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Update Service
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to update the service "${getValues('name')}"? This will modify the service in your catalog.`}
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
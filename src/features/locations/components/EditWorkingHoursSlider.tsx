import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../shared/components/ui/alert-dialog';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';
import type { LocationType } from '../../../shared/types/location';
import type { EditLocationWorkingHours } from '../types';
import { capitalize } from '../utils';
import { defaultWorkingHours } from '../constants';
import { updateLocationAction } from '../actions';

interface EditWorkingHoursSliderProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationType | null;
}

const EditWorkingHoursSlider: React.FC<EditWorkingHoursSliderProps> = ({ 
  isOpen, 
  onClose, 
  location 
}) => {
  const dispatch = useDispatch();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { handleSubmit, reset, watch } = useForm<EditLocationWorkingHours>();

  useEffect(() => {
    if (location && isOpen) {
      reset({ id: location.id, workingHours: location.workingHours });
    }
  }, [location, isOpen, reset]);

  if (!location) return null;

  const onSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    const updates = watch();
    dispatch(updateLocationAction.request({ location: updates }));
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const updateWorkingHours = (day: keyof typeof defaultWorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    const current = watch();
    const next: EditLocationWorkingHours = {
      ...current,
      workingHours: {
        ...current.workingHours,
        [day]: {
          ...current.workingHours[day],
          [field]: value as any,
        },
      },
    } as EditLocationWorkingHours;
    reset(next);
  };

  return (
    <>
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title="Working Hours"
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
              form="edit-working-hours-form"
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="edit-working-hours-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm transition-all duration-300">
            <CardContent className="space-y-6">
              {/* Working Hours Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Working Hours</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(watch().workingHours || location.workingHours).map(([day, hours]) => (
                    <div key={day} className="bg-white rounded-xl shadow-xs p-4 flex flex-col gap-2 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-base">{capitalize(day)}</span>
                        {hours.isOpen ? (
                          <button
                            type="button"
                            className="px-2 py-0 rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-medium"
                            onClick={() => updateWorkingHours(day as keyof typeof defaultWorkingHours, 'isOpen', false)}
                          >
                            Mark as Closed
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="px-2 py-0 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-medium"
                            onClick={() => updateWorkingHours(day as keyof typeof defaultWorkingHours, 'isOpen', true)}
                          >
                            Mark as Open
                          </button>
                        )}
                      </div>
                      {hours.isOpen ? (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Opening Time</Label>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateWorkingHours(day as keyof typeof defaultWorkingHours, 'open', e.target.value)}
                              onClick={(e) => {
                                e.currentTarget.showPicker?.();
                              }}
                              className="h-10 text-center cursor-pointer"
                            />
                          </div>
                          <div className="mt-2">
                            <Label className="text-xs text-gray-500 mb-1 block">Closing Time</Label>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateWorkingHours(day as keyof typeof defaultWorkingHours, 'close', e.target.value)}
                              onClick={(e) => {
                                e.currentTarget.showPicker?.();
                              }}
                              className="h-10 text-center cursor-pointer"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-400 italic text-sm mt-2">
                          This location is closed on {capitalize(day)}
                        </div>
                      )}
                    </div>
                  ))}
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
              Update Working Hours
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to update the working hours for ${location.name}? This will save all changes.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditWorkingHoursSlider; 
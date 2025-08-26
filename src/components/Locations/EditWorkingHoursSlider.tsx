import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { BaseSlider } from '../common/BaseSlider';

interface Location {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  description: string;
  workingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  status: 'active' | 'inactive';
  createdAt: string;
}

interface EditWorkingHoursSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (locationData: Location) => void;
  location: Location | null;
}

const defaultWorkingHours = {
  monday: { open: '09:00', close: '17:00', isOpen: true },
  tuesday: { open: '09:00', close: '17:00', isOpen: true },
  wednesday: { open: '09:00', close: '17:00', isOpen: true },
  thursday: { open: '09:00', close: '17:00', isOpen: true },
  friday: { open: '09:00', close: '17:00', isOpen: true },
  saturday: { open: '10:00', close: '15:00', isOpen: true },
  sunday: { open: '10:00', close: '15:00', isOpen: false },
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const EditWorkingHoursSlider: React.FC<EditWorkingHoursSliderProps> = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  location 
}) => {
  const [formData, setFormData] = useState<Location | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (location && isOpen) {
      setFormData({ ...location });
    }
  }, [location, isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setFormData(null), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const updateWorkingHours = (day: keyof typeof defaultWorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    if (!formData) return;
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  if (!formData) return null;

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
        <form id="edit-working-hours-form" onSubmit={handleSubmit} className="max-w-md mx-auto">
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
                  {Object.entries(formData.workingHours).map(([day, hours]) => (
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
              {`Are you sure you want to update the working hours for "{formData.name}"? This will save all changes.`}
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
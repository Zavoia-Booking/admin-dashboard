import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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

// Helper to capitalize day names
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
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Populate form with location data when opened
  useEffect(() => {
    if (location && isOpen) {
      setFormData({ ...location });
    }
  }, [location, isOpen]);

  // Reset form when slider closes (with delay to allow closing animation)
  React.useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setFormData(null), 300);
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

  const handleStart = (clientX: number, target: HTMLElement) => {
    // Don't start drag on form elements
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || 
        target.closest('button') || target.closest('input') || target.closest('textarea') || 
        target.closest('[role="button"]') || target.closest('[role="switch"]')) {
      return;
    }
    
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
    const target = e.target as HTMLElement;
    handleStart(e.touches[0].clientX, target);
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
    handleStart(e.clientX, target);
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
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Working Hours</h2>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50 scrollbar-hide">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
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
                Save Changes
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
              Update Working Hours
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the working hours for "{formData.name}"? This will save all changes.
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
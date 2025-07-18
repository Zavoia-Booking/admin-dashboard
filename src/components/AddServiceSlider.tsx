import React, { useState, useRef } from 'react';
import { ArrowLeft, DollarSign, Clock, FileText, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AddServiceSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (serviceData: { name: string; price: number; duration: number; description: string; status: 'enabled' | 'disabled' }) => void;
}

interface ServiceFormData {
  name: string;
  price: number;
  duration: number;
  description: string;
  status: 'enabled' | 'disabled';
}

const initialFormData: ServiceFormData = {
  name: '',
  price: 0,
  duration: 0,
  description: '',
  status: 'enabled'
};

const AddServiceSlider: React.FC<AddServiceSliderProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

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

  const handleConfirmCreate = () => {
    onCreate(formData);
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
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Add New Service</h2>
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
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
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
                            onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'enabled' : 'disabled' })}
                            className={`!h-5 !w-9 !min-h-0 !min-w-0`}
                          />
                        </div>
                      </div>
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
                Create Service
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
              Create Service
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create the service "{formData.name}"? This will add it to your service catalog.
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
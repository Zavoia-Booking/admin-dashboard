import React, { useState, useRef } from 'react';
import { ArrowLeft, AlertTriangle, Upload, Trash2, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AdvancedSettingsSliderProps {
  isOpen: boolean;
  onClose: () => void;
}



const AdvancedSettingsSlider: React.FC<AdvancedSettingsSliderProps> = ({ isOpen, onClose }) => {
  const [confirmText, setConfirmText] = useState('');
  
  // Touch/drag handling for mobile swipe to close
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('✅ Advanced settings saved successfully');
    onClose();
  };

  const handleImportData = (type: 'customers' | 'appointments' | 'services') => {
    toast.info(`Import ${type} functionality would be implemented here`);
  };

  const handleResetData = () => {
    if (confirmText !== 'RESET') {
      toast.error('Please type "RESET" to confirm');
      return;
    }
    toast.success('Data reset initiated (demo only)');
    setConfirmText('');
  };

  const handleDeleteAccount = () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    toast.error('Account deletion would be processed (demo only)');
    setConfirmText('');
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
        className={`fixed top-0 left-0 h-full w-full bg-background shadow-lg z-70 ${
          !isDragging ? 'transition-transform duration-300 ease-out' : ''
        } ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Advanced Settings</h2>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50 scrollbar-hide">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
              
              {/* Data Import Section */}
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Data Import</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Import your business data from CSV or Excel files to populate your account.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => handleImportData('customers')}
                        className="h-10 text-sm"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Import Customers
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => handleImportData('appointments')}
                        className="h-10 text-sm"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Import Appointments
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => handleImportData('services')}
                        className="h-10 text-sm"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Import Services
                      </Button>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        <strong>Supported formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>File size limit:</strong> 10MB maximum
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>



              {/* Danger Zone Section */}
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm border-destructive/20">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Danger Zone</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <h4 className="font-medium text-sm text-destructive mb-2">Reset All Data</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        This will permanently delete all appointments, customers, and services. This action cannot be undone.
                      </p>
                      <div className="space-y-2">
                        <Input
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder='Type "RESET" to confirm'
                          className="border-0 bg-background text-base h-10"
                        />
                        <Button 
                          type="button"
                          variant="destructive" 
                          onClick={handleResetData}
                          disabled={confirmText !== 'RESET'}
                          className="w-full h-10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Reset All Data
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <h4 className="font-medium text-sm text-destructive mb-2">Delete Account</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        This will permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <div className="space-y-2">
                        <Input
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder='Type "DELETE" to confirm'
                          className="border-0 bg-background text-base h-10"
                        />
                        <Button 
                          type="button"
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          disabled={confirmText !== 'DELETE'}
                          className="w-full h-10"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
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
                onClick={onClose}
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
    </>
  );
};

export default AdvancedSettingsSlider; 
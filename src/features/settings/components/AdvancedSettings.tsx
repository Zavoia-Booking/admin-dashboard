import React, { useState } from 'react';
import { AlertTriangle, Upload, Trash2, FileUp } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { toast } from 'sonner';


const AdvancedSettings = () => {
  const [confirmText, setConfirmText] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    toast.success('✅ Advanced settings saved successfully');
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
  );
};

export default AdvancedSettings; 
import React, { useState, useRef } from 'react';
import { ArrowLeft, Shield, Key, Lock, AlertTriangle, Eye, EyeOff, Settings2, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SecuritySliderProps {
  isOpen: boolean;
  onClose: () => void;
}



interface SecurityLog {
  id: string;
  type: 'login' | 'password_change' | 'permission_change' | 'failed_login';
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
}

const SecuritySlider: React.FC<SecuritySliderProps> = ({ isOpen, onClose }) => {
  const [securityLogs] = useState<SecurityLog[]>([
    {
      id: '1',
      type: 'login',
      description: 'Successful login',
      timestamp: '2024-02-20T10:30:00Z',
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      type: 'failed_login',
      description: 'Failed login attempt',
      timestamp: '2024-02-20T09:45:00Z',
      ipAddress: '192.168.1.105'
    },
    {
      id: '3',
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: '2024-02-19T14:20:00Z',
      ipAddress: '192.168.1.100'
    }
  ]);

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '24',
    forcePasswordChange: false,
    allowMultipleSessions: true,
    ipWhitelist: false,
    emailSecurityAlerts: true,
    loginNotifications: true,
    suspiciousActivityBlock: true,
    passwordPolicy: 'medium'
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // UI state for dropdowns
  const [sessionTimeoutOpen, setSessionTimeoutOpen] = useState(false);
  const [passwordPolicyOpen, setPasswordPolicyOpen] = useState(false);
  
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
    toast.success('✅ Security settings saved successfully');
    onClose();
  };



  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    toast.success('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleEnable2FA = () => {
    toast.info('Two-factor authentication setup would be implemented here');
  };

  // Data arrays
  const sessionTimeouts = [
    { value: '1', label: '1 hour' },
    { value: '8', label: '8 hours' },
    { value: '24', label: '24 hours' },
    { value: '168', label: '1 week' },
    { value: '720', label: '30 days' },
  ];

  const passwordPolicies = [
    { value: 'low', label: 'Low - 6+ characters' },
    { value: 'medium', label: 'Medium - 8+ chars, mixed case' },
    { value: 'high', label: 'High - 12+ chars, symbols, numbers' },
  ];



  const getSecurityLogIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'password_change':
        return <Key className="h-4 w-4 text-blue-600" />;
      case 'permission_change':
        return <Settings2 className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h2 className="text-lg font-semibold text-foreground absolute left-1/2 transform -translate-x-1/2">Security</h2>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/50 scrollbar-hide">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
              


              {/* Password Management Section */}
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Password Management</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="border-0 bg-muted/50 focus:bg-background text-base h-12 pr-10"
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border-0 bg-muted/50 focus:bg-background text-base h-12 pr-10"
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      type="button"
                      onClick={handleChangePassword}
                      className="w-full h-10"
                    >
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings Section */}
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Security Settings</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-foreground">Two-Factor Authentication</Label>
                          <p className="text-xs text-muted-foreground">Add extra security to your account.</p>
                        </div>
                        <Button
                          type="button"
                          variant={securitySettings.twoFactorEnabled ? "outline" : "default"}
                          size="sm"
                          onClick={handleEnable2FA}
                          className="h-8"
                        >
                          {securitySettings.twoFactorEnabled ? 'Manage' : 'Enable'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Session Timeout</Label>
                      <p className="text-xs text-muted-foreground">Automatically log out after inactivity.</p>
                      <Popover open={sessionTimeoutOpen} onOpenChange={setSessionTimeoutOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={sessionTimeoutOpen}
                            className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                          >
                            {securitySettings.sessionTimeout ? sessionTimeouts.find(t => t.value === securitySettings.sessionTimeout)?.label : "Select timeout"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0 z-[80]">
                          <Command>
                            <CommandInput placeholder="Search timeouts..." />
                            <CommandList>
                              <CommandEmpty>No timeouts found.</CommandEmpty>
                              <CommandGroup>
                                {sessionTimeouts.map((timeout) => (
                                  <CommandItem
                                    key={timeout.value}
                                    value={timeout.value}
                                    onSelect={() => {
                                      setSecuritySettings(prev => ({ ...prev, sessionTimeout: timeout.value }));
                                      setSessionTimeoutOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        securitySettings.sessionTimeout === timeout.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {timeout.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Password Policy</Label>
                      <p className="text-xs text-muted-foreground">Minimum password requirements for all users.</p>
                      <Popover open={passwordPolicyOpen} onOpenChange={setPasswordPolicyOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={passwordPolicyOpen}
                            className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                          >
                            {securitySettings.passwordPolicy ? passwordPolicies.find(p => p.value === securitySettings.passwordPolicy)?.label : "Select policy"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0 z-[80]">
                          <Command>
                            <CommandInput placeholder="Search policies..." />
                            <CommandList>
                              <CommandEmpty>No policies found.</CommandEmpty>
                              <CommandGroup>
                                {passwordPolicies.map((policy) => (
                                  <CommandItem
                                    key={policy.value}
                                    value={policy.value}
                                    onSelect={() => {
                                      setSecuritySettings(prev => ({ ...prev, passwordPolicy: policy.value }));
                                      setPasswordPolicyOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        securitySettings.passwordPolicy === policy.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {policy.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-foreground">Allow Multiple Sessions</Label>
                          <p className="text-xs text-muted-foreground">Let users log in from multiple devices.</p>
                        </div>
                        <Switch
                          checked={securitySettings.allowMultipleSessions}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, allowMultipleSessions: checked }))}
                          className="!h-5 !w-9 !min-h-0 !min-w-0"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-foreground">Email Security Alerts</Label>
                          <p className="text-xs text-muted-foreground">Send email alerts for security events.</p>
                        </div>
                        <Switch
                          checked={securitySettings.emailSecurityAlerts}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, emailSecurityAlerts: checked }))}
                          className="!h-5 !w-9 !min-h-0 !min-w-0"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-foreground">Login Notifications</Label>
                          <p className="text-xs text-muted-foreground">Notify when someone logs into your account.</p>
                        </div>
                        <Switch
                          checked={securitySettings.loginNotifications}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))}
                          className="!h-5 !w-9 !min-h-0 !min-w-0"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-foreground">Block Suspicious Activity</Label>
                          <p className="text-xs text-muted-foreground">Automatically block suspicious login attempts.</p>
                        </div>
                        <Switch
                          checked={securitySettings.suspiciousActivityBlock}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, suspiciousActivityBlock: checked }))}
                          className="!h-5 !w-9 !min-h-0 !min-w-0"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Activity Log Section */}
              <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Recent Security Activity</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {securityLogs.map((log, index) => (
                      <div key={log.id}>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            {getSecurityLogIcon(log.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{log.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(log.timestamp)} • {log.ipAddress}
                            </p>
                          </div>
                        </div>
                        {index < securityLogs.length - 1 && <Separator className="my-3" />}
                      </div>
                    ))}
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

export default SecuritySlider; 
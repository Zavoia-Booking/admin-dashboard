import React, { useState } from 'react';
import { User, Bell, Globe, Shield, Camera, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Switch } from '../../../shared/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../shared/components/ui/command';
import { toast } from 'sonner';
import { cn } from '../../../shared/lib/utils';
import { BaseSlider } from '../../../shared/components/common/BaseSlider';

interface ProfileSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture: string;
  language: string;
  timeFormat: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  appointmentReminders: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  twoFactorEnabled: boolean;
  profileVisibility: 'public' | 'private' | 'team';
  allowDirectBooking: boolean;
  showOnTeamPage: boolean;
}

const initialFormData: ProfileFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  profilePicture: '',
  language: 'en',
  timeFormat: '12',
  timezone: 'America/New_York',
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  marketingEmails: false,
  appointmentReminders: true,
  weeklyReports: true,
  securityAlerts: true,
  twoFactorEnabled: false,
  profileVisibility: 'public',
  allowDirectBooking: true,
  showOnTeamPage: true,
};

const ProfileSlider: React.FC<ProfileSliderProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  
  // UI state for dropdowns
  const [languageOpen, setLanguageOpen] = useState(false);
  const [timeFormatOpen, setTimeFormatOpen] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    toast.success('✅ Profile settings saved successfully');
    onClose();
  };

  const handleImageUpload = () => {
    toast.info('Image upload functionality would be implemented here');
  };

  // Data arrays
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
  ];

  const timeFormats = [
    { value: '12', label: '12-hour (2:30 PM)' },
    { value: '24', label: '24-hour (14:30)' },
  ];

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public - Visible to everyone' },
    { value: 'private', label: 'Private - Only visible to you' },
    { value: 'team', label: 'Team Only - Visible to team members' },
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <BaseSlider
      isOpen={isOpen}
      onClose={() => { onClose(); setFormData(initialFormData); }}
      title="Your Profile"
      contentClassName="bg-muted/50 scrollbar-hide"
      footer={
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => { onClose(); setFormData(initialFormData); }}
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
      }
    >
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
          <CardContent className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
              </div>
              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Profile Picture</Label>
                  <p className="text-xs text-muted-foreground">This appears on your team page and in client communications.</p>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={formData.profilePicture} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getInitials(formData.firstName, formData.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUpload}
                      className="h-10"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                  <p className="text-xs text-muted-foreground">Used for account access and notifications.</p>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
                  <p className="text-xs text-muted-foreground">For SMS notifications and client contact.</p>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="border-0 bg-muted/50 focus:bg-background text-base h-12"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
            {/* Preferences Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Preferences</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Language</Label>
                  <p className="text-xs text-muted-foreground">Interface language for your account.</p>
                  <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={languageOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.language ? languages.find(l => l.value === formData.language)?.label : "Select language"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search languages..." />
                        <CommandList>
                          <CommandEmpty>No languages found.</CommandEmpty>
                          <CommandGroup>
                            {languages.map((language) => (
                              <CommandItem
                                key={language.value}
                                value={language.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, language: language.value }));
                                  setLanguageOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.language === language.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {language.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Time Format</Label>
                  <p className="text-xs text-muted-foreground">How times are displayed throughout the app.</p>
                  <Popover open={timeFormatOpen} onOpenChange={setTimeFormatOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={timeFormatOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.timeFormat ? timeFormats.find(t => t.value === formData.timeFormat)?.label : "Select time format"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search time formats..." />
                        <CommandList>
                          <CommandEmpty>No time formats found.</CommandEmpty>
                          <CommandGroup>
                            {timeFormats.map((format) => (
                              <CommandItem
                                key={format.value}
                                value={format.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, timeFormat: format.value }));
                                  setTimeFormatOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.timeFormat === format.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {format.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Timezone</Label>
                  <p className="text-xs text-muted-foreground">Your local timezone for appointment scheduling.</p>
                  <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={timezoneOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.timezone ? timezones.find(tz => tz.value === formData.timezone)?.label : "Select timezone"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search timezones..." />
                        <CommandList>
                          <CommandEmpty>No timezones found.</CommandEmpty>
                          <CommandGroup>
                            {timezones.map((tz) => (
                              <CommandItem
                                key={tz.value}
                                value={tz.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, timezone: tz.value }));
                                  setTimezoneOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.timezone === tz.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {tz.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            {/* Notification Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Notification Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive important updates via email.</p>
                    </div>
                    <Switch
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotifications: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">SMS Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive urgent alerts via text message.</p>
                    </div>
                    <Switch
                      checked={formData.smsNotifications}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smsNotifications: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Browser and mobile app notifications.</p>
                    </div>
                    <Switch
                      checked={formData.pushNotifications}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pushNotifications: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Appointment Reminders</Label>
                      <p className="text-xs text-muted-foreground">Get notified about upcoming appointments.</p>
                    </div>
                    <Switch
                      checked={formData.appointmentReminders}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, appointmentReminders: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Weekly Reports</Label>
                      <p className="text-xs text-muted-foreground">Weekly summary of your business metrics.</p>
                    </div>
                    <Switch
                      checked={formData.weeklyReports}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, weeklyReports: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Marketing Emails</Label>
                      <p className="text-xs text-muted-foreground">Product updates and marketing content.</p>
                    </div>
                    <Switch
                      checked={formData.marketingEmails}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingEmails: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Privacy & Security Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Privacy & Security</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Profile Visibility</Label>
                  <p className="text-xs text-muted-foreground">Who can see your profile information.</p>
                  <Popover open={visibilityOpen} onOpenChange={setVisibilityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={visibilityOpen}
                        className="border-0 bg-muted/50 hover:bg-muted/70 h-12 text-base justify-between w-full"
                      >
                        {formData.profileVisibility ? visibilityOptions.find(v => v.value === formData.profileVisibility)?.label : "Select visibility"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 z-[80]">
                      <Command>
                        <CommandInput placeholder="Search visibility options..." />
                        <CommandList>
                          <CommandEmpty>No options found.</CommandEmpty>
                          <CommandGroup>
                            {visibilityOptions.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, profileVisibility: option.value as any }));
                                  setVisibilityOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.profileVisibility === option.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Two-Factor Authentication</Label>
                      <p className="text-xs text-muted-foreground">Add extra security to your account.</p>
                    </div>
                    <Switch
                      checked={formData.twoFactorEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, twoFactorEnabled: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Security Alerts</Label>
                      <p className="text-xs text-muted-foreground">Get notified of suspicious account activity.</p>
                    </div>
                    <Switch
                      checked={formData.securityAlerts}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, securityAlerts: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Allow Direct Booking</Label>
                      <p className="text-xs text-muted-foreground">Let clients book appointments directly with you.</p>
                    </div>
                    <Switch
                      checked={formData.allowDirectBooking}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowDirectBooking: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-foreground">Show on Team Page</Label>
                      <p className="text-xs text-muted-foreground">Display your profile on the team page.</p>
                    </div>
                    <Switch
                      checked={formData.showOnTeamPage}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnTeamPage: checked }))}
                      className="!h-5 !w-9 !min-h-0 !min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </BaseSlider>
  );
};

export default ProfileSlider; 
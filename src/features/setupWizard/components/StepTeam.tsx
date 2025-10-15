import { forwardRef, useImperativeHandle, useEffect, useCallback, useState } from 'react';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Badge } from '../../../shared/components/ui/badge';
import { Plus, X, User } from 'lucide-react';
import type { StepProps, StepHandle } from '../types';
import { UserRole } from '../../../shared/types/auth';
import { useForm } from 'react-hook-form';
import { getRoleBadgeColor, getRoleDisplayName } from '../utils';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StepTeam = forwardRef<StepHandle, StepProps>(({ data, onValidityChange }, ref) => {
  // Local state for team data
  const [localTeamMembers, setLocalTeamMembers] = useState(data.teamMembers || []);
  const [localWorksSolo, setLocalWorksSolo] = useState(data.worksSolo || false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isValid } } = useForm<{ email: string; role: UserRole }>({
    defaultValues: { email: '', role: UserRole.TEAM_MEMBER },
    mode: 'onChange',
  });

  // Notify parent that team step is always valid
  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(true);
    }
  }, [onValidityChange]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getFormData: () => ({ 
      teamMembers: localTeamMembers, 
      worksSolo: localWorksSolo 
    }),
    triggerValidation: async () => true, // No validation needed for this step
    isValid: () => true, // Team step is always valid (optional)
  }));

  // Sync local state when data changes from Redux
  useEffect(() => {
    setLocalTeamMembers(data.teamMembers || []);
    setLocalWorksSolo(data.worksSolo || false);
  }, [data]);

  const addTeamMember = handleSubmit(({ email, role }) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    const duplicate = localTeamMembers.some(m => m.email.toLowerCase() === trimmedEmail);
    if (duplicate) return;
    const invitation = { id: Date.now().toString(), email: trimmedEmail, role, status: 'pending' as const };
    setLocalTeamMembers(prev => [...prev, invitation]);
    setLocalWorksSolo(false);
    reset({ email: '', role });
  });

  const removeMember = useCallback((index: number) => {
    setLocalTeamMembers(prev => {
      const newMembers = prev.filter((_, i) => i !== index);
      if (newMembers.length === 0) {
        setLocalWorksSolo(true);
      }
      return newMembers;
    });
  }, []);

  const handleWorksSoloChange = useCallback((worksSolo: boolean) => {
    setLocalWorksSolo(worksSolo);
    if (worksSolo) {
      setLocalTeamMembers([]);
    }
  }, []);

  return (
    <div className="space-y-6">
        {/* Solo Work Toggle */}
        <div className="bg-accent/20 border border-accent/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="worksSolo" className="text-sm font-medium">
                  I work solo
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Skip team setup - you can always add team members later
                </p>
              </div>
            </div>
            <Switch
              id="worksSolo"
              checked={localWorksSolo}
              onCheckedChange={handleWorksSoloChange}
              className={`!h-5 !w-9 !min-h-0 !min-w-0 ${localWorksSolo ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        </div>

        {!localWorksSolo && (
          <>
            {/* Current Team Members */}
            {localTeamMembers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Team Members</Label>
                <div className="space-y-2">
                  {localTeamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-card border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{member.email}</div>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${getRoleBadgeColor(member.role)}`}
                        >
                          {getRoleDisplayName(member.role)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMember(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Team Member */}
            <div className="space-y-4 border-t pt-6">
              <Label className="text-sm font-medium">Invite Team Member</Label>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="team.member@example.com"
                  className="h-10 border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0"
                  {...register('email', { required: true, pattern: emailRegex })}
                />
                <div className="h-5">
                  {errors.email && (
                    <div className="text-xs text-red-600">Enter a valid email address</div>
                  )}
                </div>
                <Select
                  value={watch('role')}
                  onValueChange={(value: UserRole) => 
                    setValue('role', value, { shouldDirty: true, shouldTouch: true })
                  }
                >
                  <SelectTrigger className="h-10 w-full border-gray-200 hover:border-gray-300 focus:border-blue-400 transition-all focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.TEAM_MEMBER}>
                      <div className="text-left">
                        <div className="font-medium">Team Member</div>
                        <div className="text-xs text-muted-foreground">Manage bookings and availability</div>
                      </div>
                    </SelectItem>
                    <SelectItem value={UserRole.MANAGER}>
                      <div className="text-left">
                        <div className="font-medium">Manager</div>
                        <div className="text-xs text-muted-foreground">Manage team and business settings</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addTeamMember} 
                  disabled={!isValid} 
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Team Member
                </Button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-muted/50 border border-muted rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="h-8 w-8 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Team invitations
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Team members will receive an email invitation to join your business account. They can set their own availability and manage their bookings.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {localWorksSolo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800 mb-1">
                  {`Perfect! You're all set to work solo`}
                </p>
                <p className="text-xs text-emerald-700">
                  You can always invite team members later from your dashboard settings.
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
});

StepTeam.displayName = 'StepTeam';

export default StepTeam; 
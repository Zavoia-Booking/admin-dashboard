import React from 'react';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Badge } from '../../../shared/components/ui/badge';
import { Users, Plus, X, User } from 'lucide-react';
import type { StepProps } from '../types';
import { UserRole } from '../../../shared/types/auth';
import { useForm } from 'react-hook-form';
import { getRoleBadgeColor, getRoleDisplayName } from '../utils';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StepTeam: React.FC<StepProps> = ({ data, onUpdate }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isValid } } = useForm<{ email: string; role: UserRole }>({
    defaultValues: { email: '', role: UserRole.TEAM_MEMBER },
    mode: 'onChange',
  });

  const addTeamMember = handleSubmit(({ email, role }) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    const duplicate = data.teamMembers.some(m => m.email.toLowerCase() === trimmedEmail);
    if (duplicate) return;
    const invitation = { id: Date.now().toString(), email: trimmedEmail, role, status: 'pending' as const };
    onUpdate({ 
      teamMembers: [...data.teamMembers, invitation],
      worksSolo: false 
    });
    reset({ email: '', role });
  });

  const removeMember = (index: number) => {
    const newMembers = data.teamMembers.filter((_, i) => i !== index);
    onUpdate({ 
      teamMembers: newMembers,
      worksSolo: newMembers.length === 0 
    });
  };

  const handleWorksSoloChange = (worksSolo: boolean) => {
    onUpdate({ 
      worksSolo,
      teamMembers: worksSolo ? [] : data.teamMembers 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{`Who's on your team?`}</h3>
          <p className="text-sm text-muted-foreground">Invite team members to manage bookings and services</p>
        </div>
      </div>

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
              checked={data.worksSolo}
              onCheckedChange={handleWorksSoloChange}
              className={`!h-5 !w-9 !min-h-0 !min-w-0 ${data.worksSolo ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        </div>

        {!data.worksSolo && (
          <>
            {/* Current Team Members */}
            {data.teamMembers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Team Members</Label>
                <div className="space-y-2">
                  {data.teamMembers.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-card border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{member.email}</div>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${getRoleBadgeColor(UserRole.TEAM_MEMBER)}`}
                        >
                          {getRoleDisplayName(UserRole.TEAM_MEMBER)}
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
                  className="h-11"
                  {...register('email', { required: true, pattern: emailRegex })}
                />
                {errors.email && (
                  <div className="text-xs text-red-600">Enter a valid email address</div>
                )}
                <Select
                  value={watch('role')}
                  onValueChange={(value: UserRole) => 
                    setValue('role', value, { shouldDirty: true, shouldTouch: true })
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.TEAM_MEMBER}>
                      <div className="text-left">
                        <div className="font-medium">Team Member</div>
                        <div className="text-xs text-muted-foreground">Manage bookings and availability</div>
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
                <Users className="h-8 w-8 text-muted-foreground mt-0.5" />
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

        {data.worksSolo && (
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
    </div>
  );
};

export default StepTeam; 
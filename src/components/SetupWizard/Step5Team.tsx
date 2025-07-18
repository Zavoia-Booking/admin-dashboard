import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, X, User } from 'lucide-react';
import { WizardData } from '@/hooks/useSetupWizard';
import { UserRole } from '@/types/auth';

interface Step5Props {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
}

const Step5Team: React.FC<Step5Props> = ({ data, onUpdate }) => {
  const [newMember, setNewMember] = useState({ email: '', role: UserRole.TEAM_MEMBER });

  const addTeamMember = () => {
    if (newMember.email.trim()) {
      onUpdate({ 
        teamMembers: [...data.teamMembers, newMember],
        worksSolo: false 
      });
      setNewMember({ email: '', role: UserRole.TEAM_MEMBER });
    }
  };

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

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-800 border-red-200';
      case UserRole.TEAM_MEMBER: return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.MANAGER: return 'bg-green-100 text-green-800 border-green-200';
      case UserRole.OWNER: return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Admin';
      case UserRole.TEAM_MEMBER: return 'Team Member';
      case UserRole.MANAGER: return 'Manager';
      case UserRole.OWNER: return 'Owner';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Who's on your team?</h3>
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
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  className="h-11"
                />
                <Select
                  value={newMember.role}
                  onValueChange={(value: UserRole) => 
                    setNewMember(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>
                      <div className="text-left">
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">Full access to all features</div>
                      </div>
                    </SelectItem>
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
                  disabled={!newMember.email.trim()} 
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Send Invitation
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
                  Perfect! You're all set to work solo
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

export default Step5Team; 
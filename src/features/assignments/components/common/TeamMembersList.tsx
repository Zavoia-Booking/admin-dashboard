import { Users } from 'lucide-react';
import { Pill } from '../../../../shared/components/ui/pill';

interface TeamMember {
  id: number | string;
  name: string;
  email?: string;
}

interface TeamMembersListProps {
  allTeamMembers: TeamMember[];
  assignedTeamMemberIds: number[];
  onToggle: (id: number) => void;
}

export function TeamMembersList({ allTeamMembers, assignedTeamMemberIds, onToggle }: TeamMembersListProps) {
  if (allTeamMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {allTeamMembers.map((teamMember) => {
        const isAssigned = assignedTeamMemberIds.includes(Number(teamMember.id));

        return (
          <Pill
            key={teamMember.id}
            selected={isAssigned}
            icon={Users}
            className="w-auto justify-start items-start transition-none active:scale-100"
            showCheckmark={true}
            onClick={() => onToggle(Number(teamMember.id))}
          >
            <div className="flex flex-col text-left">
              <div className="flex items-center">
                {teamMember.name}
              </div>
              {teamMember.email && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {teamMember.email}
                </div>
              )}
            </div>
          </Pill>
        );
      })}
    </div>
  );
}


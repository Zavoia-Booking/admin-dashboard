interface AssignedTeamMember {
  id: number | string;
  name: string;
  subtitle?: string;
}

interface AssignedTeamMembersProps {
  teamMembers: AssignedTeamMember[];
  onRemove: (id: number) => void;
}

export function AssignedTeamMembers({ teamMembers, onRemove }: AssignedTeamMembersProps) {
  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {teamMembers.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-2 border rounded"
        >
          <div>
            <div>{member.name}</div>
            {member.subtitle && (
              <div className="text-sm text-muted-foreground">
                {member.subtitle}
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(Number(member.id))}
            className="text-destructive hover:underline text-sm"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}


interface AvailableTeamMember {
  id: number | string;
  name: string;
}

interface AvailableTeamMembersProps {
  teamMembers: AvailableTeamMember[];
  onAdd: (id: number) => void;
}

export function AvailableTeamMembers({ teamMembers, onAdd }: AvailableTeamMembersProps) {
  return (
    <select
      onChange={(e) => {
        const value = Number(e.target.value);
        if (value) {
          onAdd(value);
        }
      }}
      className="w-full border rounded px-3 py-2"
      value=""
    >
      <option value="">+ Add Team Members</option>
      {teamMembers.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </select>
  );
}


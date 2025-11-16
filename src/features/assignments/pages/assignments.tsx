import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Users } from 'lucide-react';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';
import { TeamMembersAssignments } from '../components/Team/TeamMembersAssignments';
// import { LocationsAssignments } from '../components/Locations/LocationsAssignments';
// import { ServicesAssignments } from '../components/Services/ServicesAssignments';

type AssignmentTab = 'team_members' | 'services' | 'locations';

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get initial tab from URL or default to 'team_members'
  const getInitialTab = (): AssignmentTab => {
    const tab = searchParams.get('tab') as AssignmentTab | null;
    if (tab && (tab === 'team_members' || tab === 'services' || tab === 'locations')) {
      return tab;
    }
    return 'team_members';
  };

  const [activeTab, setActiveTab] = React.useState<AssignmentTab>(getInitialTab());

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as AssignmentTab | null;
    if (tab && (tab === 'team_members' || tab === 'services' || tab === 'locations')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    const tab = tabId as AssignmentTab;
    setActiveTab(tab);
    navigate(`/assignments?tab=${tab}`);
  };

  const tabItems: ResponsiveTabItem[] = [
    {
      id: 'team_members',
      label: 'Team Members',
      icon: Users,
      content: <TeamMembersAssignments />,
    },
    // {
    //   id: 'services',
    //   label: 'Services',
    //   icon: Wrench,
    //   content: <ServicesAssignments />,
    // },
    // {
    //   id: 'locations',
    //   label: 'Locations',
    //   icon: MapPin,
    //   content: <LocationsAssignments />,
    // },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Assignments</h1>
        </div>

        {/* Responsive Tabs */}
        <ResponsiveTabs
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
        />
      </div>
    </AppLayout>
  );
}

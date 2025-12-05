import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppLayout } from '../../../shared/components/layouts/app-layout';
import { Briefcase, MapPin, Users } from 'lucide-react';
import { ResponsiveTabs, type ResponsiveTabItem } from '../../../shared/components/ui/responsive-tabs';
import { TeamMembersAssignments } from '../components/Team/TeamMembersAssignments';
import { ServicesAssignments } from '../components/Services/ServicesAssignments';
import { LocationsAssignments } from '../components/Locations/LocationsAssignments';
import { selectTeamMemberAction, selectServiceAction, selectLocationAction } from '../actions';
// import { LocationsAssignments } from '../components/Locations/LocationsAssignments';
// import { ServicesAssignments } from '../components/Services/ServicesAssignments';

type AssignmentTab = 'team_members' | 'services' | 'locations';

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const location = useLocation();
  
  // Track the last location.key to detect new navigation to this page
  const lastLocationKeyRef = useRef<string | null>(null);
  
  // Track if we've cleared selections for this navigation - prevents flash
  const [isReady, setIsReady] = useState(false);
  
  // Clear all selections when navigating TO the assignments page
  // location.key changes on every navigation (even to the same URL)
  useEffect(() => {
    if (location.pathname === '/assignments' && location.key !== lastLocationKeyRef.current) {
      setIsReady(false);
      dispatch(selectTeamMemberAction(null));
      dispatch(selectServiceAction(null));
      dispatch(selectLocationAction(null));
      lastLocationKeyRef.current = location.key;
      // Small delay to let Redux state update before showing content
      requestAnimationFrame(() => setIsReady(true));
    }
  }, [location.pathname, location.key, dispatch]);

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
    // Use replace so tab switches don't pollute browser history
    navigate(`/assignments?tab=${tab}`, { replace: true });
  };

  const tabItems: ResponsiveTabItem[] = [
    {
      id: 'team_members',
      label: 'Team Members',
      icon: Users,
      content: isReady ? <TeamMembersAssignments /> : null,
    },
    {
      id: 'services',
      label: 'Services',
      icon: Briefcase,
      content: isReady ? <ServicesAssignments /> : null,
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: MapPin,
      content: isReady ? <LocationsAssignments /> : null,
    },
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

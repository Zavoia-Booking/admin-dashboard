import React, { useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { Briefcase, MapPin, Users } from "lucide-react";
import {
  ResponsiveTabs,
  type ResponsiveTabItem,
} from "../../../shared/components/ui/responsive-tabs";
import { TeamMembersAssignments } from "../components/Team/TeamMembersAssignments";
import { ServicesAssignments } from "../components/Services/ServicesAssignments";
import { LocationsAssignments } from "../components/Locations/LocationsAssignments";
import {
  selectTeamMemberAction,
  selectServiceAction,
  selectLocationAction,
} from "../actions";

type AssignmentTab = "team_members" | "services" | "locations";

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const location = useLocation();

  // Track the last location.key to detect new navigation to this page
  const lastLocationKeyRef = useRef<string | null>(null);

  // Clear all selections when navigating TO the assignments page
  // location.key changes on every navigation (even to the same URL)
  useEffect(() => {
    if (
      location.pathname === "/assignments" &&
      location.key !== lastLocationKeyRef.current
    ) {
      dispatch(selectTeamMemberAction(null));
      dispatch(selectServiceAction(null));
      dispatch(selectLocationAction(null));
      lastLocationKeyRef.current = location.key;
    }
  }, [location.pathname, location.key, dispatch]);

  // Get initial tab from URL or default to 'team_members'
  const getInitialTab = (): AssignmentTab => {
    const tab = searchParams.get("tab") as AssignmentTab | null;
    if (
      tab &&
      (tab === "team_members" || tab === "services" || tab === "locations")
    ) {
      return tab;
    }
    return "team_members";
  };

  const [activeTab, setActiveTab] = React.useState<AssignmentTab>(
    getInitialTab()
  );

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab") as AssignmentTab | null;
    if (
      tab &&
      (tab === "team_members" || tab === "services" || tab === "locations")
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    const tab = tabId as AssignmentTab;
    // Prevent navigation if clicking the same tab
    if (tab === activeTab) {
      return;
    }
    setActiveTab(tab);
    // Use replace so tab switches don't pollute browser history
    navigate(`/assignments?tab=${tab}`, { replace: true });
  };

  // Memoize tab items to prevent unnecessary remounts - always render components
  // Components handle their own loading states internally
  const tabItems: ResponsiveTabItem[] = React.useMemo(() => [
    {
      id: "team_members",
      label: "Team Members",
      mobileLabel: "Members",
      icon: Users,
      content: <TeamMembersAssignments />,
    },
    {
      id: "services",
      label: "Services",
      icon: Briefcase,
      content: <ServicesAssignments />,
    },
    {
      id: "locations",
      label: "Locations",
      icon: MapPin,
      content: <LocationsAssignments />,
    },
  ], []);

  return (
    <AppLayout>
      <div className="space-y-6">
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

import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '../ui/sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getAllLocationsSelector, getCurrentLocationSelector } from '../../../features/locations/selectors';
import { setCurrentLocation } from '../../../features/locations/actions';
import type { LocationType } from '../../../shared/types/location';

export function MobileHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  const dispatch = useDispatch();
  const allLocations: LocationType[] = useSelector(getAllLocationsSelector);
  const current = useSelector(getCurrentLocationSelector);

  // Get page title based on current path
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/calendar':
        return 'Calendar';
      case '/team-members':
        return 'Team Members';
      case '/services':
        return 'Services';
      case '/locations':
        return 'Locations';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      default:
        return 'Admin';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu + Title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-10 w-10" />
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>

        {/* Right side - Search and Notifications */}
        <div className="flex items-center space-x-2">
          {allLocations && allLocations.length > 1 ? (
            <Select
              value={current?.id ? String(current.id) : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  dispatch(setCurrentLocation({ location: null }));
                  try { localStorage.removeItem('currentLocationId'); } catch {}
                } else {
                  const next = allLocations.find(l => String(l.id) === value) || null;
                  dispatch(setCurrentLocation({ location: next }));
                  try { if (next?.id != null) localStorage.setItem('currentLocationId', String(next.id)); } catch {}
                }
              }}
            >
              <SelectTrigger className="min-w-[180px] h-10">
                <SelectValue placeholder={current?.name || 'All locations'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {allLocations.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-gray-600">{current?.name || 'No location'}</span>
          )}
        </div>
      </div>
    </header>
  );
} 
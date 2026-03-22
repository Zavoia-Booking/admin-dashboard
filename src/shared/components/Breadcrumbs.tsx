import React, { useMemo } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationBell } from './common/NotificationBell';

export type BreadcrumbItemType = {
  label: string;
  path?: string; // If no path, it's the current page (not clickable)
  icon?: React.ReactNode;
};

interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
}

const BELL_ROUTES = new Set([
  '/dashboard',
  '/calendar',
  '/assignments',
  '/team-members',
  '/customers',
  '/services',
  '/locations',
  '/support',
]);

const SETTINGS_BELL_TABS = new Set(['billing', 'advanced']);

function shouldShowBell(pathname: string, search: string): boolean {
  if (BELL_ROUTES.has(pathname) || pathname.startsWith('/dashboard/')) return true;

  if (pathname === '/settings') {
    const tab = new URLSearchParams(search).get('tab');
    return tab !== null && SETTINGS_BELL_TABS.has(tab);
  }

  return false;
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const current = items[items.length - 1];
  const showBell = useMemo(
    () => shouldShowBell(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-surface px-1 py-2 py-1 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          rounded="full"
          onClick={handleBack}
          className="h-8 !w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-lg font-semibold text-foreground-1 truncate min-w-0">
          {current?.label}
        </span>

        {showBell && (
          <div className="ml-auto">
            <NotificationBell variant="header" />
          </div>
        )}
      </div>
    </div>
  );
};


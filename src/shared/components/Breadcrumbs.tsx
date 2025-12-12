import React from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';

export type BreadcrumbItemType = {
  label: string;
  path?: string; // If no path, it's the current page (not clickable)
  icon?: React.ReactNode;
};

interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();

  const current = items[items.length - 1];

  const handleBack = () => {
    // Always go back in browser history to better match user expectation
    navigate(-1);
  };

  return (
    <div className="bg-surface px-1 py-1 shadow-sm">
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
      </div>
    </div>
  );
};


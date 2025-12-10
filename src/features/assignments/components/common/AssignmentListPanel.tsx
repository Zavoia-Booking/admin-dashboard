import React from 'react';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { Badge } from '../../../../shared/components/ui/badge';
import { SearchInput } from '../../../../shared/components/common/SearchInput';
import { cn } from '../../../../shared/lib/utils';

export interface ListItem {
  id: number;
  profileImage?: string | null;
  title: string;
  subtitle?: string;
  badges?: Array<{ label: string; value: number }>;
}

interface AssignmentListPanelProps {
  title: string;
  items: ListItem[];
  selectedId?: number | string | null;
  onSelect: (id: number | string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyStateComponent?: React.ReactNode;
  renderItem?: (item: ListItem, isSelected: boolean) => React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export function AssignmentListPanel({
  title,
  items,
  selectedId,
  onSelect,
  isLoading = false,
  emptyMessage = 'No items found',
  emptyStateComponent,
  renderItem,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = false,
}: AssignmentListPanelProps) {
  const defaultRenderItem = (item: ListItem, isSelected: boolean) => (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/60 focus-visible:ring-offset-0',
        isSelected
          ? 'border-primary bg-info-100/70 shadow-xs'
          : 'border-border-subtle bg-transparent hover:border-border-strong hover:bg-surface-hover active:scale-[0.99]'
      )}
    >
      <div className="font-medium text-foreground-1 truncate">{item.title}</div>
      {item.subtitle && (
        <div className="text-xs text-foreground-3 dark:text-foreground-2 mt-0.5 truncate">
          {item.subtitle}
        </div>
      )}
      {item.badges && item.badges.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {item.badges.map((badge, index) => (
            <Badge key={index} variant="secondary" className="text-xs h-5 px-1.5">
              {badge.value} {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );

  return (
    <div className="col-span-12 md:col-span-4 flex flex-col h-full">
      <div className="flex flex-col h-full gap-3">
        {/* Header / controls */}
        <div className="px-2 md:px-0">
          {showSearch && onSearchChange && (
            <div className="mt-0">
              <SearchInput
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={onSearchChange}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Floating list card */}
        <div className="flex-1 min-h-0 px-2 md:px-0 pb-2">
          <div className="h-full bg-transparent flex flex-col">
              <div
                className={cn(
                  'flex-1 overflow-y-auto px-0.5 py-3',
                  items.length > 0 ? 'space-y-2' : ''
                )}
              >
                {items.length === 0 ? (
                  emptyStateComponent || (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="text-sm text-foreground-3 dark:text-foreground-2">
                        {emptyMessage}
                      </div>
                    </div>
                  )
                ) : (
                  items.map((item) => {
                    const isSelected = selectedId === item.id;
                    const renderedItem = renderItem
                      ? renderItem(item, isSelected)
                      : defaultRenderItem(item, isSelected);
                    return (
                      <React.Fragment key={item.id}>
                        {renderedItem}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}


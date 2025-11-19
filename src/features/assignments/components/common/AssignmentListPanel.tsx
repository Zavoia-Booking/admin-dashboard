import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { Badge } from '../../../../shared/components/ui/badge';

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
}: AssignmentListPanelProps) {
  const defaultRenderItem = (item: ListItem, isSelected: boolean) => (
    <button
      key={item.id}
      onClick={() => onSelect(item.id)}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="font-medium">{item.title}</div>
      {item.subtitle && (
        <div className="text-sm text-muted-foreground">{item.subtitle}</div>
      )}
      {item.badges && item.badges.length > 0 && (
        <div className="flex gap-2 mt-2">
          {item.badges.map((badge, index) => (
            <Badge key={index} variant="secondary">
              {badge.value} {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );

  return (
    <Card className="col-span-4 md:col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {items.length === 0 ? (
              emptyStateComponent || (
                <div className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </div>
              )
            ) : (
              items.map((item) => {
                const isSelected = selectedId === item.id;
                return renderItem
                  ? renderItem(item, isSelected)
                  : defaultRenderItem(item, isSelected);
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


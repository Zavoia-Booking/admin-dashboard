import React from "react";
import { Badge } from "../ui/badge";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { getReadableTextColor } from "../../utils/color";

export interface ItemCardMetadata {
  icon?: LucideIcon;
  label: string;
  value: string | number;
}

export interface ItemCardCategory {
  name: React.ReactNode;
  color?: string;
  icon?: LucideIcon;
}

export interface ItemCardAction {
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "destructive";
}

export interface ItemCardBadge {
  label: string;
  count: number;
  icon?: LucideIcon;
}

export interface ItemCardProps {
  title: React.ReactNode;
  customContent?: React.ReactNode;
  category?: ItemCardCategory | null;
  badges?: ItemCardBadge[];
  metadata?: ItemCardMetadata[];
  price?: number | string;
  actions?: ItemCardAction[];
  onClick?: () => void;
  className?: string;
  variant?: "default" | "compact";
  thumbnail?: React.ReactNode;
  bottomActions?: React.ReactNode;
}

export function ItemCard({
  title,
  customContent,
  category,
  badges = [],
  metadata = [],
  price,
  actions = [],
  onClick,
  className,
  variant = "default",
  thumbnail,
  bottomActions,
}: ItemCardProps) {
  const hasSecondaryMetadata = metadata.length > 0;

  return (
    <div
      className={cn(
        "group rounded-xl border border-border dark:border-border bg-surface dark:bg-transparent overflow-hidden shadow-sm transition-all duration-300 flex flex-col",
        onClick && "cursor-pointer hover:border-border-strong dark:hover:border-border hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("flex-1 flex flex-col", variant === "default" ? "px-4 py-3" : "px-4 py-3")}>
        {/* Header with Edit Button */}
        <div className={cn(variant === "default" ? "mb-5" : "mb-3")}>
          <div className="flex items-center justify-between gap-3">
            {/* Thumbnail/Avatar */}
            {thumbnail && (
              <div className="flex-shrink-0">
                {thumbnail}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-foreground-1 line-clamp-1 truncate leading-tight",
                  variant === "default" ? "text-lg" : "text-base"
                )}
              >
                {title}
              </h3>
              {customContent && (
                <div className="mt-1">
                  {customContent}
                </div>
              )}
            </div>
            {/* Edit Button */}
            {actions.length > 0 && actions[0] && (
              <button
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 flex-shrink-0 cursor-pointer",
                  "text-foreground-3 dark:text-foreground-2 hover:text-foreground-1 hover:bg-muted/50 dark:hover:bg-neutral-800 active:scale-95"
                )}
                title={actions[0].label}
                onClick={(e) => {
                  e.stopPropagation();
                  actions[0].onClick(e);
                }}
              >
                {(() => {
                  const ActionIcon = actions[0].icon;
                  return <ActionIcon className="h-4 w-4" />;
                })()}
              </button>
            )}
          </div>
        </div>

        {/* Category and Badges */}
        {(category || badges.length > 0) && (
          <div className={cn("flex flex-wrap items-center gap-2", variant === "default" ? "mb-6" : "mb-3")}>
            {category && (
              <Badge
                variant="secondary"
                className={cn(
                  "font-medium max-w-48",
                  variant === "default" ? "text-xs" : "text-[10px]",
                  variant === "default" ? "h-8 py-2 px-3" : "h-2.5"
                )}
                style={{
                  backgroundColor: category.color ? `${category.color}` : undefined,
                  borderColor: category.color || undefined,
                  color: category.color ? getReadableTextColor(category.color) : undefined,
                }}
              >
                {category.icon && (
                  <category.icon
                    className={cn("mr-1.5 flex-shrink-0", variant === "default" ? "h-3 w-3" : "h-2.5 w-2.5")}
                    style={{
                      color: category.color ? getReadableTextColor(category.color) : undefined,
                    }}
                  />
                )}
                <span className="truncate">{category.name}</span>
              </Badge>
            )}
            {badges.map((badge, index) => (
              <Badge
                key={index}
                variant="secondary"
                className={cn(
                  "font-medium",
                  variant === "default" ? "text-xs" : "text-[10px]",
                  variant === "default" ? "h-8 w-fit py-2 px-3" : "h-2.5 w-2.5"
                )}
              >
                {badge.icon && (
                  <badge.icon
                    className={cn("mr-1.5 flex-shrink-0", variant === "default" ? "h-3 w-3" : "h-2.5 w-2.5")}
                  />
                )}
                {badge.count} {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="mt-auto space-y-3">
          {/* Primary metadata row (duration/price) */}
          {(metadata.length > 0 || price !== undefined) && (
            <div className="flex items-center justify-between pb-1">
              {metadata.length > 0 && metadata[0] && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-foreground-2 dark:text-foreground-2",
                    variant === "default" ? "text-sm" : "text-xs"
                  )}
                >
                  {metadata[0].icon && (() => {
                    const Icon = metadata[0].icon!;
                    return (
                      <Icon
                        className={cn(
                          "text-foreground-3 dark:text-foreground-2 flex-shrink-0",
                          variant === "default" ? "h-4 w-4" : "h-3.5 w-3.5"
                        )}
                      />
                    );
                  })()}
                  <span className="font-medium">{metadata[0].value}</span>
                </div>
              )}
              {price !== undefined && (
                <div
                  className={cn(
                    "font-bold text-foreground-1",
                    variant === "default" ? "text-xl" : "text-lg"
                  )}
                >
                  ${price}
                </div>
              )}
            </div>
          )}

          {/* Secondary metadata (locations, team members, etc.) */}
          {hasSecondaryMetadata && metadata.length > 1 && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-3 text-foreground-3 dark:text-foreground-2 pt-3 border-t border-border-subtle",
                variant === "default" ? "text-xs" : "text-[10px]"
              )}
            >
              {metadata.slice(1).map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  {item.icon && (
                    <item.icon
                      className={cn(
                        "flex-shrink-0 text-foreground-3 dark:text-foreground-2",
                        variant === "default" ? "h-3.5 w-3.5" : "h-3 w-3"
                      )}
                    />
                  )}
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Actions */}
          {bottomActions && (
            <div className="pt-3">
              {bottomActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


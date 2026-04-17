import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  rightContent?: ReactNode;
}

/**
 * Desktop-only page header with a title on the left and optional content
 * (typically an action button) on the right. Hidden on mobile, where the
 * breadcrumb header is used instead via `AppLayout headerRightContent`.
 */
export function PageHeader({ title, rightContent }: PageHeaderProps) {
  return (
    <div className="mb-4 w-full border-b border-border-strong hidden md:flex items-center justify-between pr-4">
      <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
        {title}
      </h1>
      {rightContent}
    </div>
  );
}

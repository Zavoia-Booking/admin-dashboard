import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

export type BreadcrumbItemType = {
  label: string;
  path?: string; // If no path, it's the current page (not clickable)
  icon?: React.ReactNode;
};

interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <div className="bg-white rounded-lg px-6 py-3 mb-6 shadow-sm">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <React.Fragment key={index}>
                <BreadcrumbItem className="flex items-center gap-1.5">
                  {item.icon && <span className="flex items-center">{item.icon}</span>}
                  {isLast || !item.path ? (
                    <BreadcrumbPage className="font-semibold text-sm">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        to={item.path}
                        className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};


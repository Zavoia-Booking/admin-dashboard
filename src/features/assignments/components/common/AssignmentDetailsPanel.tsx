import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card';
import { Button } from '../../../../shared/components/ui/button';
import { Spinner } from '../../../../shared/components/ui/spinner';
import { MultiSelect } from '../../../../shared/components/common/MultiSelect';

export interface AssignmentSection {
  title: string;
  icon?: string;
  assignedItems: Array<{
    id: number | string;
    name: string;
    subtitle?: string;
  }>;
  availableItems: Array<{
    id: number | string;
    name: string;
  }>;
  selectedIds: number[];
  onToggleSelection: (id: number) => void;
}

interface AssignmentDetailsPanelProps {
  title: string;
  sections: AssignmentSection[];
  onSave: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  emptyMessage?: string;
  renderEmptyState?: () => React.ReactNode;
}

export function AssignmentDetailsPanel({
  title,
  sections,
  onSave,
  isSaving = false,
  saveLabel = 'Save Changes',
  emptyMessage = 'Select an item from the list to manage its assignments',
  renderEmptyState,
}: AssignmentDetailsPanelProps) {
  if (!title || title === 'Select an item to manage assignments') {
    return (
      <Card className="col-span-8 md:col-span-8">
        <CardHeader>
          <CardTitle className="text-lg">{title || emptyMessage}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderEmptyState ? (
            renderEmptyState()
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>{emptyMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-8 md:col-span-8">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="font-medium mb-3">
                {section.icon && <span>{section.icon}</span>} {section.title}
              </h3>
              <div className="space-y-2">
                {section.assignedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <div>{item.name}</div>
                      {item.subtitle && (
                        <div className="text-sm text-muted-foreground">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => section.onToggleSelection(Number(item.id))}
                      className="text-destructive hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                {section.title === 'Services' ? (
                  <MultiSelect
                    value={section.selectedIds.map(String)}
                    onChange={(selectedIds) => {
                      // Find newly selected items and toggle them
                      const currentIds = new Set(section.selectedIds.map(String));
                      selectedIds.forEach((id) => {
                        if (!currentIds.has(String(id))) {
                          section.onToggleSelection(Number(id));
                        }
                      });
                      // Find removed items and toggle them
                      section.selectedIds.forEach((id) => {
                        if (!selectedIds.includes(String(id))) {
                          section.onToggleSelection(Number(id));
                        }
                      });
                    }}
                    options={section.availableItems.map(item => ({
                      id: String(item.id),
                      name: item.name,
                    }))}
                    placeholder={`+ Add ${section.title}`}
                    searchPlaceholder={`Search ${section.title.toLowerCase()}...`}
                  />
                ) : (
                  <select
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value) {
                        section.onToggleSelection(value);
                      }
                    }}
                    className="w-full border rounded px-3 py-2"
                    value=""
                  >
                    <option value="">+ Add {section.title}</option>
                    {section.availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? <Spinner size="sm" /> : saveLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


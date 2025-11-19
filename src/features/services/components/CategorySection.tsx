import React from 'react';
import { Tag } from 'lucide-react';
import { Label } from '../../../shared/components/ui/label';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import { CollapsibleFormSection } from '../../../shared/components/forms/CollapsibleFormSection';

export interface CategorySectionProps {
  categoryId?: number | null;
  categoryName?: string;
  categoryColor?: string;
  onCategoryIdChange: (value: number | null) => void;
  onCategoryNameChange: (value: string) => void;
  onCategoryColorChange: (value: string) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  mode?: 'add' | 'edit';
  existingCategoryName?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  categoryName,
  categoryColor,
  onCategoryIdChange,
  onCategoryNameChange,
  onCategoryColorChange,
  expanded,
  onExpandedChange,
  mode = 'add',
  existingCategoryName,
}) => {
  const handleRemove = () => {
    onCategoryIdChange(null);
    onCategoryNameChange('');
    onCategoryColorChange('');
  };

  return (
    <CollapsibleFormSection
      icon={Tag}
      title="Category"
      description="Organize services with categories (optional)"
      open={expanded}
      onOpenChange={onExpandedChange}
    >
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Service Category
        </Label>
        <div className="space-y-2">
          {categoryId && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1.5">
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                {existingCategoryName || categoryName || "Category"}
              </Badge>
              <button
                type="button"
                onClick={handleRemove}
                className="text-destructive hover:text-destructive/80 text-sm"
              >
                Remove
              </button>
            </div>
          )}
          {!categoryId && mode === 'add' && (
            <div className="space-y-2">
              <Input
                placeholder="Category name (e.g., Haircuts, Coloring)"
                value={categoryName || ""}
                onChange={(e) => onCategoryNameChange(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  className="w-20 h-10"
                  value={categoryColor || ""}
                  onChange={(e) => onCategoryColorChange(e.target.value)}
                />
                <span className="text-xs text-foreground-3 dark:text-foreground-2">
                  Category color
                </span>
              </div>
              <p className="text-xs text-foreground-3 dark:text-foreground-2">
                Leave empty to create service without category
              </p>
            </div>
          )}
          {mode === 'edit' && !categoryId && (
            <p className="text-xs text-foreground-3 dark:text-foreground-2">
              Category changes can be made by editing the category directly
            </p>
          )}
        </div>
      </div>
    </CollapsibleFormSection>
  );
};

export default CategorySection;


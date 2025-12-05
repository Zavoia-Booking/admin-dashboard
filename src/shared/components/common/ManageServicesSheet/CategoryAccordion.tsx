import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "../../ui/badge";
import { highlightMatches } from "../../../utils/highlight";
import { getColorHex, getReadableTextColor } from "../../../utils/color";
import { ServiceItem } from "./ServiceItem";
import type { CategoryGroup, CurrencyDisplay } from "./types";

interface CategoryAccordionProps {
  group: CategoryGroup;
  isExpanded: boolean;
  selectedServiceIds: number[];
  searchTerm: string;
  currencyDisplay: CurrencyDisplay;
  durationUnit: string;
  onToggleExpand: (categoryId: number | null) => void;
  onToggleService: (serviceId: number) => void;
  contentRef: (el: HTMLDivElement | null) => void;
}

export function CategoryAccordion({
  group,
  isExpanded,
  selectedServiceIds,
  searchTerm,
  currencyDisplay,
  durationUnit,
  onToggleExpand,
  onToggleService,
  contentRef,
}: CategoryAccordionProps) {
  const categoryBgColor = group.categoryColor
    ? group.categoryColor
    : getColorHex(group.categoryName);
  const categoryTextColor = getReadableTextColor(categoryBgColor);

  return (
    <div className="space-y-2">
      {/* Category header */}
      <button
        onClick={() => onToggleExpand(group.categoryId)}
        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-surface-hover cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Badge
            variant="secondary"
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              backgroundColor: categoryBgColor,
              color: categoryTextColor,
              borderColor: categoryBgColor,
            }}
          >
            {highlightMatches(group.categoryName, searchTerm)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({group.services.length})
          </span>
        </div>
      </button>

      {/* Services list */}
      <div
        ref={contentRef}
        data-slot="collapsible-content"
        data-state={isExpanded ? "open" : "closed"}
        className={`overflow-hidden ${isExpanded ? "h-auto" : "h-0"}`}
      >
        <div className="ml-4 space-y-1">
          {group.services.map((service) => (
            <ServiceItem
              key={service.id}
              service={service}
              isSelected={selectedServiceIds.includes(Number(service.id))}
              searchTerm={searchTerm}
              currencyDisplay={currencyDisplay}
              durationUnit={durationUnit}
              onToggle={onToggleService}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


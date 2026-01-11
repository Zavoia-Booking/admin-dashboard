import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import { BadgeCheck, Tag, ArrowUpRight } from "lucide-react";
import { Pill } from "../../../../shared/components/ui/pill.tsx";
import type { Industry, IndustryTag } from "../../types";

interface IndustrySectionProps {
  industries: Industry[];
  industryTags: IndustryTag[];
  selectedTags: IndustryTag[];
  onTagsChange: (tags: IndustryTag[]) => void;
  error?: string;
}

export const IndustrySection: React.FC<IndustrySectionProps> = ({
  industries,
  industryTags,
  selectedTags,
  onTagsChange,
  error,
}) => {
  const navigate = useNavigate();
  const toggleTag = (tag: IndustryTag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const businessIndustry = industries[0];

  return (
    <div className="space-y-6">
      <SectionDivider
        title="Industry & Tags"
        className="uppercase tracking-wider text-foreground-2"
      />

      <div className="group relative rounded-2xl p-4 border transition-all duration-300 bg-surface-active dark:bg-neutral-900 border-border flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-medium text-foreground-1">
            Primary Industry
          </h3>
          <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
            This is the primary industry your business is listed under, ensuring
            you appear in the right search results. If you need to update it,
            you can do so in your{" "}
            <span
              onClick={() => navigate("/settings")}
              className="inline-flex items-center gap-0.5 cursor-pointer font-semibold text-foreground-1 dark:text-foreground-1 hover:text-primary dark:hover:text-primary"
            >
              Settings
              <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden="true" />
            </span>
            .
          </p>
        </div>

        {businessIndustry && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border w-fit shadow-sm">
            <BadgeCheck className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold text-foreground-1 capitalize">
              {businessIndustry.name}
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-border space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground-1">
              Marketplace Tags
            </h3>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
              Customers often filter their searches by category. Select the tags
              that best describe your services to ensure you're easily
              discoverable by the right audience.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {industryTags.map((tag) => {
              const isSelected = selectedTags.some((t) => t.id === tag.id);
              return (
                <Pill
                  key={tag.id}
                  selected={isSelected}
                  icon={Tag}
                  className="w-auto justify-start items-center transition-none active:scale-100 min-h-0 py-2.5 px-4"
                  showCheckmark={true}
                  onClick={() => toggleTag(tag)}
                >
                  <span className="text-sm font-medium">{tag.name}</span>
                </Pill>
              );
            })}
          </div>

          {error && (
            <p className="text-xs font-medium text-destructive mt-2 animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndustrySection;

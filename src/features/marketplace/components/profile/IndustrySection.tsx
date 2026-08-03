import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import { BadgeCheck, Tag, ArrowUpRight } from "lucide-react";
import { AttentionDot } from "../../../../shared/components/common/AttentionDot";
import { Pill } from "../../../../shared/components/ui/pill.tsx";
import type { Industry, IndustryTag } from "../../types";
import { useTranslation, Trans } from "react-i18next";

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
  const { t } = useTranslation("marketplace");
  const { t: tIndustry } = useTranslation("industries");


  const toggleTag = (tag: IndustryTag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const businessIndustry = industries[0];
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#industry" && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const SettingsLink = ({ children }: { children?: React.ReactNode }) => (
    <span
      onClick={() => navigate("/account")}
      data-navigate-to="/account"
      className="inline-flex items-center gap-0.5 cursor-pointer font-semibold text-foreground-1 dark:text-foreground-1 hover:text-primary dark:hover:text-primary"
    >
      {children}
      <ArrowUpRight
        className="h-4 w-4 text-primary"
        aria-hidden="true"
      />
    </span>
  );

  return (
    <div id="industry" ref={sectionRef} className="space-y-6 scroll-mt-24">
      <SectionDivider
        title={t("industry.title")}
        className="uppercase tracking-wider text-foreground-2"
      />

      <div className="group relative rounded-2xl p-4 border transition-all duration-300 bg-white dark:bg-surface border-border flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-medium text-foreground-1">
            {t("industry.primaryIndustry.label")}
          </h3>
          <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
            <Trans
              t={t}
              i18nKey="industry.primaryIndustry.description"
              components={{
                settingsLink: <SettingsLink />,
              }}
            />
          </p>
        </div>

        {businessIndustry && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface border border-border w-fit shadow-sm">
            <BadgeCheck className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold text-foreground-1 capitalize">
              {tIndustry(businessIndustry.slug ?? "", businessIndustry.name)}
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-border space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-medium text-foreground-1">
              {t("industry.tags.label")}
            </h3>
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed">
              {t("industry.tags.description")}
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
                  <span className="text-sm font-medium">{tIndustry(`tags.${tag.slug ?? ""}`, tag.name)}</span>
                </Pill>
              );
            })}
          </div>

          {selectedTags.length === 0 && (
            <div className="flex items-start gap-2 pt-1">
              <AttentionDot className="mt-1.5" />
              <p className="text-xs text-foreground-3 dark:text-foreground-2 leading-relaxed">
                {t("industry.tags.addAtLeastOne")}
              </p>
            </div>
          )}

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

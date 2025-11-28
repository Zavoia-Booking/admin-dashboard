"use client";

import { Tag } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PromotionsTab() {
  const { t } = useTranslation("services");

  return (
    <div className="space-y-6">
      {/* Placeholder for Promotions */}
      <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-12 text-center">
        <div className="mx-auto h-16 w-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
          <Tag className="h-8 w-8 text-foreground-3 dark:text-foreground-2" />
        </div>
        <h3 className="text-lg font-semibold text-foreground-1 mb-2">
          {t("promotions.comingSoon")}
        </h3>
        <p className="text-sm text-foreground-3 dark:text-foreground-2 max-w-md mx-auto">
          {t("promotions.description")}
        </p>
      </div>
    </div>
  );
}


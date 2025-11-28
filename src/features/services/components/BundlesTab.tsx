"use client";

import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BundlesTab() {
  const { t } = useTranslation("services");

  return (
    <div className="space-y-6">
      {/* Placeholder for Bundles */}
      <div className="rounded-lg border border-border bg-surface dark:bg-neutral-900 p-12 text-center">
        <div className="mx-auto h-16 w-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-foreground-3 dark:text-foreground-2" />
        </div>
        <h3 className="text-lg font-semibold text-foreground-1 mb-2">
          {t("bundles.comingSoon")}
        </h3>
        <p className="text-sm text-foreground-3 dark:text-foreground-2 max-w-md mx-auto">
          {t("bundles.description")}
        </p>
      </div>
    </div>
  );
}


"use client";

import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Briefcase, Package, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { ResponsiveTabs, type ResponsiveTabItem } from "../../../shared/components/ui/responsive-tabs";
import { ServicesListTab } from "../components/services/ServicesListTab.tsx";
import { BundlesTab } from "../components/bundles/BundlesTab.tsx";
import { PromotionsTab } from "../components/PromotionsTab";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate.tsx";
import { AccessGuard } from "../../../shared/components/guards/AccessGuard.tsx";

type ServicesTab = "services" | "bundles" | "promotions";

export default function ServicesPage() {
  const { t } = useTranslation("services");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get initial tab from URL or default to 'services'
  const getInitialTab = (): ServicesTab => {
    const tab = searchParams.get("tab") as ServicesTab | null;
    if (tab && (tab === "services" || tab === "bundles" || tab === "promotions")) {
      return tab;
    }
    return "services";
  };

  const [activeTab, setActiveTab] = React.useState<ServicesTab>(getInitialTab());

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab") as ServicesTab | null;
    if (tab && (tab === "services" || tab === "bundles" || tab === "promotions")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    const tab = tabId as ServicesTab;
    setActiveTab(tab);
    // Use replace so tab switches don't pollute browser history
    navigate(`/services?tab=${tab}`, { replace: true });
  };

  const tabItems: ResponsiveTabItem[] = [
    {
      id: "services",
      label: t("page.tabs.allServices"),
      icon: Briefcase,
      content: <ServicesListTab />,
    },
    {
      id: "bundles",
      label: t("page.tabs.bundles"),
      icon: Package,
      content: <BundlesTab />,
    },
    {
      id: "promotions",
      label: t("page.tabs.promotions"),
      icon: Tag,
      content: <PromotionsTab />,
    },
  ];

  return (
    <AppLayout>
      <BusinessSetupGate>
        <AccessGuard>
          <div className="space-y-6">
            {/* Responsive Tabs */}
            <ResponsiveTabs
              items={tabItems}
              value={activeTab}
              onValueChange={handleTabChange}
            />
          </div>
        </AccessGuard>
      </BusinessSetupGate>
    </AppLayout>
  );
}

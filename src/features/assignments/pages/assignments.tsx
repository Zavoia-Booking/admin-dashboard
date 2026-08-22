import { useTranslation } from "react-i18next";
import { AppLayout } from "../../../shared/components/layouts/app-layout";
import { LocationAssignmentsView } from "../components/LocationAssignmentsView";
import BusinessSetupGate from "../../../shared/components/guards/BusinessSetupGate";

export default function AssignmentsPage() {
  const { t } = useTranslation("assignments");

  return (
    <AppLayout>
      <BusinessSetupGate>
        <div className="space-y-6">
          <div className="mb-4 w-full border-b border-border-strong hidden md:block">
            <h1 className="px-4 pb-3 text-sm font-medium text-foreground md:text-2xl">
              {t("page.title")}
            </h1>
          </div>
          <LocationAssignmentsView />
        </div>
      </BusinessSetupGate>
    </AppLayout>
  );
}

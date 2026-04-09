import { useTranslation } from "react-i18next";
import { User, X } from "lucide-react";
import type { Customer } from "../../../shared/types/customer.ts";
import { Button } from "../../../shared/components/ui/button.tsx";
import { CustomerSearchPopover } from "./CustomerSearchPopover.tsx";

type CustomerSearchResult = Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone">;

type CustomerFilterPickerProps = {
  selectedCustomer: CustomerSearchResult | null;
  onSelectCustomer: (customer: CustomerSearchResult) => void;
  onClearCustomer: () => void;
};

export const CustomerFilterPicker = ({
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
}: CustomerFilterPickerProps) => {
  const { t } = useTranslation("calendar");
  return (
    <div className="space-y-2">
      <CustomerSearchPopover onSelectCustomer={onSelectCustomer} />

      {selectedCustomer ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
          <div className="min-w-0 flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {`${selectedCustomer.firstName ?? ""} ${selectedCustomer.lastName ?? ""}`.trim() || t("page.common.unnamedCustomer")}
              </div>
              {(selectedCustomer.email || selectedCustomer.phone) ? (
                <div className="text-[11px] text-muted-foreground truncate">
                  {selectedCustomer.email || selectedCustomer.phone}
                </div>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={onClearCustomer}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { Customer } from "../../../shared/types/customer.ts";
import { Button } from "../../../shared/components/ui/button.tsx";
import { CustomerSearchPopover } from "./CustomerSearchPopover.tsx";
import { Avatar, AvatarFallback } from "../../../shared/components/ui/avatar.tsx";
import { getCustomerInitials } from "./addAppointmentSliderHelpers.ts";
import { getAvatarBgColor } from "../../setupWizard/components/StepTeam.tsx";

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

  const avatarColorKey = selectedCustomer
    ? (selectedCustomer.email?.trim() ||
      `${selectedCustomer.firstName ?? ""}-${selectedCustomer.lastName ?? ""}-${selectedCustomer.phone ?? ""}-${selectedCustomer.id}`)
    : "";

  return (
    <div className="space-y-2">
      <CustomerSearchPopover onSelectCustomer={onSelectCustomer} />

      {selectedCustomer ? (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback
              className="text-sm font-medium"
              style={{ backgroundColor: getAvatarBgColor(avatarColorKey) }}
            >
              {getCustomerInitials(
                {
                  firstName: selectedCustomer.firstName,
                  lastName: selectedCustomer.lastName,
                  email: selectedCustomer.email,
                  phone: selectedCustomer.phone,
                },
                "C",
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {`${selectedCustomer.firstName ?? ""} ${selectedCustomer.lastName ?? ""}`.trim() || t("page.common.unnamedCustomer")}
            </div>
            {(selectedCustomer.email || selectedCustomer.phone) ? (
              <div className="text-xs text-muted-foreground truncate">
                {selectedCustomer.email || selectedCustomer.phone}
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 shrink-0"
            onClick={onClearCustomer}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

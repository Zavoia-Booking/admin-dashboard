import { type FC, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { SearchInput } from "../../../shared/components/common/SearchInput";

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

export const CustomerFilters: FC<CustomerFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onAddClick,
}) => {
  const text = useTranslation("customers").t;
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Keep local search in sync with parent
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <SearchInput
          className="flex-1"
          placeholder={text("filters.searchPlaceholder")}
          value={localSearchTerm}
          onChange={(value) => {
            setLocalSearchTerm(value);
          }}
          onDebouncedChange={(value) => {
            onSearchChange(value);
          }}
        />
        <Button
          type="button"
          size="sm"
          rounded="full"
          className="h-9 !px-4 md:h-11 md:px-5 md:!min-w-52 md:px-6 font-semibold group active:scale-95 transition-transform shrink-0"
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4 md:h-5 md:w-5" />
          <span className="">{text("page.actions.addCustomer")}</span>
        </Button>
      </div>
    </div>
  );
};


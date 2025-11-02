import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import { selectBusinessAction, dismissBusinessSelectorModal } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { Button } from "../../../shared/components/ui/button";
import { Building2, ChevronRight } from "lucide-react";
import { Spinner } from "../../../shared/components/ui/spinner";

export default function BusinessSelectorModal() {
  const dispatch = useDispatch();
  const businessSelection = useSelector((s: RootState) => s.auth.businessSelectionRequired);
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  const handleSelectBusiness = (businessId: number) => {
    if (!businessSelection?.selectionToken) return;
    
    setSelectedBusinessId(businessId);
    dispatch(
      selectBusinessAction.request({
        selectionToken: businessSelection.selectionToken,
        businessId,
      })
    );
  };

  const handleClose = () => {
    dispatch(dismissBusinessSelectorModal());
  };

  // Modal is open when businessSelection exists
  const isOpen = !!businessSelection;

  if (!businessSelection) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Select Your Business</DialogTitle>
          <DialogDescription>
            You have access to multiple businesses. Please select which one you'd like to access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {businessSelection.businesses.map((business) => {
            const isThisBusinessLoading = isLoading && selectedBusinessId === business.id;
            
            return (
              <Button
                key={business.id}
                variant="outline"
                className="w-full h-auto p-4 justify-between hover:bg-accent hover:border-primary transition-all"
                onClick={() => handleSelectBusiness(business.id)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{business.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {business.role}
                    </div>
                  </div>
                </div>
                {isThisBusinessLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}


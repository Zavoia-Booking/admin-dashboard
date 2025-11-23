import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export interface FormFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  formId?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  showCancel?: boolean;
  showSubmit?: boolean;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onCancel,
  onSubmit,
  cancelLabel = "Cancel",
  submitLabel = "Submit",
  formId,
  isLoading = false,
  disabled = false,
  className = "",
  showCancel = true,
  showSubmit = true,
}) => {
  return (
    <div
      className={`flex justify-between gap-2 mt-6 mb-3 md:mb-2 ${className}`}
    >
      {showCancel && (
        <Button
          type="button"
          variant="outline"
          rounded="full"
          onClick={onCancel}
          className="gap-2 h-11 cursor-pointer w-32 md:w-42"
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
      )}
      {showSubmit && (
        <Button
          type="submit"
          form={formId}
          rounded="full"
          onClick={onSubmit}
          className="group gap-2 h-11 cursor-pointer w-72"
          disabled={isLoading || disabled}
        >
          {submitLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
        </Button>
      )}
    </div>
  );
};

export default FormFooter;

import React from 'react';
import { Button } from '../ui/button';

export interface FormFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  formId?: string;
  isLoading?: boolean;
  className?: string;
  showCancel?: boolean;
  showSubmit?: boolean;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancel',
  submitLabel = 'Submit',
  formId,
  isLoading = false,
  className = '',
  showCancel = true,
  showSubmit = true,
}) => {
  return (
    <div className={`flex gap-3 p-4 border-t border-border bg-surface ${className}`}>
      {showCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11 font-medium"
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
      )}
      {showSubmit && (
        <Button
          type="submit"
          form={formId}
          onClick={onSubmit}
          className="flex-1 h-11 font-semibold"
          disabled={isLoading}
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
};

export default FormFooter;


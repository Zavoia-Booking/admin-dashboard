import { X } from "lucide-react";

interface AnnoDismissProps {
  label: string;
  onDismiss: () => void;
  sample: boolean;
}

export function AnnoDismiss({ label, onDismiss, sample }: AnnoDismissProps) {
  const icon = <X className="mc-anno-x-icon" strokeWidth={2} aria-hidden />;

  if (sample) {
    return <span className="mc-anno-x" aria-hidden>{icon}</span>;
  }

  return (
    <button type="button" className="mc-anno-x" aria-label={label} onClick={onDismiss}>
      {icon}
    </button>
  );
}

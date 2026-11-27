import { AlertCircle } from "lucide-react";

interface InlineErrorProps {
  id: string;
  message?: string;
  reserveSpace?: boolean;
}

export function InlineError({ id, message, reserveSpace = false }: InlineErrorProps) {
  if (!message && !reserveSpace) return null;

  return (
    <div className={reserveSpace ? "min-h-5" : undefined}>
      {message && (
        <p id={id} className="mt-1 flex items-center gap-1.5 text-xs text-destructive" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}

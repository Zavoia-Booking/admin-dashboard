import * as React from "react";

import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground-1 placeholder:text-foreground-3 dark:placeholder:text-foreground-2 dark:placeholder:opacity-70 border-border dark:border-border-subtle bg-surface dark:bg-neutral-900 flex h-12 md:h-10 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-foreground-1",
        "focus-visible:border-focus focus-visible:ring-focus/50 focus-visible:ring-2 focus-visible:ring-offset-0",
        "aria-invalid:ring-error/20 dark:aria-invalid:ring-error/40 aria-invalid:border-destructive aria-invalid:focus-visible:ring-0 aria-invalid:focus-visible:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };

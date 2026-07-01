import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../../../../../../../../shared/lib/utils";

/** One contact row: a full-row link with a muted icon that warms to accent on hover; the raw value stays
 *  selectable text. External (maps) links open a new tab; tel/mailto hand off in place. */
export function ContactRow({
  href,
  icon: Icon,
  label,
  external,
  alignTop,
  children,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
  alignTop?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group/c flex gap-2.5 text-[13px] transition-colors [color:var(--mc-fg)] hover:[color:var(--mc-accent)]",
        alignTop ? "items-start" : "items-center",
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors [color:var(--mc-muted)] group-hover/c:[color:var(--mc-accent)]",
          alignTop && "mt-0.5",
        )}
        strokeWidth={1.6}
        aria-hidden
      />
      <span className="min-w-0">{children}</span>
    </a>
  );
}

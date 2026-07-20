import { ArrowRight } from "lucide-react";

interface AnnoCtaProps {
  label: string;
  url: string;
  newTab: boolean;
  showArrow: boolean;
  appearance?: "bar" | "dialog";
}

/** Keeps real link semantics in the preview while preventing the builder from navigating away. */
export function AnnoCta({
  label,
  url,
  newTab,
  showArrow,
  appearance = "bar",
}: AnnoCtaProps) {
  return (
    <a
      className={appearance === "dialog" ? "mc-anno-details-action" : "mc-anno-link"}
      href={url || "#"}
      target={newTab && url ? "_blank" : undefined}
      rel={newTab && url ? "noreferrer" : undefined}
      onClick={(event) => event.preventDefault()}
    >
      {label}
      {showArrow && <ArrowRight className="mc-anno-arrow" strokeWidth={2} aria-hidden />}
    </a>
  );
}

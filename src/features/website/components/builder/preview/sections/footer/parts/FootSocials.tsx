import type { PreviewData } from "../../../shared/types";
import { socialLinks } from "./socials";

/** Owner's social links — real external anchors shared by all five footer variants. */
export function FootSocials({ social, className }: { social: PreviewData["social"]; className?: string }) {
  const items = socialLinks(social);
  if (items.length === 0) return null;
  return (
    <div className={["mc-foot-social", className].filter(Boolean).join(" ")}>
      {items.map((s) => (
        <a
          key={s.key}
          className="mc-foot-soc"
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={s.label}
          aria-label={s.label}
        >
          <s.Icon aria-hidden className="size-[17px]" strokeWidth={1.7} />
        </a>
      ))}
    </div>
  );
}

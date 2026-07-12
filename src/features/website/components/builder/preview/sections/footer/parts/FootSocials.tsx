import type { PreviewData } from "../../../shared/types";
import { socialLinks } from "./socials";

/** Owner's social links — a real interactive icon row (mirrors the source `MicroSocials`). Shared by every
 *  footer variant. */
export function FootSocials({ social }: { social: PreviewData["social"] }) {
  const items = socialLinks(social);
  if (items.length === 0) return null;
  return (
    <div className="mc-foot-social">
      {items.map((s) => (
        <a
          key={s.key}
          className="mc-foot-soc"
          href={s.url}
          target="_blank"
          rel="noreferrer"
          title={s.label}
          aria-label={s.label}
        >
          <s.Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
        </a>
      ))}
    </div>
  );
}

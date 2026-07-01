import { MONO } from "../../../shared/constants";

/** Small mono uppercase label heading a footer column. */
export function ContactLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[10.5px] uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-muted)" }}>
      {children}
    </div>
  );
}

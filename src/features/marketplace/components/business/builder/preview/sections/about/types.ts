import type { PreviewData, T } from "../../shared/types";

/** Contract the About layout variant renders against — the orchestrator owns only the <Section> wrapper. */
export type AboutVariantProps = {
  data: PreviewData;
  t: T;
  no: string;
};

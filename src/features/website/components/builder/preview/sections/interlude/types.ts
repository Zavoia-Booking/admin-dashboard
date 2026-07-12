import type { PreviewData, T } from "../../shared/types";

/** Contract the Interlude layout variant renders against — the orchestrator owns the photo guard (self-hide
 *  when the business has no portfolio images) and passes the resolved image pool down. */
export type InterludeVariantProps = {
  images: string[];
  data: PreviewData;
  t: T;
};

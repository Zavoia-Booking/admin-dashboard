import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
} from "../../../../shared/components/ui/collapsible";
import TextareaField from "../../../../shared/components/forms/fields/TextareaField";
import { AutoHeight } from "./AutoHeight";
import { InfoHint } from "./InfoHint";
import { splitAboutContent, joinAboutContent } from "./aboutContent";

const TITLE_MAX = 200;
const BODY_MAX = 1800;

interface AboutEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** True when the About section is visible on the draft preview → show a readiness hint for its headline. */
  required?: boolean;
}

/**
 * Long-form "about" content, stored as one string ("aboutContent") but edited as two fields — a bold
 * Headline (the serif lede) and the Story body — joined on a blank line via {@link joinAboutContent}.
 * Both reuse the app's shared TextareaField (label + counter + the same styling as the marketplace
 * description), so they match every other textarea in the dashboard. The headline is kept single-paragraph
 * so the split stays unambiguous. While the section is shown the headline gets a readiness InfoHint
 * above the field, mirroring the announcement CTA); the Story stays tucked away until there's a headline,
 * then reveals with the section accordion's animation.
 */
export function AboutEditor({ value, onChange, required }: AboutEditorProps) {
  const { t } = useTranslation("website");

  const { title, body } = splitAboutContent(value);
  const headlineMissing = !!required && title.trim() === "";
  // Reveal the Story once there's a headline — or already-saved body, so existing content is never hidden.
  const showStory = title.trim() !== "" || body.trim() !== "";

  // Headline is one wrapping line — collapse newlines so the blank-line split stays unambiguous.
  const setTitle = (raw: string) => onChange(joinAboutContent(raw.replace(/\s*\n\s*/g, " "), body));
  const setBody = (raw: string) => onChange(joinAboutContent(title, raw));

  return (
    <div className="space-y-2">
      <TextareaField
        id="business-page-about-title"
        label={t("businessPage.about.titleLabel")}
        placeholder={t("businessPage.about.titlePlaceholder")}
        value={title}
        onChange={setTitle}
        maxLength={TITLE_MAX}
        rows={2}
        className="!pt-0"
        helperText={headlineMissing ? undefined : t("businessPage.about.titleHelp")}
        hint={headlineMissing ? <InfoHint>{t("businessPage.about.headlineRequired")}</InfoHint> : undefined}
      />

      <Collapsible open={showStory}>
        <CollapsibleContent>
          <AutoHeight className="pt-1">
            <TextareaField
              id="business-page-about-body"
              label={t("businessPage.about.bodyLabel")}
              placeholder={t("businessPage.about.bodyPlaceholder")}
              value={body}
              onChange={setBody}
              maxLength={BODY_MAX}
              rows={6}
              className="!pt-0"
            />
          </AutoHeight>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default AboutEditor;

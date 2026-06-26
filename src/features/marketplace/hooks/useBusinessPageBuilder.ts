import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type {
  SectionEntry,
  PageTheme,
  FaqItem,
  AnnouncementContent,
  AnnouncementCta,
} from "../types";
import {
  buildInitialLayout,
  DEFAULT_FONT_KEY,
  LAYOUT_SCHEMA_VERSION,
  PINNED_TYPES,
} from "../components/business/builder/sectionCatalog";
import { validateUrlField } from "../../../shared/utils/validation";

interface UseBusinessPageBuilderProps {
  pageLayout?: SectionEntry[] | null;
  pageTheme?: PageTheme | null;
  faq?: FaqItem[] | null;
  announcement?: AnnouncementContent | null;
}

/** Fill a saved/empty announcement to the full working shape, migrating the legacy `link` and the
 *  older `cta.target` shape into the flat `cta.url` + opt-in `cta.enabled`. */
function normalizeAnnouncement(raw?: AnnouncementContent | null): AnnouncementContent {
  const legacyLink = (raw?.link ?? "").trim();
  const cta = raw?.cta as
    | (Partial<AnnouncementCta> & { target?: { type?: string; url?: string } })
    | undefined;
  const legacyTargetUrl = cta?.target?.type === "url" ? cta.target.url ?? "" : "";
  const url = cta?.url || legacyTargetUrl || legacyLink || "";
  return {
    message: raw?.message ?? { en: "", ro: "" },
    cta: {
      enabled: cta?.enabled ?? url.trim() !== "",
      label: cta?.label ?? { en: "", ro: "" },
      url,
      newTab: cta?.newTab ?? false,
      showArrow: cta?.showArrow ?? true,
    },
    schedule: raw?.schedule ?? null,
  };
}

const initialFontKey = (theme?: PageTheme | null): string =>
  theme?.fontKey || DEFAULT_FONT_KEY;

/**
 * Working state for the business-page section builder: the ordered layout, the font "personality"
 * (brand colour stays in the profile form so there is a single colour source), and the two net-new
 * content blocks (FAQ + Announcement). Mirrors `useProfileDetails`' seed-from-props + dirty-tracking
 * pattern so it rides the same Save → publish flow. Brand colour is merged into `pageTheme` at save.
 */
export function useBusinessPageBuilder({
  pageLayout,
  pageTheme,
  faq,
  announcement,
}: UseBusinessPageBuilderProps) {
  const { t } = useTranslation("marketplace");
  const [layout, setLayout] = useState<SectionEntry[]>(() =>
    buildInitialLayout(pageLayout),
  );
  const [fontKey, setFontKey] = useState<string>(() => initialFontKey(pageTheme));
  const [faqItems, setFaqItems] = useState<FaqItem[]>(() => faq ?? []);
  const [announcementContent, setAnnouncementContent] =
    useState<AnnouncementContent>(() => normalizeAnnouncement(announcement));

  // A hidden announcement never renders, so it surfaces no publish-blocking errors (and no card cue) —
  // matching the About headline gate. Both checks below short-circuit when the section is off.
  const announcementVisible = useMemo(
    () => layout.some((s) => s.type === "announcement" && s.visible),
    [layout],
  );

  // CTA URL validity — reuses the app's shared validator; surfaced to the publish gate (useMarketplaceForm)
  // so an invalid link blocks Save/Publish, like tagline/brand colour.
  const announcementUrlError = useMemo(() => {
    if (!announcementVisible) return null;
    const cta = announcementContent.cta;
    // Only gate the link when the button is actually usable: enabled AND it has text in some locale.
    // A button with text but no link would publish a dead button, so an empty URL is required here
    // (not just invalid).
    const hasLabel = cta.label.en.trim() !== "" || cta.label.ro.trim() !== "";
    if (!cta.enabled || !hasLabel) return null;
    if (cta.url.trim() === "") return t("businessPage.builder.announcement.cta.urlRequiredHint");
    return validateUrlField(cta.url, t);
  }, [announcementVisible, announcementContent.cta, t]);

  // A shown announcement with no message renders nothing on the live page (the bar self-hides when the
  // message is blank in both languages). Require a message — in either language — so the owner never
  // publishes an invisible bar.
  const announcementMessageError = useMemo(() => {
    if (!announcementVisible) return null;
    const m = announcementContent.message;
    const hasMessage = (m.en?.trim() ?? "") !== "" || (m.ro?.trim() ?? "") !== "";
    return hasMessage ? null : t("businessPage.builder.announcement.messageRequiredHint");
  }, [announcementVisible, announcementContent.message, t]);

  // Serialized snapshots of the SAVED state. Used as primitive deps so re-seeding only happens when
  // the saved content actually changes (post-publish refetch) — never on parent reference churn.
  const initialLayoutStr = useMemo(
    () => JSON.stringify(buildInitialLayout(pageLayout)),
    [pageLayout],
  );
  const initialFontKey_ = useMemo(() => initialFontKey(pageTheme), [pageTheme]);
  const initialFaqStr = useMemo(() => JSON.stringify(faq ?? []), [faq]);
  const initialAnnStr = useMemo(
    () => JSON.stringify(normalizeAnnouncement(announcement)),
    [announcement],
  );

  // Re-seed working state when the saved props change (e.g. after a publish refetch).
  useEffect(() => {
    setLayout(JSON.parse(initialLayoutStr));
    setFontKey(initialFontKey_);
    setFaqItems(JSON.parse(initialFaqStr));
    setAnnouncementContent(JSON.parse(initialAnnStr));
  }, [initialLayoutStr, initialFontKey_, initialFaqStr, initialAnnStr]);

  // ----- Layout operations -----
  const reorder = useCallback((from: number, to: number) => {
    setLayout((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
        return prev;
      }
      // Pinned sections (announcement, then hero) hold the leading slots: they can't be moved, and
      // nothing can land above them.
      let pinned = 0;
      while (pinned < prev.length && PINNED_TYPES.has(prev[pinned].type)) pinned += 1;
      if (from < pinned) return prev;
      const target = Math.max(to, pinned);
      if (from === target) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const toggleVisible = useCallback((index: number) => {
    setLayout((prev) =>
      prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)),
    );
  }, []);

  const setVariant = useCallback((index: number, variant: string) => {
    setLayout((prev) =>
      prev.map((s, i) => (i === index ? { ...s, variant } : s)),
    );
  }, []);

  const setSectionConfig = useCallback(
    (index: number, config: Record<string, unknown>) => {
      setLayout((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, config: { ...s.config, ...config } } : s,
        ),
      );
    },
    [],
  );

  // ----- Dirty tracking -----
  const isDirty = useMemo(
    () =>
      JSON.stringify(layout) !== initialLayoutStr ||
      fontKey !== initialFontKey_ ||
      JSON.stringify(faqItems) !== initialFaqStr ||
      JSON.stringify(announcementContent) !== initialAnnStr,
    [
      layout,
      fontKey,
      faqItems,
      announcementContent,
      initialLayoutStr,
      initialFontKey_,
      initialFaqStr,
      initialAnnStr,
    ],
  );

  /**
   * Assemble the builder's slice of the publish payload. Brand colour comes from the profile form
   * (single source) and is merged into `pageTheme` here so the renderer gets one theme object.
   */
  const getBuilderPayload = useCallback(
    (brandColor: string | null) => ({
      pageLayout: layout,
      pageTheme: { brandColor: brandColor || null, fontKey },
      faq: faqItems,
      announcement: announcementContent,
      layoutVersion: LAYOUT_SCHEMA_VERSION,
    }),
    [layout, fontKey, faqItems, announcementContent],
  );

  return {
    layout,
    fontKey,
    faqItems,
    announcementContent,
    announcementUrlError,
    announcementMessageError,
    isDirty,
    // operations
    reorder,
    toggleVisible,
    setVariant,
    setSectionConfig,
    setFontKey,
    setFaqItems,
    setAnnouncementContent,
    getBuilderPayload,
  };
}

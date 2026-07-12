import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type {
  WebsiteDraft,
  UpdateWebsiteDraftPayload,
  SectionEntry,
  PageTheme,
  FaqItem,
  AnnouncementContent,
  AnnouncementCta,
} from "../types";
import type { SaveWebsiteDraftRequest, PublishWebsiteRequest } from "../actions";
import {
  buildInitialLayout,
  isKnownSectionType,
  DEFAULT_FONT_KEY,
  LAYOUT_SCHEMA_VERSION,
  PINNED_TYPES,
  REQUIRED_TYPES,
  SECTION_META,
} from "../components/builder/sectionCatalog";
import { validateUrlField } from "../../../shared/utils/validation";

interface UseWebsiteDraftProps {
  /** The saved baseline from GET /website-builder (Redux). Null while loading. */
  draft: WebsiteDraft | null;
  /** The request identity returned by the reducer after a successful save. */
  lastSavedRequestId: string | null;
  onSave: (request: SaveWebsiteDraftRequest) => void;
  /** Save-then-publish entry point; optional so read-only embeds can omit it. */
  onPublish?: (request: PublishWebsiteRequest) => void;
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

const initialFontKey = (theme?: PageTheme | null): string => theme?.fontKey || DEFAULT_FONT_KEY;

interface DraftValues {
  tagline: string;
  aboutContent: string;
  brandColorHex: string;
  layout: SectionEntry[];
  fontKey: string;
  faqItems: FaqItem[];
  announcementContent: AnnouncementContent;
}

interface DraftBaseline {
  values: DraftValues;
  version: number;
  contentSignature: string;
}

function cloneValues(values: DraftValues): DraftValues {
  return {
    tagline: values.tagline,
    aboutContent: values.aboutContent,
    brandColorHex: values.brandColorHex,
    layout: JSON.parse(JSON.stringify(values.layout)),
    fontKey: values.fontKey,
    faqItems: JSON.parse(JSON.stringify(values.faqItems)),
    announcementContent: JSON.parse(JSON.stringify(values.announcementContent)),
  };
}

function serializeValues(values: DraftValues): string {
  return JSON.stringify(values);
}

function valuesFromDraft(draft: WebsiteDraft | null): DraftValues {
  return {
    tagline: draft?.tagline ?? "",
    aboutContent: draft?.aboutContent ?? "",
    brandColorHex: draft?.brandColorHex ?? "",
    layout: buildInitialLayout(draft?.pageLayout),
    fontKey: initialFontKey(draft?.pageTheme),
    faqItems: draft?.faq ?? [],
    announcementContent: normalizeAnnouncement(draft?.announcement),
  };
}

function baselineFromDraft(draft: WebsiteDraft | null): DraftBaseline {
  const values = valuesFromDraft(draft);
  return {
    values,
    version: draft?.version ?? 0,
    contentSignature: serializeValues(values),
  };
}

function createSaveRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `website-save-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Pinned lead/tail sections (announcement/nav/hero/footer) never move; targets clamp into
 * the movable band. Pure so the index-based action path and the type-keyed undo path share
 * the exact same invariants.
 */
function reorderLayout(prev: SectionEntry[], from: number, to: number): SectionEntry[] {
  if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
    return prev;
  }
  let lead = 0;
  while (lead < prev.length && PINNED_TYPES.has(prev[lead].type)) lead += 1;
  let trailing = 0;
  while (trailing < prev.length && PINNED_TYPES.has(prev[prev.length - 1 - trailing].type)) trailing += 1;
  const lastMovable = prev.length - 1 - trailing;
  if (from < lead || from > lastMovable) return prev;
  const target = Math.min(Math.max(to, lead), lastMovable);
  if (from === target) return prev;
  const next = prev.slice();
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}

/**
 * Working state for the Website draft: the ordered layout, theme (brand colour + font),
 * hero tagline, about content, and the two net-new content blocks (FAQ + Announcement) —
 * plus the versioned save lifecycle against PUT /website-builder.
 *
 * Structural errors (malformed colour, over-long tagline, invalid CTA URL) block saving —
 * the server would reject them. Missing copy (About headline, announcement message) is a
 * READINESS state: incomplete drafts save fine and readiness is surfaced per section.
 *
 * Hero mutations are immediate and advance the baseline version without touching this
 * hook's unsaved state (the reducer only moves draft.heroImageUrl/version/updatedAt;
 * the seeded content fields keep their identity, so no re-seed fires).
 */
export function useWebsiteDraft({ draft, lastSavedRequestId, onSave, onPublish }: UseWebsiteDraftProps) {
  const { t } = useTranslation("website");
  const [baseline, setBaseline] = useState<DraftBaseline>(() => baselineFromDraft(draft));
  const baselineRef = useRef<DraftBaseline>(baseline);
  const [tagline, setTagline] = useState<string>(baseline.values.tagline);
  const [aboutContent, setAboutContent] = useState<string>(baseline.values.aboutContent);
  const [brandColorHex, setBrandColorHex] = useState<string>(baseline.values.brandColorHex);
  const [layout, setLayout] = useState<SectionEntry[]>(() => cloneValues(baseline.values).layout);
  const [fontKey, setFontKey] = useState<string>(baseline.values.fontKey);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(() => cloneValues(baseline.values).faqItems);
  const [announcementContent, setAnnouncementContent] = useState<AnnouncementContent>(() =>
    cloneValues(baseline.values).announcementContent,
  );

  const workingValues = useMemo<DraftValues>(
    () => ({ tagline, aboutContent, brandColorHex, layout, fontKey, faqItems, announcementContent }),
    [tagline, aboutContent, brandColorHex, layout, fontKey, faqItems, announcementContent],
  );
  const workingSignature = useMemo(() => serializeValues(workingValues), [workingValues]);
  const pendingSaveRef = useRef<{ requestId: string; submittedSignature: string } | null>(null);
  const acceptNextServerBaselineRef = useRef(false);

  const applyWorkingValues = useCallback((values: DraftValues) => {
    const next = cloneValues(values);
    setTagline(next.tagline);
    setAboutContent(next.aboutContent);
    setBrandColorHex(next.brandColorHex);
    setLayout(next.layout);
    setFontKey(next.fontKey);
    setFaqItems(next.faqItems);
    setAnnouncementContent(next.announcementContent);
  }, []);

  const resetToBaseline = useCallback(() => {
    applyWorkingValues(baselineRef.current.values);
  }, [applyWorkingValues]);

  const serverBaseline = baselineFromDraft(draft);
  const serverSignature = `${serverBaseline.version}:${serverBaseline.contentSignature}`;
  const processedServerSignatureRef = useRef(serverSignature);

  useEffect(() => {
    if (processedServerSignatureRef.current === serverSignature) return;

    const previousBaseline = baselineRef.current;
    const pendingSave = pendingSaveRef.current;
    const serverContentChanged = previousBaseline.contentSignature !== serverBaseline.contentSignature;

    baselineRef.current = serverBaseline;
    processedServerSignatureRef.current = serverSignature;
    setBaseline(serverBaseline);

    if (pendingSave?.requestId === lastSavedRequestId) {
      pendingSaveRef.current = null;
      if (workingSignature === pendingSave.submittedSignature) {
        applyWorkingValues(serverBaseline.values);
      }
      return;
    }

    // Hero updates advance the version but leave text/layout untouched. Keep the local work in
    // place while moving the expected version forward. Explicit reloads and clean forms adopt a
    // content-changing server baseline; dirty forms never reset themselves silently.
    if (
      serverContentChanged &&
      (acceptNextServerBaselineRef.current || workingSignature === previousBaseline.contentSignature)
    ) {
      applyWorkingValues(serverBaseline.values);
    }
    acceptNextServerBaselineRef.current = false;
  }, [applyWorkingValues, lastSavedRequestId, serverBaseline, serverSignature, workingSignature]);

  // ----- Structural validation (blocks save — the server rejects these shapes) -----
  const taglineError = useMemo(
    () => (tagline.length > 200 ? t("businessPage.errors.taglineTooLong") : null),
    [tagline, t],
  );
  const brandColorError = useMemo(
    () =>
      brandColorHex && !/^#[0-9a-fA-F]{6}$/.test(brandColorHex)
        ? t("businessPage.errors.brandColorInvalid")
        : null,
    [brandColorHex, t],
  );

  const announcementVisible = useMemo(
    () => layout.some((s) => s.type === "announcement" && s.visible),
    [layout],
  );

  // CTA URL validity — structural. The server rejects ANY non-empty non-http(s) URL, even while
  // the announcement is hidden or the button is disabled/label-less (stale text still travels in
  // the payload), so the shape check never depends on those states. The "required" rule stays
  // scoped to a usable button.
  const announcementUrlError = useMemo(() => {
    const cta = announcementContent.cta;
    if (cta.url.trim() !== "") return validateUrlField(cta.url, t);
    const hasLabel = cta.label.en.trim() !== "" || cta.label.ro.trim() !== "";
    if (announcementVisible && cta.enabled && hasLabel) {
      return t("businessPage.builder.announcement.cta.urlRequiredHint");
    }
    return null;
  }, [announcementVisible, announcementContent.cta, t]);

  // Schedule order — structural (the server rejects start > end regardless of visibility).
  // Date-only YYYY-MM-DD keys compare correctly as strings, exactly as the server compares them.
  const announcementScheduleError = useMemo(() => {
    const schedule = announcementContent.schedule;
    if (!schedule?.start || !schedule?.end) return null;
    return schedule.start > schedule.end
      ? t("businessPage.builder.announcement.schedule.orderError")
      : null;
  }, [announcementContent.schedule, t]);

  // ----- Readiness (guidance only — never blocks a draft save) -----
  const announcementMessageWarning = useMemo(() => {
    if (!announcementVisible) return null;
    const m = announcementContent.message;
    const hasMessage = (m.en?.trim() ?? "") !== "" || (m.ro?.trim() ?? "") !== "";
    return hasMessage ? null : t("businessPage.builder.announcement.messageRequiredHint");
  }, [announcementVisible, announcementContent.message, t]);

  const hasBlockingErrors = !!(
    taglineError ||
    brandColorError ||
    announcementUrlError ||
    announcementScheduleError
  );

  // ----- Layout operations (pinned/required invariants match sectionCatalog) -----
  const reorder = useCallback((from: number, to: number) => {
    setLayout((prev) => reorderLayout(prev, from, to));
  }, []);

  // Type-keyed operations for undo toasts. The layout holds one entry per section type, and a
  // toast's Undo can fire long after further edits moved everything around — an index captured
  // at action time may point at a different section by then. These resolve against the CURRENT
  // layout inside the functional update instead.
  const moveSectionOfType = useCallback((type: string, to: number) => {
    setLayout((prev) => {
      const from = prev.findIndex((s) => s.type === type);
      return from < 0 ? prev : reorderLayout(prev, from, to);
    });
  }, []);

  const setSectionVisibleByType = useCallback((type: string, visible: boolean) => {
    setLayout((prev) => {
      const index = prev.findIndex((s) => s.type === type);
      if (index < 0 || REQUIRED_TYPES.has(prev[index].type)) return prev;
      if (prev[index].visible === visible) return prev;
      return prev.map((s, i) => (i === index ? { ...s, visible } : s));
    });
  }, []);

  const setSectionConfigByType = useCallback((type: string, config: Record<string, unknown>) => {
    setLayout((prev) => {
      const index = prev.findIndex((s) => s.type === type);
      if (index < 0) return prev;
      return prev.map((s, i) => (i === index ? { ...s, config: { ...s.config, ...config } } : s));
    });
  }, []);

  const toggleVisible = useCallback((index: number) => {
    setLayout((prev) => {
      if (REQUIRED_TYPES.has(prev[index]?.type)) return prev;
      return prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s));
    });
  }, []);

  const setVariant = useCallback((index: number, variant: string) => {
    setLayout((prev) => prev.map((s, i) => (i === index ? { ...s, variant } : s)));
  }, []);

  const setSectionConfig = useCallback((index: number, config: Record<string, unknown>) => {
    setLayout((prev) =>
      prev.map((s, i) => (i === index ? { ...s, config: { ...s.config, ...config } } : s)),
    );
  }, []);

  // ----- Dirty tracking -----
  const isDirty = workingSignature !== baseline.contentSignature;

  /**
   * The exact PUT /website-builder payload. Unknown stored sections are carried through
   * unchanged so an older dashboard cannot erase data created by a newer schema. Known
   * section variants still normalize to the local registry fallback when malformed.
   */
  const buildPayload = useCallback((): UpdateWebsiteDraftPayload => {
    const brandColor = brandColorHex.trim() || null;
    const announcement = normalizeAnnouncement(announcementContent);
    return {
      expectedVersion: baseline.version,
      tagline: tagline || null,
      aboutContent: aboutContent || null,
      brandColorHex: brandColor,
      pageLayout: layout.map((s) => {
        if (!isKnownSectionType(s.type)) {
          const opaqueEntry: SectionEntry = {
            type: s.type,
            variant: s.variant,
            visible: s.visible,
          };
          if (Object.prototype.hasOwnProperty.call(s, "config")) {
            opaqueEntry.config = s.config;
          }
          return opaqueEntry;
        }
        return {
          type: s.type,
          variant: SECTION_META[s.type].variants.some((v) => v.id === s.variant)
            ? s.variant
            : SECTION_META[s.type].variants[0].id,
          visible: s.visible,
          config: s.config ?? {},
        };
      }),
      pageTheme: { brandColor, fontKey },
      faq: faqItems,
      announcement,
      layoutVersion: LAYOUT_SCHEMA_VERSION,
    };
  }, [baseline.version, tagline, aboutContent, brandColorHex, layout, fontKey, faqItems, announcementContent]);

  const handleSave = useCallback(() => {
    if (hasBlockingErrors) return;
    const requestId = createSaveRequestId();
    pendingSaveRef.current = { requestId, submittedSignature: workingSignature };
    onSave({ requestId, payload: buildPayload() });
  }, [hasBlockingErrors, buildPayload, onSave, workingSignature]);

  /**
   * Save-then-publish: a dirty form ships its draft alongside the publish request (the saga
   * saves first and the pending-save reconciliation adopts the returned baseline exactly as
   * a plain save would); a clean form publishes the current baseline version directly.
   */
  const handlePublish = useCallback(() => {
    if (!onPublish || hasBlockingErrors) return;
    if (isDirty) {
      const requestId = createSaveRequestId();
      pendingSaveRef.current = { requestId, submittedSignature: workingSignature };
      onPublish({
        save: { requestId, payload: buildPayload() },
        expectedVersion: baseline.version,
      });
      return;
    }
    onPublish({ save: null, expectedVersion: baseline.version });
  }, [onPublish, hasBlockingErrors, isDirty, buildPayload, workingSignature, baseline.version]);

  const acceptNextServerBaseline = useCallback(() => {
    acceptNextServerBaselineRef.current = true;
  }, []);

  return {
    // Content state
    tagline,
    aboutContent,
    brandColorHex,
    layout,
    fontKey,
    faqItems,
    announcementContent,
    // Structural errors (block save)
    taglineError,
    brandColorError,
    announcementUrlError,
    announcementScheduleError,
    hasBlockingErrors,
    // Readiness guidance (never blocks)
    announcementMessageWarning,
    isDirty,
    // Setters + layout operations
    setTagline,
    setAboutContent,
    setBrandColorHex,
    setFontKey,
    setFaqItems,
    setAnnouncementContent,
    reorderSections: reorder,
    toggleSectionVisible: toggleVisible,
    setSectionVariant: setVariant,
    setSectionConfig,
    // Type-keyed variants for undo closures (see above)
    moveSectionOfType,
    setSectionVisibleByType,
    setSectionConfigByType,
    // Save + discard
    handleSave,
    handlePublish,
    buildPayload,
    resetToBaseline,
    acceptNextServerBaseline,
  };
}

export type WebsiteDraftForm = ReturnType<typeof useWebsiteDraft>;

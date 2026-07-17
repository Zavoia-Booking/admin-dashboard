import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type {
  WebsiteDraft,
  UpdateWebsiteDraftBody,
  SectionEntry,
  PageTheme,
  FaqItem,
  AnnouncementContent,
  WebsiteDraftSaveStatus,
  WebsiteDraftConflict,
  WebsiteSaveFailure,
  WebsiteThemeAssetCatalogItem,
  LocationWithAssignments,
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
import { BRAND_ACCENT_CATALOG } from "../components/builder/theme";
import { validateUrlField, validateWebsiteCopy } from "../../../shared/utils/validation";
import { firstFaqSaveBlockingError } from "../components/builder/faqValidation";
import { splitAboutContent } from "../components/builder/aboutContent";
import { getWebsiteReadinessIssues } from "../components/builder/sectionReadiness";
import { canonicalizeGalleryConfigForSave } from "../components/builder/gallerySelection";
import type { ReconciledCheckoutIntent } from "../checkoutIntent";

interface UseWebsiteDraftProps {
  /** The saved baseline from GET /website-builder (Redux). Null while loading. */
  draft: WebsiteDraft | null;
  /** The request identity returned by the reducer after a successful save. */
  lastSavedRequestId: string | null;
  onSave: (request: SaveWebsiteDraftRequest) => void;
  /** Save-then-publish entry point; optional so read-only embeds can omit it. */
  onPublish?: (request: PublishWebsiteRequest) => void;
  /** Current owner-scoped locations drive publish readiness and stale-reference cleanup. */
  locations: LocationWithAssignments[];
  /** Draft saving is capability-gated; read-only users keep the same local presentation. */
  saveEnabled: boolean;
  /** True only while the serialized lane is executing a draft PUT. */
  isSaving: boolean;
  /** Any active/queued Website mutation that must stay ordered with draft saves. */
  mutationBusy: boolean;
  conflict: WebsiteDraftConflict | null;
  saveFailure: WebsiteSaveFailure | null;
}

/** The builder API stores only explicit HTTP(S) URLs. Keep the forgiving input
 * experience, but never send the protocol-less value that the backend rejects. */
function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

function normalizeLocaleText(value: unknown): { en: string; ro: string } {
  const source = isPlainRecord(value) ? value : {};
  return {
    en: stringValue(source.en),
    ro: stringValue(source.ro),
  };
}

const WEBSITE_COPY_FIELDS_BY_SECTION: Record<
  string,
  ReadonlyArray<{ key: "heading" | "sublede" | "eyebrow"; maxLength: number }>
> = {
  hero: [{ key: "eyebrow", maxLength: 80 }],
  locations: [
    { key: "heading", maxLength: 80 },
    { key: "sublede", maxLength: 220 },
  ],
  team: [
    { key: "heading", maxLength: 80 },
    { key: "sublede", maxLength: 220 },
  ],
  gallery: [{ key: "heading", maxLength: 80 }],
  testimonials: [
    { key: "heading", maxLength: 80 },
    { key: "sublede", maxLength: 220 },
  ],
  faq: [{ key: "heading", maxLength: 80 }],
};

/** Fill a saved/empty announcement to the full working shape, migrating the legacy `link` and the
 *  older `cta.target` shape into the flat `cta.url` + opt-in `cta.enabled`. */
function normalizeAnnouncement(raw?: AnnouncementContent | null): AnnouncementContent {
  const source: Record<string, unknown> = isPlainRecord(raw as unknown)
    ? (raw as unknown as Record<string, unknown>)
    : {};
  const legacyLink = stringValue(source.link).trim();
  const cta = isPlainRecord(source.cta) ? source.cta : {};
  const target = isPlainRecord(cta.target) ? cta.target : {};
  const legacyTargetUrl = target.type === "url" ? stringValue(target.url) : "";
  const url = normalizeHttpUrl(stringValue(cta.url) || legacyTargetUrl || legacyLink);
  const rawSchedule = isPlainRecord(source.schedule) ? source.schedule : null;
  return {
    message: normalizeLocaleText(source.message),
    cta: {
      enabled: typeof cta.enabled === "boolean" ? cta.enabled : url !== "",
      label: normalizeLocaleText(cta.label),
      url,
      newTab: typeof cta.newTab === "boolean" ? cta.newTab : false,
      showArrow: typeof cta.showArrow === "boolean" ? cta.showArrow : true,
    },
    schedule: rawSchedule
      ? {
          start:
            typeof rawSchedule.start === "string" || rawSchedule.start === null
              ? rawSchedule.start
              : null,
          end:
            typeof rawSchedule.end === "string" || rawSchedule.end === null
              ? rawSchedule.end
              : null,
          timezone:
            typeof rawSchedule.timezone === "string" || rawSchedule.timezone === null
              ? rawSchedule.timezone
              : null,
        }
      : null,
  };
}

function normalizeFaqItems(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isPlainRecord)
    .map((item) => ({
      q: normalizeLocaleText(item.q),
      a: normalizeLocaleText(item.a),
    }));
}

const initialFontKey = (theme?: PageTheme | null): string => {
  const stored = typeof theme?.fontKey === "string" ? theme.fontKey.trim() : "";
  // Rendering safely falls back through displayFontFor, but the raw key must
  // round-trip so an older client never destroys a newer/legacy font identity.
  return stored || DEFAULT_FONT_KEY;
};

interface DraftValues {
  tagline: string;
  aboutContent: string;
  brandColorHex: string;
  brandColorKey: string;
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
    brandColorKey: values.brandColorKey,
    layout: JSON.parse(JSON.stringify(values.layout)),
    fontKey: values.fontKey,
    faqItems: JSON.parse(JSON.stringify(values.faqItems)),
    announcementContent: JSON.parse(JSON.stringify(values.announcementContent)),
  };
}

function serializeValues(values: DraftValues): string {
  return JSON.stringify(values);
}

function canonicalJson(value: unknown): string {
  const normalize = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (entry && typeof entry === "object") {
      return Object.fromEntries(
        Object.entries(entry as Record<string, unknown>)
          .filter(([, item]) => item !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, normalize(item)]),
      );
    }
    return entry;
  };
  return JSON.stringify(normalize(value));
}

function valuesFromDraft(draft: WebsiteDraft | null): DraftValues {
  return {
    tagline: draft?.tagline ?? "",
    aboutContent: draft?.aboutContent ?? "",
    brandColorHex: draft?.brandColorHex ?? "",
    brandColorKey: draft?.brandColorKey ?? draft?.pageTheme?.brandColorKey ?? "",
    layout: buildInitialLayout(draft?.pageLayout),
    fontKey: initialFontKey(draft?.pageTheme),
    faqItems: normalizeFaqItems(draft?.faq),
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

type ReconciledOwnedSelections = Pick<
  ReconciledCheckoutIntent,
  "variantSelections" | "themeSelections"
>;

/** Build the API body from an explicit immutable value set. Checkout reconciliation uses
 * this path so it can persist the exact proved purchase selection synchronously, without
 * waiting for React state setters or accidentally including a later unrelated edit. */
function draftBodyFromValues(
  values: DraftValues,
  locations: LocationWithAssignments[],
): UpdateWebsiteDraftBody {
  const brandColor = values.brandColorHex.trim() || null;
  const announcement = normalizeAnnouncement(values.announcementContent);
  const allowedLocationIdSet = new Set(locations.map((location) => location.id));

  return {
    tagline: values.tagline || null,
    aboutContent: values.aboutContent || null,
    brandColorHex: brandColor,
    brandColorKey: values.brandColorKey.trim() || null,
    pageLayout: values.layout.map((section) => {
      if (!isKnownSectionType(section.type)) {
        // Unknown entries are opaque JSON records. Never reconstruct them from the subset
        // this build understands because doing so would erase forward-compatible data.
        return JSON.parse(JSON.stringify(section)) as SectionEntry;
      }

      let config = { ...(section.config ?? {}) };
      if (section.type === "locations") {
        const hiddenIds = Array.isArray(config.hiddenLocationIds)
          ? config.hiddenLocationIds.filter(
              (id): id is number =>
                Number.isInteger(id) &&
                id > 0 &&
                allowedLocationIdSet.has(id),
            )
          : [];
        config.hiddenLocationIds = [...new Set(hiddenIds)];
      }
      if (section.type === "gallery") {
        config = canonicalizeGalleryConfigForSave(config, locations);
      }

      return {
        type: section.type,
        // Preserve future variant keys until the owner explicitly changes them.
        variant: section.variant,
        visible: section.visible,
        config,
      };
    }),
    // The catalog identity is top-level. PageThemeDto accepts presentation values only.
    pageTheme: { brandColor, fontKey: values.fontKey },
    faq: values.faqItems,
    announcement,
    layoutVersion: LAYOUT_SCHEMA_VERSION,
  };
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
 * Structural errors (malformed colour, over-long tagline, invalid CTA URL) and invalid custom
 * section copy block saving. Missing copy (About headline, announcement message) is a
 * READINESS state: incomplete drafts save fine and readiness is surfaced per section.
 *
 * Hero mutations are immediate and advance the baseline version without touching this
 * hook's unsaved state (the reducer only moves draft.heroImageUrl/version/updatedAt;
 * the seeded content fields keep their identity, so no re-seed fires).
 */
export function useWebsiteDraft({
  draft,
  lastSavedRequestId,
  onSave,
  onPublish,
  locations,
  saveEnabled,
  isSaving,
  mutationBusy,
  conflict,
  saveFailure,
}: UseWebsiteDraftProps) {
  const { t, i18n } = useTranslation("website");
  const [baseline, setBaseline] = useState<DraftBaseline>(() => baselineFromDraft(draft));
  const baselineRef = useRef<DraftBaseline>(baseline);
  const [tagline, setTagline] = useState<string>(baseline.values.tagline);
  const [aboutContent, setAboutContent] = useState<string>(baseline.values.aboutContent);
  const [brandColorHex, setBrandColorHexState] = useState<string>(baseline.values.brandColorHex);
  const [brandColorKey, setBrandColorKey] = useState<string>(baseline.values.brandColorKey);
  const [layout, setLayout] = useState<SectionEntry[]>(() => cloneValues(baseline.values).layout);
  const [fontKey, setFontKey] = useState<string>(baseline.values.fontKey);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(() => cloneValues(baseline.values).faqItems);
  const [announcementContent, setAnnouncementContent] = useState<AnnouncementContent>(() =>
    cloneValues(baseline.values).announcementContent,
  );

  const setBrandColorHex = useCallback((value: string) => {
    setBrandColorHexState(value);
    const catalogEntry = BRAND_ACCENT_CATALOG.find(
      (entry) => entry.hex.toLowerCase() === value.toLowerCase(),
    );
    setBrandColorKey(catalogEntry?.key ?? "");
  }, []);

  const workingValues = useMemo<DraftValues>(
    () => ({ tagline, aboutContent, brandColorHex, brandColorKey, layout, fontKey, faqItems, announcementContent }),
    [tagline, aboutContent, brandColorHex, brandColorKey, layout, fontKey, faqItems, announcementContent],
  );
  const workingSignature = useMemo(() => serializeValues(workingValues), [workingValues]);
  const pendingSaveRef = useRef<SaveWebsiteDraftRequest | null>(null);
  const failedSaveRef = useRef<SaveWebsiteDraftRequest | null>(null);
  // Once a PUT result is ambiguous, every later local snapshot must prove server state with
  // GET before another PUT. This deliberately survives subsequent edits/signature changes.
  const reconciliationRequiredRef = useRef(false);
  const [pendingSave, setPendingSave] = useState<SaveWebsiteDraftRequest | null>(null);
  const acceptNextServerBaselineRef = useRef(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const applyWorkingValues = useCallback((values: DraftValues) => {
    const next = cloneValues(values);
    setTagline(next.tagline);
    setAboutContent(next.aboutContent);
    setBrandColorHexState(next.brandColorHex);
    setBrandColorKey(next.brandColorKey);
    setLayout(next.layout);
    setFontKey(next.fontKey);
    setFaqItems(next.faqItems);
    setAnnouncementContent(next.announcementContent);
  }, []);

  const resetToBaseline = useCallback(() => {
    pendingSaveRef.current = null;
    failedSaveRef.current = null;
    reconciliationRequiredRef.current = false;
    acceptNextServerBaselineRef.current = false;
    setPendingSave(null);
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
      failedSaveRef.current = null;
      reconciliationRequiredRef.current = false;
      if (workingSignature === pendingSave.workingSignature) {
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

  useEffect(() => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    if (
      conflict ||
      (saveFailure && saveFailure.requestId === pending.requestId)
    ) {
      if (saveFailure?.requestId === pending.requestId) {
        if (saveFailure.kind === "cancelled") {
          failedSaveRef.current = null;
        } else {
          failedSaveRef.current = pending;
          reconciliationRequiredRef.current = true;
        }
      }
      if (conflict) reconciliationRequiredRef.current = false;
      pendingSaveRef.current = null;
    }
  }, [conflict, saveFailure]);

  // ----- Save-blocking validation (structural constraints + visitor-facing copy policy) -----
  const taglineError = useMemo(
    () => validateWebsiteCopy(tagline, t, {
      fieldLabel: t("businessPage.branding.tagline.label"),
      maxLength: 200,
    }),
    [tagline, t],
  );
  const aboutCopyError = useMemo(() => {
    const { title, body } = splitAboutContent(aboutContent);
    return validateWebsiteCopy(title, t, {
      fieldLabel: t("businessPage.about.titleLabel"),
      maxLength: 200,
    }) ?? validateWebsiteCopy(body, t, {
      fieldLabel: t("businessPage.about.bodyLabel"),
      maxLength: 1800,
    });
  }, [aboutContent, t]);
  const announcementCopyError = useMemo(() => {
    for (const locale of ["en", "ro"] as const) {
      const messageError = validateWebsiteCopy(announcementContent.message[locale], t, {
        fieldLabel: t("businessPage.builder.announcement.messageLabel"),
        maxLength: 140,
      });
      if (messageError) return messageError;

      const labelError = validateWebsiteCopy(announcementContent.cta.label[locale], t, {
        fieldLabel: t("businessPage.builder.announcement.cta.labelLabel"),
        maxLength: 40,
      });
      if (labelError) return labelError;
    }
    return null;
  }, [announcementContent.cta.label, announcementContent.message, t]);
  const sectionCopyError = useMemo(() => {
    for (const entry of layout) {
      const fields = WEBSITE_COPY_FIELDS_BY_SECTION[entry.type];
      if (!fields) continue;
      const config: Record<string, unknown> = isPlainRecord(entry.config) ? entry.config : {};

      for (const field of fields) {
        const rawCopy = config[field.key];
        const localizedCopy: Record<string, unknown> = isPlainRecord(rawCopy) ? rawCopy : {};
        const fieldLabel = field.key === "heading"
          ? t("businessPage.builder.settings.headingLabel")
          : field.key === "eyebrow"
            ? t("businessPage.builder.hero.eyebrowCopyLabel")
            : t("businessPage.builder.settings.subledeLabel");

        for (const locale of ["en", "ro"] as const) {
          const error = validateWebsiteCopy(stringValue(localizedCopy[locale]), t, {
            fieldLabel,
            maxLength: field.maxLength,
          });
          if (error) return error;
        }
      }
    }
    return null;
  }, [layout, t]);
  const faqSaveBlockingError = useMemo(
    () => firstFaqSaveBlockingError(faqItems, t),
    [faqItems, t],
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

  // CTA URL shape is structural: every non-empty value must be a valid HTTP(S) URL because it is
  // persisted regardless of visibility. A missing destination for an otherwise configured button
  // is content readiness instead, so the owner can save the draft and finish it before publishing.
  const announcementUrlError = useMemo(() => {
    const cta = announcementContent.cta;
    if (cta.url.trim() !== "") return validateUrlField(cta.url, t);
    return null;
  }, [announcementContent.cta, t]);

  // Schedule order — structural (the server rejects start > end regardless of visibility).
  // Date-only YYYY-MM-DD keys compare correctly as strings, exactly as the server compares them.
  const announcementScheduleError = useMemo(() => {
    const schedule = announcementContent.schedule;
    if (!schedule?.start || !schedule?.end) return null;
    return schedule.start > schedule.end
      ? t("businessPage.builder.announcement.schedule.orderError")
      : null;
  }, [announcementContent.schedule, t]);

  // Unknown future sections are opaque records. Their schema belongs to the newer client, so
  // requiring today's variant/visible/config shape would prevent unrelated edits from saving.
  const layoutError: string | null = null;

  // ----- Readiness (publish-only — never blocks a draft save) -----
  const announcementMessageWarning = useMemo(() => {
    if (!announcementVisible) return null;
    const m = announcementContent.message;
    const hasMessage = (m.en?.trim() ?? "") !== "" || (m.ro?.trim() ?? "") !== "";
    if (!hasMessage) return t("businessPage.builder.announcement.messageRequiredHint");
    const cta = announcementContent.cta;
    const hasLabel = cta.label.en.trim() !== "" || cta.label.ro.trim() !== "";
    return cta.enabled && hasLabel && cta.url.trim() === ""
      ? t("businessPage.builder.announcement.cta.urlRequiredHint")
      : null;
  }, [announcementContent, announcementVisible, t]);

  const hasBlockingErrors = !!(
    taglineError ||
    aboutCopyError ||
    announcementCopyError ||
    sectionCopyError ||
    faqSaveBlockingError ||
    brandColorError ||
    announcementUrlError ||
    announcementScheduleError ||
    layoutError
  );

  // Publishing has stricter content-completeness requirements than saving a draft. Keep this
  // separate from structural validation so owners can safely save incomplete work and return to it.
  const publishReadinessIssues = useMemo(
    () =>
      getWebsiteReadinessIssues({
        layout,
        aboutContent,
        announcementContent,
        faqItems,
        locations,
        locale: i18n.language?.toLowerCase().startsWith("ro") ? "ro" : "en",
      }),
    [aboutContent, announcementContent, faqItems, i18n.language, layout, locations],
  );
  const hasPublishReadinessIssues = publishReadinessIssues.length > 0;

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

  const applyThemeAssetSelection = useCallback((asset: WebsiteThemeAssetCatalogItem) => {
    if (asset.kind === "color") {
      // The server catalog is the identity authority. Do not feed this through the legacy
      // hex-only setter, which derives a key from the dashboard's static presentation registry.
      setBrandColorHexState(asset.value);
      setBrandColorKey(asset.assetKey);
      return;
    }
    setFontKey(asset.assetKey);
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
   * unchanged so an older dashboard cannot erase data created by a newer schema. Future
   * variant keys on known sections are also retained until the owner explicitly changes them.
   */
  const buildDraftBody = useCallback(
    (): UpdateWebsiteDraftBody => draftBodyFromValues(workingValues, locations),
    [locations, workingValues],
  );

  const createSaveSnapshotForValues = useCallback((values: DraftValues): SaveWebsiteDraftRequest => {
    const body = draftBodyFromValues(values, locations);
    const requestId = createSaveRequestId();
    return {
      requestId,
      workingSignature: serializeValues(values),
      bodySignature: canonicalJson(body),
      body,
      ...(reconciliationRequiredRef.current ? { reconcileFirst: true } : {}),
    };
  }, [locations]);

  const createSaveSnapshot = useCallback(
    (): SaveWebsiteDraftRequest => createSaveSnapshotForValues(workingValues),
    [createSaveSnapshotForValues, workingValues],
  );

  /**
   * Complete a verified checkout selection as a single, versioned draft transaction.
   *
   * This is intentionally not general autosave: only the variant/theme values recovered from
   * the explicit checkout intent and independently proven owned reach this method. If the owner
   * has edited anything while Stripe/webhook/catalog reconciliation was pending, the purchase is
   * merged into that working copy but nothing is submitted automatically; their Save control
   * remains the authority for those unrelated edits.
   */
  const applyOwnedCheckoutSelections = useCallback(
    (selections: ReconciledOwnedSelections) => {
      if (!saveEnabled) return null;

      const next = cloneValues(workingValues);
      const variantByType = new Map(
        selections.variantSelections.map((selection) => [
          selection.sectionType,
          selection.variantKey,
        ]),
      );
      next.layout = next.layout.map((entry) => {
        const variantKey = variantByType.get(entry.type);
        if (
          !variantKey ||
          variantKey === entry.variant ||
          !isKnownSectionType(entry.type) ||
          !SECTION_META[entry.type].variants.some((variant) => variant.id === variantKey)
        ) {
          return entry;
        }
        return { ...entry, variant: variantKey };
      });

      for (const selection of selections.themeSelections) {
        if (selection.kind === "color") {
          next.brandColorHex = selection.value;
          next.brandColorKey = selection.assetKey;
        } else {
          next.fontKey = selection.assetKey;
        }
      }

      const nextSignature = serializeValues(next);
      if (nextSignature === workingSignature) return null;

      const formWasClean = workingSignature === baselineRef.current.contentSignature;
      applyWorkingValues(next);

      if (
        !formWasClean ||
        hasBlockingErrors ||
        conflict ||
        !isOnline ||
        mutationBusy ||
        pendingSaveRef.current
      ) {
        return null;
      }

      // Dispatch from the same reconciliation turn as the local value update. The next paint
      // therefore shows a real pending save, never a misleading user-created dirty state.
      const request = createSaveSnapshotForValues(next);
      pendingSaveRef.current = request;
      setPendingSave(request);
      onSave(request);
      return request.requestId;
    },
    [
      applyWorkingValues,
      conflict,
      createSaveSnapshotForValues,
      hasBlockingErrors,
      isOnline,
      mutationBusy,
      onSave,
      saveEnabled,
      workingSignature,
      workingValues,
    ],
  );

  const submitSave = useCallback(
    (options?: { reconcileFirst?: boolean }) => {
      if (
        !saveEnabled ||
        !isDirty ||
        hasBlockingErrors ||
        conflict ||
        !isOnline ||
        mutationBusy ||
        pendingSaveRef.current
      ) {
        return false;
      }
      const failureMatchesCurrent =
        saveFailure?.kind !== "cancelled" &&
        saveFailure?.workingSignature === workingSignature;

      const request = createSaveSnapshot();
      if (options?.reconcileFirst || failureMatchesCurrent || reconciliationRequiredRef.current) {
        request.reconcileFirst = true;
      }
      pendingSaveRef.current = request;
      setPendingSave(request);
      onSave(request);
      return request.requestId;
    },
    [
      saveEnabled,
      conflict,
      createSaveSnapshot,
      hasBlockingErrors,
      isDirty,
      isOnline,
      mutationBusy,
      onSave,
      saveFailure?.kind,
      saveFailure?.workingSignature,
      workingSignature,
    ],
  );

  /** The only ordinary draft-write entry point. It is called by the visible Save control,
   * Save & leave, retry, and Ctrl/Cmd+S; local edits never submit by themselves. */
  const saveChangesWithReceipt = useCallback(() => submitSave(), [submitSave]);
  const saveChanges = useCallback(
    () => saveChangesWithReceipt() !== false,
    [saveChangesWithReceipt],
  );

  // Ctrl/Cmd+S mirrors the visible Save control and never triggers a browser-page download.
  useEffect(() => {
    const canHandleShortcut =
      saveEnabled &&
      isDirty &&
      !hasBlockingErrors &&
      !conflict &&
      isOnline &&
      !mutationBusy &&
      !pendingSaveRef.current;
    if (!canHandleShortcut || typeof window === "undefined") return;

    const handleSaveShortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.shiftKey ||
        (!event.ctrlKey && !event.metaKey) ||
        event.key.toLowerCase() !== "s"
      ) {
        return;
      }
      event.preventDefault();
      saveChanges();
    };

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [
    saveEnabled,
    conflict,
    saveChanges,
    hasBlockingErrors,
    isDirty,
    isOnline,
    mutationBusy,
  ]);

  /**
   * Called only after the user has fetched the latest server baseline and explicitly
   * confirmed replacing it. This intentionally bypasses the stale conflict flag; the
   * controller clears that flag synchronously before dispatch, and the saga injects the
   * freshly fetched Redux draft version as expectedVersion.
   */
  const replaceLatestWithLocal = useCallback(() => {
    if (!saveEnabled || !isDirty) return;
    if (
      hasBlockingErrors ||
      !isOnline ||
      mutationBusy ||
      pendingSaveRef.current
    ) {
      return;
    }
    const request = createSaveSnapshot();
    pendingSaveRef.current = request;
    setPendingSave(request);
    onSave(request);
  }, [
    saveEnabled,
    createSaveSnapshot,
    hasBlockingErrors,
    isDirty,
    isOnline,
    mutationBusy,
    onSave,
    workingSignature,
  ]);

  const currentFailure =
    saveFailure?.kind !== "cancelled" &&
    saveFailure?.workingSignature === workingSignature
      ? saveFailure
      : null;

  /**
   * Save-then-publish: a dirty form ships its draft alongside the publish request (the saga
   * saves first and the pending-save reconciliation adopts the returned baseline exactly as
   * a plain save would). Version zero may be the server's synthetic "no listing yet" draft,
   * so it also needs a normalization save before the first publish even when visually clean.
   */
  const handlePublish = useCallback(() => {
    if (
      !onPublish ||
      hasBlockingErrors ||
      hasPublishReadinessIssues ||
      !isOnline ||
      currentFailure ||
      mutationBusy ||
      pendingSaveRef.current
    ) return false;
    if (conflict) return false;
    // A synthetic version-zero draft needs the normalizing PUT only when this user may
    // edit. Publish is an independent capability: a publish-only user must never issue an
    // unauthorized draft write, so the publish endpoint receives the existing version and
    // performs its own server-side validation/normalization.
    if (isDirty || (baseline.version === 0 && saveEnabled)) {
      const request = createSaveSnapshot();
      pendingSaveRef.current = request;
      setPendingSave(request);
      onPublish({ save: request });
      return true;
    }
    onPublish({ save: null });
    return true;
  }, [
    baseline.version,
    saveEnabled,
    conflict,
    createSaveSnapshot,
    hasBlockingErrors,
    hasPublishReadinessIssues,
    isDirty,
    isOnline,
    mutationBusy,
    onPublish,
    currentFailure,
  ]);

  const effectivePending = (() => {
    const pending = pendingSave;
    if (!pending) return null;
    if (
      pending.requestId === lastSavedRequestId ||
      pending.requestId === saveFailure?.requestId ||
      conflict
    ) {
      return null;
    }
    return pending;
  })();
  const saveStatus: WebsiteDraftSaveStatus = conflict
    ? "conflict"
    : hasBlockingErrors
      ? "invalid"
      : (!isOnline && isDirty) || currentFailure?.kind === "offline"
        ? "offline"
        : currentFailure?.kind === "failed"
          ? "failed"
          : effectivePending
            ? effectivePending.workingSignature === workingSignature && isSaving
              ? "saving"
              : "queued"
            : isDirty
              ? "dirty"
              : "clean";

  const canSaveChanges =
    saveEnabled &&
    isDirty &&
    !hasBlockingErrors &&
    !conflict &&
    isOnline &&
    !mutationBusy &&
    !effectivePending;

  const retrySaveWithReceipt = useCallback(() => {
    const failed = failedSaveRef.current;
    if (!failed || failed.workingSignature !== workingSignature) return false;
    return submitSave({ reconcileFirst: true });
  }, [submitSave, workingSignature]);
  const retrySave = useCallback(
    () => retrySaveWithReceipt() !== false,
    [retrySaveWithReceipt],
  );

  const acceptNextServerBaseline = useCallback(() => {
    acceptNextServerBaselineRef.current = true;
  }, []);

  const preserveWorkingValuesOnNextServerBaseline = useCallback(() => {
    acceptNextServerBaselineRef.current = false;
  }, []);

  return {
    // Content state
    tagline,
    aboutContent,
    brandColorHex,
    brandColorKey,
    layout,
    fontKey,
    faqItems,
    announcementContent,
    // Structural errors (block save)
    taglineError,
    aboutCopyError,
    announcementCopyError,
    sectionCopyError,
    faqContentError: faqSaveBlockingError,
    brandColorError,
    announcementUrlError,
    announcementScheduleError,
    layoutError,
    hasBlockingErrors,
    publishReadinessIssues,
    hasPublishReadinessIssues,
    // Readiness guidance (blocks publish, never a draft save)
    announcementMessageWarning,
    isDirty,
    isOnline,
    saveStatus,
    canSaveChanges,
    canRetrySave: !!currentFailure,
    // Setters + layout operations
    setTagline,
    setAboutContent,
    setBrandColorHex,
    setBrandColorKey,
    setFontKey,
    setFaqItems,
    setAnnouncementContent,
    reorderSections: reorder,
    toggleSectionVisible: toggleVisible,
    setSectionVariant: setVariant,
    applyThemeAssetSelection,
    applyOwnedCheckoutSelections,
    setSectionConfig,
    // Type-keyed variants for undo closures (see above)
    moveSectionOfType,
    setSectionVisibleByType,
    setSectionConfigByType,
    // Explicit-save recovery, publish barrier + discard
    retrySave,
    retrySaveWithReceipt,
    saveChanges,
    saveChangesWithReceipt,
    replaceLatestWithLocal,
    handlePublish,
    buildDraftBody,
    resetToBaseline,
    acceptNextServerBaseline,
    preserveWorkingValuesOnNextServerBaseline,
  };
}

export type WebsiteDraftForm = ReturnType<typeof useWebsiteDraft>;

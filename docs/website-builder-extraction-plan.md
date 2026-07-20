# Website Builder Extraction and Redesign Plan

**Status:** Implementation-ready plan  
**Target dashboard route:** `/website`  
**Legacy route:** `/marketplace?tab=website` redirects to `/website`  
**Repositories reviewed:** `admin-dashboard`, `admin-api`, `admin-crm`, `zavoia-web`, `marketplace`, and `marketplace-app`

## 1. Summary

Move Website Builder out of the Marketplace configuration flow and make it a first-class owner workspace in the admin dashboard. The new page will have its own route, navigation permission, draft state, save lifecycle, responsive editing model, preview modes, catalog, cart, and checkout return flow.

Keep the existing Website data on `business_marketplace_listing` for this phase. Add dedicated Website Builder API endpoints and independent optimistic concurrency metadata so Website saves never list a business, regenerate its Marketplace slug, update Marketplace identity or tags, or trigger map synchronization.

This phase improves the dashboard authoring experience only. It does not introduce a customer-facing website route because none of the current customer applications consume the Website Builder payload or `businessSlug` today.

### Decisions locked for this phase

- Route and label: `Website` at `/website`.
- Desktop navigation: top-level left-sidebar item using the existing icon system.
- Mobile navigation: Website is available in the `More` drawer; the five-item bottom bar remains unchanged.
- Access: owners can see the route; plans without `websiteBuilder` receive a clear locked state. Editing and purchases remain Plus-only.
- Identity: inherit name, logo, contact details, description, and social data from the canonical Business profile. Do not reuse Marketplace overrides and do not add Website-specific identity overrides.
- Content: Website-owned fields remain `heroImageUrl`, `heroImageKey`, `tagline`, `aboutContent`, `brandColorHex`, `pageLayout`, `pageTheme`, `faq`, `announcement`, and `layoutVersion`.
- Save model: independent Website draft API with optimistic concurrency. Incomplete content can be saved; readiness issues are guidance, not draft-save blockers.
- Preview: dashboard-only preview in this phase, with desktop, tablet, and mobile widths.
- Content language: Website editing follows the dashboard interface language in this phase; a separate `EN | RO` authoring control is out of scope.
- Visual direction: quiet product UI with high information density, low visual variance, and purposeful motion. Preserve the dashboard's Geist typography and warm neutral/terracotta semantic palette.
- Verification: focused TypeScript, lint, build, and manual responsive checks. TypeORM migrations, unit/component/integration tests, and Playwright are out of scope.

## 2. Verified Current State

### Admin dashboard

- `/marketplace` is the only route. Website Builder is selected through `?tab=website` and uses the Marketplace profile permission.
- `ListingConfigurationView` and `useMarketplaceForm` combine Marketplace profile fields with Website content, layout, validation, dirty state, and saving.
- Website validation can therefore block Marketplace saving. The shared publish action sends the full payload to `POST /marketplace-listing/publish`.
- Marketplace publish sets `isListed`, regenerates `businessSlug`, updates industry tags, and can trigger map synchronization. Those are not valid side effects for saving a Website draft.
- The unsaved-changes guard intercepts document clicks using text and class matching. It is not route-aware and is unsafe to reuse.
- The app uses `BrowserRouter`. React Router's `useBlocker` requires a data router in the installed version.
- The default app content width is capped around 880 px on medium screens, leaving a large unused desktop area that is especially harmful to a builder.
- `SectionBuilder` is a large monolithic component. Its current nested surfaces, clipped mobile style cards, fixed cart overlay, and whole-row controls make scanning and editing harder than necessary.
- Useful foundations already exist: keyboard drag and drop, reduced-motion handling, inert scaled previews, roving radio focus, layout normalization, live section previews, and established Redux/saga/API patterns.

### Admin API and catalog

- Website content already lives on `business_marketplace_listing`; a new content table is not required for this extraction.
- `PublishMarketplaceListingDto` treats `pageLayout`, `pageTheme`, `faq`, and `announcement` as opaque JSON. There is no nested structural validation or bounded schema enforcement.
- The Website catalog and checkout live under `/website-variants`. Catalog reads are owner-scoped and checkout is Plus-gated.
- Catalog reads return active items only. A deactivated item disappears even when the business purchased it, despite ownership being intended as permanent.
- Regional pricing can contain overlapping country coverage, while resolution uses the first matching row. This makes the selected price order-dependent.
- Purchase rows are created before the Stripe session. Stripe session creation failure can leave pending rows without a session ID.
- Checkout accepts client-provided success and cancellation URLs without enforcing the dashboard origin.
- The current seed script describes 12 paid variants but inserts 16, omits free base variants, and is not represented as a normal migration.
- The existing focused Website variant service suite has five passing tests, but it does not cover catalog continuity, redirect validation, session-creation failure, regional overlap, or checkout return reconciliation.

### Customer-facing applications

- `zavoia-web` uses `/[locale]/business/[slug]`, where the slug identifies a location. Its public listing response omits all Website Builder fields.
- `zavoia-web`, `marketplace`, and `marketplace-app` do not consume `pageLayout`, `pageTheme`, FAQ, announcements, or `businessSlug`.
- The dashboard currently displays a future `/b/...` address that no reviewed customer application serves. The redesigned dashboard must not present that address as live.

## 3. Technical Direction

### Step 1: Add Website draft metadata without moving existing content

Create an idempotent, DBeaver-runnable SQL script in `admin-api` that adds the following columns to `business_marketplace_listing`:

- `websiteDraftVersion integer NOT NULL DEFAULT 0`
- `websiteUpdatedAt timestamptz NULL`

Existing Website fields and purchases remain in place. Existing rows start at version `0`; the first successful Website mutation increments the version to `1`. Marketplace publish may continue updating the row's general `updatedAt`, but it must not increment `websiteDraftVersion`.

Do not backfill or fabricate `websiteUpdatedAt`. A null timestamp means the Website draft predates independent draft tracking.

### Step 2: Introduce a dedicated owner-scoped Website Builder API

Add a `website-builder` controller/service module in `admin-api`. Reuse the existing listing repository, entitlement service, business/profile mapping, image storage helpers, location assignment reads, and review endpoints. Do not call the Marketplace publish service from Website mutations.

#### `GET /website-builder`

Return a builder view model containing:

- `identity`: the canonical Business profile fields needed by branding and preview.
- `draft`: all Website-owned fields plus `version` and `updatedAt`.
- `locations`: the existing location preview projection, including the assigned services, team, images, visibility, booking, and review summary data already required by Website sections.
- `access`: `canEdit`, `canPurchase`, and the current Website Builder entitlement reason.

If no listing row exists, return an in-memory normalized default draft with `version: 0`; do not mutate data during a GET. The first successful mutation creates the listing row with Marketplace defaults and leaves `isListed: false`.

The response must not use Marketplace overrides as Website identity. Keep the existing review-detail calls separate so the builder can load primary editing data first and review highlights afterward.

#### `PUT /website-builder`

Accept only:

```ts
type UpdateWebsiteDraftRequest = {
  expectedVersion: number;
  tagline: string | null;
  aboutContent: string | null;
  brandColorHex: string | null;
  pageLayout: SectionEntry[];
  pageTheme: PageTheme;
  faq: FaqItem[];
  announcement: AnnouncementContent | null;
  layoutVersion: number;
};
```

Use an atomic `WHERE businessId = :businessId AND websiteDraftVersion = :expectedVersion` update. Increment `websiteDraftVersion` and set `websiteUpdatedAt` only on success. Return the normalized saved draft and new version. A stale write returns `409` with the current version and updated timestamp; it never silently overwrites another tab.

This endpoint must never change `isListed`, `hiddenBySystem`, Marketplace identity fields, `businessSlug`, industry tags, location publication flags, booking settings, or map/search data.

Save incomplete but structurally valid drafts. Empty copy, sections with no data, and unowned premium selections are readiness states. Reject malformed payloads, unsafe URLs, inaccessible referenced location IDs, schema overflow, and invalid structural invariants.

#### `POST /website-builder/hero` and `DELETE /website-builder/hero`

- Keep hero upload and deletion immediate, matching the existing image interaction.
- Require `expectedVersion` for both operations and apply the same atomic version rule.
- Validate file type, size, and ownership using the existing upload helpers.
- On replacement, commit the new database reference before deleting the old object. If database persistence fails, delete the newly uploaded object. If old-object cleanup fails after commit, log it for retry without rolling back the saved draft.
- Return `heroImageUrl`, the new draft version, and `updatedAt`.

The client must preserve unsaved text/layout edits when a hero mutation advances the server version; only the saved baseline version and hero baseline are updated.

#### Nested validation and normalization

Replace opaque JSON handling for the dedicated endpoint with nested DTOs for `SectionEntry`, `PageTheme`, localized text, FAQ, CTA, and announcement schedule.

- Validate booleans, strings, locale keys, IANA timezone values, date-only schedule values, hex color, CTA URL, and known font keys.
- Reject duplicate section types and invalid variant keys. Required and pinned section invariants must match the existing `sectionCatalog` behavior.
- Validate hidden location IDs against the authenticated business.
- Apply explicit collection and string bounds based on the implemented 12-section registry and existing database column lengths.
- Normalize legacy announcement `link`/`target` shapes on read, but only write the current flat CTA shape.
- Preserve the skip-unknown read fallback so an older client does not crash on data written by a newer schema. New writes may only submit server-recognized section and variant keys.
- Keep `brandColorHex` canonical and mirror it into `pageTheme.brandColor` server-side to prevent contradictory color values.

### Step 3: Separate frontend feature state from Marketplace

Create `src/features/website` in `admin-dashboard` with its own page, types, API adapter, Redux state/actions, saga, selectors, form hook, catalog/cart state, and component tree. Move reusable Website renderer and section-editor code from `features/marketplace` without changing rendering behavior during the move.

The Website state owns:

- saved draft and editable draft
- version, saved/unsaved status, save error, and conflict state
- Website access state
- preview mode and selected section
- catalog, ownership, cart, checkout creation, and checkout reconciliation

Marketplace state continues to own Marketplace listing/profile, industries, location listing controls, images, and booking settings. Remove Website fields and validation from `useMarketplaceForm` and from the new-dashboard Marketplace publish payload.

Preserve a single normalized Website renderer used by style thumbnails, section preview, and full preview. Split the current `SectionBuilder` into section list, section row, section editor, style picker, content panels, and preview shell so each unit can be tested independently.

### Step 4: Add the route, permissions, and navigation

- Convert the root router to React Router's data-router configuration and add a lazy `/website` route.
- Add `ACCESS_WEBSITE` to the established permission map. Grant it to owners and use the existing write/access conventions inside the page.
- Add Website as a top-level desktop sidebar item using a Lucide icon already available in the project.
- Add Website to the mobile `More` drawer; do not increase the five bottom navigation destinations.
- Add English and Romanian navigation, status, error, locked-state, editor, catalog, cart, and conflict copy.
- Remove the Website tab from Marketplace, leaving Business page, Locations, and Reviews.
- Redirect `/marketplace?tab=website` to `/website` with `replace`, preserving recognized purchase return parameters. Unknown query parameters are discarded.
- Update all checkout success/cancel URLs and internal deep links to `/website`.

### Step 5: Replace brittle navigation blocking

Build a reusable route-aware unsaved-changes hook using `useBlocker` plus `beforeunload`:

- Block internal navigation only while the Website draft is dirty and not saving.
- Present `Stay` and `Discard changes` actions in the dashboard's standard confirmation dialog.
- `Stay` keeps the draft and URL unchanged. `Discard changes` resets local state to the last server baseline before continuing the blocked transition.
- A successful save automatically retries the user's intended navigation.
- Browser close/refresh uses the native `beforeunload` prompt.
- Reuse this hook in My Profile after Website behavior is proven, replacing document-level text/class interception rather than keeping two systems.

### Step 6: Harden catalog, pricing, and ownership

- Replace the ad hoc seed with an idempotent, DBeaver-runnable `admin-api` SQL seed that inserts one free base variant for every implemented section and all 16 currently implemented paid variants. Use stable UUIDs and `(sectionType, variantKey)` uniqueness.
- Keep the backend catalog as the commercial source of truth and the frontend registry as the renderer implementation map. In development and CI, assert that every active catalog key has a renderer and every purchasable renderer key has a catalog row.
- Return active catalog items plus inactive sections/variants owned by the authenticated business. Mark inactive owned entries as unavailable for new purchase but still selectable by the owner.
- Validate publish/delivery entitlement against both active offerings and permanent ownership so catalog deactivation cannot bypass ownership checks or remove purchased designs.
- Reject overlapping regional country coverage in service validation and Admin CRM before replacement. Add a database-safe transaction around item and regional-pricing updates.
- Sort price-resolution inputs deterministically as a defensive fallback, while treating any overlap as invalid configuration.

### Step 7: Harden checkout and return reconciliation

- Validate success and cancellation URLs against a configured dashboard origin allowlist. Generate the final route server-side when practical; never accept an arbitrary external redirect.
- Create purchase rows and attach the Stripe session within a transaction-compatible flow. If Stripe session creation fails, mark/delete newly created pending rows so no null-session purchase remains pending.
- Keep stale-session expiration, but also protect duplicate concurrent checkout creation with the existing unique ownership constraints plus a database-level pending-purchase strategy.
- Add owner-scoped `GET /website-variants/checkout-status/:sessionId`. Return session state and ownership only for the authenticated business.
- Return `session_id` to `/website`. The dashboard polls checkout status with bounded backoff until completion, failure, or timeout, then refetches the catalog.
- Clear purchased cart items only after the API confirms ownership. Cancellation and delayed webhooks retain the cart and show a non-destructive status.
- Clean up all timers and in-flight polling on unmount. Remove the current fixed three-second success assumption.

### Step 8: Direct cutover

Deploy in this order:

1. DBeaver database scripts, dedicated Website API, catalog compatibility, and checkout status endpoint.
2. Admin dashboard `/website` route and legacy redirect.
3. Marketplace form separation and removal of Website UI from Marketplace.
4. Catalog/pricing management hardening in Admin CRM.
5. Remove deprecated Website fields from Marketplace publish.

Legacy Website write compatibility is not required for this phase. Marketplace publish no longer accepts or persists Website draft fields; all Website mutations use the dedicated API.

## 4. Admin Dashboard Design Direction

### Design principles

- Treat Website as an editing tool, not a marketing page inside the dashboard.
- Reduce nested cards and decorative framing. Use flat, divider-based groups and reserve cards for style choices, repeated catalog items, dialogs, and the preview frame.
- Keep density high enough for repeat work while maintaining readable hierarchy and 44 px minimum touch targets on tablet/mobile.
- Use the existing semantic colors. Terracotta communicates selection and primary action; green communicates confirmed ownership/saved state; amber communicates premium/readiness attention; red is reserved for errors.
- Use motion only to explain state or spatial change. Target 150-220 ms transitions, honor reduced motion, and remove perpetual ping/pulse effects.
- Keep operational text at 12 px or larger, use zero letter-spacing changes for body/control text, and avoid oversized headings inside tool surfaces.

### Information architecture

The page has four persistent concepts:

1. **Page status:** Draft save state and last saved time.
2. **Editor:** Identity context, theme, ordered sections, and section settings.
3. **Preview:** The same renderer at desktop, tablet, or mobile width.
4. **Store:** Premium style discovery, ownership, cart, and checkout.

Do not describe the product with instructional feature copy in the UI. Use concise labels, readiness messages, inline field guidance, empty states, and direct corrective actions.

### Desktop: 1280 px and wider

- Give `/website` a centered workspace with a maximum width of 1600 px rather than inheriting the default 880 px content cap.
- Use a sticky page header containing `Website`, `Saved`/`Unsaved`, explicit content language control, Preview, cart, and Save.
- Use a 420-480 px editor rail and a flexible sticky preview canvas. The preview stays visible while editing and is not placed inside additional decorative cards.
- Put inherited Business identity in a compact read-only group with a direct `Edit business profile` link to the existing profile route.
- Present theme controls as a small control group, not a large branding card.
- Show sections as a stable ordered list with drag handle, sequence, title, data/readiness status, visibility toggle, and expand action. Avoid making an invisible full-row button overlap child controls.
- Open one section editor at a time in the editor rail. Keep style selection close to that section's content controls.
- Replace the fixed cart overlay with a header cart button and anchored popover/drawer. It must never cover section controls.

### Tablet: 768-1279 px

- Use one full-width pane with an `Editor | Preview` segmented control in the sticky page header.
- Preserve scroll position independently for Editor and Preview.
- Keep the section list and editor inline at the wider end; use a side sheet for detailed section settings when width becomes constrained.
- Preview widths remain explicit. Tablet preview uses a 768 px target scaled only when the available canvas is narrower.
- Cart opens as a right-side sheet in landscape and bottom sheet in portrait.

### Mobile: below 768 px

- Use a single-column section list beneath a compact sticky header with back/navigation context, saved status, Preview, and Save.
- Keep content clear of the existing fixed bottom navigation using safe-area-aware padding.
- Open section editing as a full-height sheet with a clear title, close control, local readiness state, content controls, and horizontally scrollable style choices that snap fully into view.
- Use one complete style card per viewport region. Do not expose a clipped fragment as the only cue that more styles exist; include scroll affordance and position dots or count.
- Full preview opens as a full-screen layer. Device controls belong in its header, and the preview is centered without large dead margins.
- Cart opens as a bottom sheet with 44 px remove controls, subtotal, ownership/error states, and one checkout action.
- Keep drag-and-drop keyboard support. On touch, also provide `Move up` and `Move down` actions in the section overflow menu so reordering does not depend on a precision gesture.

### Content language and readiness

- Website editing follows the dashboard interface language in this phase. Stored bilingual values are preserved, but a separate `EN | RO` content-language selector is out of scope.
- Readiness is section-scoped: `Ready`, `Needs content`, `No data`, `Hidden`, `Premium preview`, or `Owned`.
- Empty About, FAQ, announcement, reviews, team, or location data can be saved. Show the exact reason in the section row and provide the relevant edit/source link.
- Save communicates draft persistence only. Do not say `Publish`, `Live`, or show a fake public URL in this phase.

### Preview model

- Support Desktop (1280 px), Tablet (768 px), and Mobile (390 px) preview widths.
- Desktop defaults to side-by-side preview. Tablet/mobile default to the last selected device stored per user.
- `Current section` scrolls/focuses the active section in the same full renderer instead of creating a second rendering path.
- Preview controls remain outside the rendered website and never affect its layout measurements.
- Style thumbnails continue using real renderer output, but loading and empty states use stable aspect ratios so the layout does not jump.

### Before / After / Why

| Area | Before | After | Why |
| --- | --- | --- | --- |
| Product location | Website is a Marketplace tab | First-class `/website` workspace | Matches the user's mental model and removes unrelated save coupling |
| Desktop space | Narrow centered form with large empty side area | Wide editor rail plus persistent preview | Uses available space for comparison and iteration |
| Mobile tabs | Four compressed Marketplace pills | Website removed from Marketplace; direct More-drawer entry | Prevents label pressure and clarifies navigation |
| Editing | Long accordion with nested panels | Stable section list and one focused editor | Lowers cognitive load and keeps section context visible |
| Style browsing | Nested two-column cards; clipped mobile card | Full live cards with responsive rail/snap | Makes comparison legible and touch-friendly |
| Preview | Modal with desktop/mobile only and dead space | Persistent desktop preview; full-screen responsive preview elsewhere | Speeds iteration and adds tablet confidence |
| Cart | Fixed overlay covers builder content | Header cart plus popover/sheet | Keeps commerce accessible without obstructing editing |
| Save meaning | Website save can publish Marketplace | Versioned Website draft save only | Prevents high-impact accidental side effects |
| Identity | Mixed with Marketplace overrides and future URL | Canonical Business identity with profile link | Establishes one trustworthy source and removes false public state |
| Validation | Incomplete sections can block shared save | Structural errors block; readiness guides content completion | Lets customers save work in progress safely |

## 5. Verification Plan

### Automated checks in scope

- Admin API TypeScript compile and focused diff checks.
- Admin dashboard TypeScript compile, focused lint, and production build.
- Admin CRM focused lint and production build.
- Targeted static review of route/permission wiring, Website-vs-Marketplace payload separation, optimistic-version updates, catalog registry parity, redirect allowlisting, checkout reconciliation, and translated copy.

Unit, component, integration, accessibility-suite, and Playwright work are intentionally out of scope.

### Manual responsive review

Review real data, empty data, long Romanian copy, loading, locked, error, conflict, premium preview, owned, and cart states at:

- 1440 x 900 desktop
- 1024 x 768 small desktop/landscape tablet
- 768 x 1024 portrait tablet
- 390 x 844 mobile
- 375 x 667 compact mobile

Confirm no control overlap, clipped text, hidden save/cart actions, content behind bottom navigation, layout shift, preview dead space, or inaccessible horizontal content.

## 6. Acceptance Criteria

- Owners can navigate directly to `/website` from desktop and mobile dashboard navigation.
- `/marketplace?tab=website` resolves to `/website` without leaving a duplicate Website experience.
- Website draft saves cannot publish, unpublish, rename, retag, or remap the Marketplace listing.
- Marketplace saves are unaffected by Website validation or dirty state.
- A stale Website tab cannot overwrite a newer saved draft.
- Canonical Business identity is clearly inherited and editable only through the existing Business profile.
- Desktop, tablet, and mobile have intentionally different editing layouts with complete, non-overlapping controls.
- Incomplete work can be saved and is represented through actionable readiness states.
- Purchased styles remain usable after catalog deactivation or plan downgrade according to permanent ownership rules.
- Checkout redirects remain on an approved dashboard origin and the cart clears only after confirmed ownership.
- No customer-facing Website route or fake live URL is introduced in this phase.
- Dashboard and focused API TypeScript/lint/build checks pass, and the manual responsive review has no critical layout or accessibility defects.

## 7. Follow-On Phase, Not Included Here

Customer-facing delivery needs a separate product and architecture plan. That phase must choose the canonical public URL, expose a versioned public Website DTO, implement locale and schedule behavior, define publication/readiness rules, add caching and invalidation, and select which customer web application owns rendering. Do not infer that contract from the dashboard preview or expose draft content through the existing public Marketplace listing endpoint.

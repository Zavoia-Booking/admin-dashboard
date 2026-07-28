import { useState, Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Provider, useDispatch } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { X } from "lucide-react";
import { UserRole } from "../../shared/types/auth";

// --- The modals under audit -------------------------------------------------
import ConfirmDialog from "../../shared/components/common/ConfirmDialog";
import { DeleteConfirmDialog } from "../../shared/components/common/DeleteConfirmDialog";
import { useConfirmRadix } from "../../shared/hooks/useConfirm";
import BusinessSetupPrompt from "../../shared/components/common/BusinessSetupPrompt";
import { MapDialog } from "../../shared/components/map/MapDialog";
import { SubscriptionBlocker } from "../../shared/components/common/subscription/SubscriptionBlocker";
import { ConfirmDropDialog, RescheduleConfirmDescription } from "../calendar/components/timeGrid/ConfirmDropDialog";
import { OverrideDialog } from "../calendar/components/timeGrid/OverrideDialog";
import { AppointmentGroupDialog } from "../calendar/components/timeGrid/AppointmentGroupDialog";
import { BlockGroupDialog } from "../calendar/components/timeGrid/BlockGroupDialog";
import CustomerDetailsPopup from "../customers/components/CustomerDetailsPopup";
import type { Customer } from "../../shared/types/customer";
import LegalContentDialog from "../legal/components/LegalContentDialog";
import AccountLinkingModal from "../auth/components/AccountLinkingModal";
import AccountLinkingRequiredModal from "../auth/components/AccountLinkingRequiredModal";
import BusinessSelectorModal from "../auth/components/BusinessSelectorModal";
import { openAccountLinkingModal } from "../auth/actions";
import { LanguageSwitcher } from "../../shared/components/common/LanguageSwitcher";
import { DarkModeToggle } from "../../shared/components/common/DarkModeToggle";

// ---------------------------------------------------------------------------
// DEV-ONLY modal gallery. Route: /dev/modals
// Mounts one modal at a time with mocked props so each can be design-audited in
// isolation. A bad mock is caught by the boundary and shown as a card (that's a
// finding, not a crash). Website-builder modals are intentionally excluded.
// Redux-driven modals render inside an isolated MOCK store so the real session
// is never touched. Not linked from nav; reached by URL.
// ---------------------------------------------------------------------------

// A throwaway store that just returns a fixed state — lets store-reading modals
// render with mocked slices without affecting (or reading) the real app store.
const mockStore = (preloaded: unknown) =>
  configureStore({
    reducer: (s = preloaded) => s,
    middleware: (g) => g({ serializableCheck: false, immutableCheck: false }),
  }) as never;

const linkingRequiredStore = mockStore({
  auth: {
    accountLinkingRequired: {
      email: "andrei.sandica.94@gmail.com",
      firstName: "Andrei",
      lastName: "Sandica",
      tx_id: "gallery",
      existingRoles: { customer: true },
    },
    isLoading: false,
    error: null,
  },
});

const businessSelectorStore = mockStore({
  auth: {
    businessSelectionRequired: {
      selectionToken: "gallery-token",
      businesses: [
        { id: 1, name: "Zed Dental", role: "owner" },
        { id: 2, name: "Bright Smile Clinic", role: "team_member" },
      ],
    },
    isLoading: false,
  },
});

const blockerStore = mockStore({
  auth: {
    user: {
      id: 1,
      role: UserRole.OWNER,
      firstName: "Ted",
      lastName: "Turluianu",
      email: "ted@example.com",
      wizardCompleted: true,
      entitlements: { entitled: false },
    },
  },
});

class ModalErrorBoundary extends Component<
  { name: string; onClose: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="pointer-events-auto fixed left-1/2 top-1/2 z-[400] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-destructive/30 bg-surface p-5 shadow-2xl">
          <p className="text-sm font-semibold text-destructive">
            “{this.props.name}” threw while rendering
          </p>
          <p className="mt-2 break-words font-mono text-[12px] leading-relaxed text-foreground-3">
            {String(this.state.error?.message ?? this.state.error)}
          </p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="mt-4 rounded-full border border-border bg-surface-hover px-4 py-1.5 text-sm font-medium text-foreground-1 hover:bg-surface-active"
          >
            Close
          </button>
        </div>
      );
    }
    return this.props.children as ReactNode;
  }
}

type Entry = {
  id: string;
  name: string;
  category: string;
  file: string;
  notes?: string;
  /** Prop-controlled modal, rendered (open) while active. */
  render?: (close: () => void) => ReactNode;
  /** Imperative open (e.g. hook/redux-flag-driven); no active-mount needed. */
  onOpen?: () => void;
};

/** Centered card used to host trigger-based components (their own button opens the modal). */
function TriggerCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fixed left-1/2 top-1/2 z-[350] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 shadow-2xl">
      <p className="text-sm text-foreground-3">{label}</p>
      {children}
    </div>
  );
}

const mockCustomer: Customer = {
  id: 1,
  email: "ana.popescu@example.com",
  firstName: "Ana",
  lastName: "Popescu",
  phone: "+40 723 456 789",
  profileImage: null,
  source: "marketplace",
  status: "active",
  conflictStatus: "none",
  hasConflict: false,
  duplicateOfId: null,
  notes: "Prefers afternoon appointments. Allergic to certain hair products.",
  createdAt: "2025-11-03T10:00:00.000Z",
  linkedUser: null,
  mergedIntoCustomerId: null,
  mergedAt: null,
  mergedByUserId: null,
  recentActivity: [
    { type: "appointment", label: "Premium Haircut", status: "completed", date: "2026-06-14T09:30:00.000Z" },
    { type: "milestone", label: "Joined via marketplace", status: null, date: "2025-11-03T10:00:00.000Z" },
  ],
};

/** Standalone modals that exist but can't be hosted here — inline in data-bound
 *  pages (local-state-toggled JSX) or gated behind live fetch/payment flows.
 *  Listed so the gallery is honest about what it does NOT cover. */
const notIsolatable: { name: string; file: string; why: string }[] = [
  {
    name: "SeatOverflowGate",
    file: "features/teamMembers/components/SeatOverflowGate.tsx",
    why: "App-level blocking gate driven by the seat-overflow Redux slice + live billing/payment fetches.",
  },
  {
    name: "AdvancedSettings — delete account / instructions / blocker",
    file: "features/settings/components/AdvancedSettings.tsx",
    why: "3 AlertDialogs inline in the settings section, toggled by local state.",
  },
  {
    name: "BillingAndSubscriptionV2 — see all plans",
    file: "features/settings/components/BillingAndSubscriptionV2.tsx",
    why: "Dialog/Drawer inline in a 3k-line data-bound billing screen.",
  },
  {
    name: "GoogleAccountManager — unlink Google",
    file: "features/settings/components/GoogleAccountManager.tsx",
    why: "Unlink Dialog inline in the settings section.",
  },
  {
    name: "MyAccountContent — leave org / delete / active appointments",
    file: "features/team-member-pages/myAccount/components/MyAccountContent.tsx",
    why: "4 AlertDialogs inline in the account screen.",
  },
  {
    name: "team-members — remove member",
    file: "features/teamMembers/pages/team-members.tsx",
    why: "Confirm Dialog inline in the page.",
  },
  {
    name: "support — contact dialog",
    file: "features/support/pages/support.tsx",
    why: "Dialog inline in the support page.",
  },
  {
    name: "EditWorkingHoursSlider / InviteTeamMemberSlider — unsaved confirm",
    file: "features/locations · features/teamMembers",
    why: "AlertDialog nested inside a slide-in slider.",
  },
  {
    name: "BlockSummaryPopoverPanel",
    file: "features/calendar/components/BlockSummaryPopoverPanel.tsx",
    why: "Non-modal hover popover (modal={false}), not a dialog.",
  },
];

export default function ModalGalleryPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const close = () => {
    setActiveId(null);
    // Force-unmounting a Radix modal can leave <body> at pointer-events:none — clear it
    // so the page (and the next modal) stays interactive.
    document.body.style.pointerEvents = "";
  };
  const dispatch = useDispatch();
  // Real app copy (via i18n) so every demo mirrors what users actually see and
  // switches with the language toggle — never hardcoded gallery strings.
  const { t } = useTranslation();

  // Billing-style confirm (imperative hook API).
  const { ConfirmDialog: RadixConfirm, confirm } = useConfirmRadix();

  const entries: Entry[] = [
    // --- Confirmations (dashboard) -----------------------------------------
    {
      id: "confirm-default",
      name: "ConfirmDialog — default",
      category: "Confirmations",
      file: "shared/components/common/ConfirmDialog.tsx",
      notes: "Neutral confirm. Terracotta primary pill.",
      render: (c) => (
        <ConfirmDialog
          open
          onConfirm={c}
          onCancel={c}
          onOpenChange={(o) => !o && c()}
          title={t("website:page.discardConfirm.title")}
          description={t("website:page.discardConfirm.description")}
          confirmTitle={t("website:page.discardConfirm.confirm")}
          cancelTitle={t("website:page.discardConfirm.cancel")}
        />
      ),
    },
    {
      id: "confirm-destructive",
      name: "ConfirmDialog — destructive + close",
      category: "Confirmations",
      file: "shared/components/common/ConfirmDialog.tsx",
      notes: "Destructive (red) confirm with an X close button.",
      render: (c) => (
        <ConfirmDialog
          open
          onConfirm={c}
          onCancel={c}
          onOpenChange={(o) => !o && c()}
          title={t("marketplace:configuration.unsavedChanges.title")}
          description={t("marketplace:configuration.unsavedChanges.description")}
          confirmTitle={t("marketplace:configuration.unsavedChanges.leave")}
          cancelTitle={t("marketplace:configuration.unsavedChanges.cancel")}
          variant="destructive"
          showCloseButton
        />
      ),
    },
    {
      id: "delete-can",
      name: "DeleteConfirmDialog — can delete",
      category: "Confirmations",
      file: "shared/components/common/DeleteConfirmDialog.tsx",
      notes: "Warning icon + red destructive Delete button.",
      render: (c) => (
        <DeleteConfirmDialog
          open
          onOpenChange={(o) => !o && c()}
          resourceType="service"
          resourceName="Premium Haircut"
          deleteResponse={{ canDelete: true, message: "" } as never}
          onConfirm={c}
        />
      ),
    },
    {
      id: "delete-blocked",
      name: "DeleteConfirmDialog — blocked",
      category: "Confirmations",
      file: "shared/components/common/DeleteConfirmDialog.tsx",
      notes: "Bespoke blocked state: dependency badges + list. Its own design system.",
      render: (c) => (
        <DeleteConfirmDialog
          open
          onOpenChange={(o) => !o && c()}
          resourceType="service"
          resourceName="Premium Haircut"
          deleteResponse={
            { canDelete: false, message: "", appointmentsCount: 12, teamMembersCount: 2 } as never
          }
          onConfirm={c}
        />
      ),
    },
    {
      id: "delete-loading",
      name: "DeleteConfirmDialog — checking (null)",
      category: "Confirmations",
      file: "shared/components/common/DeleteConfirmDialog.tsx",
      notes: "deleteResponse={null} → 'Checking dependencies' loader. No real flow opens this way.",
      render: (c) => (
        <DeleteConfirmDialog
          open
          onOpenChange={(o) => !o && c()}
          resourceType="service"
          resourceName="Premium Haircut"
          deleteResponse={null}
          onConfirm={c}
        />
      ),
    },
    {
      id: "confirm-radix",
      name: "useConfirmRadix (billing-style)",
      category: "Confirmations",
      file: "shared/hooks/useConfirm.tsx",
      notes: "Eyebrow-led modal-tokens confirm. Used by Billing.",
      onOpen: () => {
        void confirm({
          eyebrow: t("settings:billing.confirm.seatChangeEyebrow"),
          title: t("settings:billing.confirm.confirmSeatIncrease", { count: 1 }),
          content: t("settings:billing.confirm.addingSeatsContent", { count: 1, amount: "25.77", currency: "lei" }),
          confirmationText: t("settings:billing.confirm.payAmount", { amount: "25.77", currency: "lei" }),
          cancellationText: t("settings:billing.confirm.cancel"),
        });
      },
    },

    // --- Calendar -----------------------------------------------------------
    {
      id: "confirm-drop",
      name: "ConfirmDropDialog",
      category: "Calendar",
      file: "features/calendar/components/timeGrid/ConfirmDropDialog.tsx",
      render: (c) => (
        <ConfirmDropDialog
          open
          onOpenChange={(o) => !o && c()}
          onConfirm={c}
          onCancel={c}
          description={(
            <RescheduleConfirmDescription
              name="Premium Haircut"
              customerName="Alex Popescu"
              sourceScheduledAt="2026-07-20T06:30:00.000Z"
              targetDateKey="2026-07-21"
              targetHour={10}
              targetMinute={30}
              timezone="Europe/Bucharest"
            />
          )}
        />
      ),
    },
    {
      id: "override-hours",
      name: "OverrideDialog — out of hours",
      category: "Calendar",
      file: "features/calendar/components/timeGrid/OverrideDialog.tsx",
      render: (c) => (
        <OverrideDialog
          open
          onOpenChange={(o) => !o && c()}
          isConflictOverride={false}
          onConfirm={c}
          onCancel={c}
          reasonText={reason}
          onReasonChange={setReason}
          inputId="gallery-override-hours"
        />
      ),
    },
    {
      id: "override-conflict",
      name: "OverrideDialog — conflict",
      category: "Calendar",
      file: "features/calendar/components/timeGrid/OverrideDialog.tsx",
      render: (c) => (
        <OverrideDialog
          open
          onOpenChange={(o) => !o && c()}
          isConflictOverride
          onConfirm={c}
          onCancel={c}
          reasonText={reason}
          onReasonChange={setReason}
          inputId="gallery-override-conflict"
        />
      ),
    },
    {
      id: "appointment-group",
      name: "AppointmentGroupDialog",
      category: "Calendar",
      file: "features/calendar/components/timeGrid/AppointmentGroupDialog.tsx",
      notes: "Mock appointments — nested fields are best-effort.",
      render: (c) => (
        <AppointmentGroupDialog
          externalOpen
          onExternalClose={c}
          timeRangeStr="10:00 – 11:00"
          day={new Date(2026, 6, 21)}
          calendarViewMode={"day" as never}
          locationStaff={[] as never}
          appointments={
            [
              {
                id: 1,
                clientName: "Ana Popescu",
                serviceName: "Premium Haircut",
                staffName: "Maria",
                startTime: "10:00",
                endTime: "10:45",
                status: "confirmed",
              },
            ] as never
          }
        />
      ),
    },
    {
      id: "block-group",
      name: "BlockGroupDialog",
      category: "Calendar",
      file: "features/calendar/components/timeGrid/BlockGroupDialog.tsx",
      notes: "Trigger-based — click the chip to open.",
      render: () => (
        <TriggerCard label="Click the block chip to open the group dialog">
          <BlockGroupDialog
            timeRangeStr="12:00 – 13:00"
            locationStaff={[] as never}
            blocks={
              [
                { id: 1, reason: "Lunch break", startTime: "12:00", endTime: "13:00" },
              ] as never
            }
          >
            <button
              type="button"
              className="rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium"
            >
              12:00 – 13:00 · 1 block
            </button>
          </BlockGroupDialog>
        </TriggerCard>
      ),
    },

    // --- Auth ---------------------------------------------------------------
    {
      id: "account-linking",
      name: "AccountLinkingModal",
      category: "Auth",
      file: "features/auth/components/AccountLinkingModal.tsx",
      notes: "Opens via a real (side-effect-free) store flag. Close with its own Cancel.",
      onOpen: () => dispatch(openAccountLinkingModal({ txId: "gallery" })),
    },
    {
      id: "account-linking-required",
      name: "AccountLinkingRequiredModal",
      category: "Auth",
      file: "features/auth/components/AccountLinkingRequiredModal.tsx",
      notes: "Isolated mock store. Close with the gallery button (self-close is a no-op here).",
      render: () => (
        <Provider store={linkingRequiredStore}>
          <AccountLinkingRequiredModal />
        </Provider>
      ),
    },
    {
      id: "business-selector",
      name: "BusinessSelectorModal",
      category: "Auth",
      file: "features/auth/components/BusinessSelectorModal.tsx",
      notes: "Isolated mock store (2 businesses). Close with the gallery button.",
      render: () => (
        <Provider store={businessSelectorStore}>
          <BusinessSelectorModal />
        </Provider>
      ),
    },

    // --- Customers ----------------------------------------------------------
    {
      id: "customer-details",
      name: "CustomerDetailsPopup",
      category: "Customers",
      file: "features/customers/components/CustomerDetailsPopup.tsx",
      notes: "Full customer detail modal (also hosts a nested merge-confirm AlertDialog).",
      render: (c) => (
        <CustomerDetailsPopup
          isOpen
          onClose={c}
          customer={mockCustomer}
          isLoading={false}
          onEdit={() => {}}
          onViewHistory={() => {}}
          onMerge={() => {}}
        />
      ),
    },

    // --- System / misc ------------------------------------------------------
    {
      id: "legal",
      name: "LegalContentDialog",
      category: "System",
      file: "features/legal/components/LegalContentDialog.tsx",
      render: (c) => (
        <LegalContentDialog type="terms" onOpenChange={(o) => !o && c()} />
      ),
    },
    {
      id: "business-setup",
      name: "BusinessSetupPrompt",
      category: "System",
      file: "shared/components/common/BusinessSetupPrompt.tsx",
      render: () => <BusinessSetupPrompt />,
    },
    {
      id: "subscription-blocker",
      name: "SubscriptionBlocker",
      category: "System",
      file: "shared/components/common/subscription/SubscriptionBlocker.tsx",
      notes: "App-level hard gate. Isolated mock store (non-entitled owner). Its CTAs navigate for real.",
      render: () => (
        <Provider store={blockerStore}>
          <SubscriptionBlocker />
        </Provider>
      ),
    },
    {
      id: "map",
      name: "MapDialog",
      category: "System",
      file: "shared/components/map/MapDialog.tsx",
      notes: "Needs a Mapbox token — map tiles may be blank without one.",
      render: (c) => (
        <MapDialog
          accessToken=""
          isOpen
          onClose={c}
          title={t("locations:addLocation.mapDialog.title")}
          description={t("locations:addLocation.mapDialog.description")}
          center={[26.1025, 44.4268]}
          zoom={12}
        />
      ),
    },
  ];

  const categories = [...new Set(entries.map((e) => e.category))];
  const active = entries.find((e) => e.id === activeId);

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8 dark:bg-background sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700 dark:text-primary-500">
              Dev · design audit
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground-1">
              Modal gallery
            </h1>
            <p className="mt-1.5 text-sm text-foreground-3">
              {entries.length} standalone modal components · click one to open it with mock data.
              Slide-in sheets &amp; drawers and website-builder modals are excluded on purpose;
              page-embedded dialogs that can&rsquo;t render in isolation are listed at the bottom.
            </p>
          </div>
          {/* Preview controls — flip language / theme to audit every modal in both. */}
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher variant="floating" />
            <DarkModeToggle variant="floating" />
          </div>
        </header>

        {categories.map((cat) => (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground-3">
              {cat}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entries
                .filter((e) => e.category === cat)
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => (e.onOpen ? e.onOpen() : setActiveId(e.id))}
                    className="group flex flex-col rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40 hover:bg-surface-hover"
                  >
                    <span className="text-sm font-semibold text-foreground-1">
                      {e.name}
                    </span>
                    {e.notes && (
                      <span className="mt-1 text-[12px] leading-snug text-foreground-3">
                        {e.notes}
                      </span>
                    )}
                    <span className="mt-2 truncate font-mono text-[10px] text-foreground-3/70">
                      {e.file}
                    </span>
                  </button>
                ))}
            </div>
          </section>
        ))}

        {/* Coverage note — modals that exist but can't be hosted in isolation. */}
        <section className="mt-2 rounded-xl border border-dashed border-border bg-surface/50 p-5">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground-3">
            Not shown here · {notIsolatable.length}
          </h2>
          <p className="mt-1.5 text-[12px] leading-snug text-foreground-3">
            These are real modals, but each is inline JSX inside a data-bound page (toggled by
            local state) or gated behind a live fetch/payment flow — so it can&rsquo;t be imported
            and rendered on its own without mounting its whole parent.
          </p>
          <ul className="mt-3 space-y-2">
            {notIsolatable.map((m) => (
              <li key={m.file} className="border-l-2 border-border pl-3">
                <p className="text-[13px] font-medium text-foreground-1">{m.name}</p>
                <p className="text-[12px] leading-snug text-foreground-3">{m.why}</p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-foreground-3/70">{m.file}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Imperative modals render themselves (hook + real-store flag). */}
      <RadixConfirm />
      <AccountLinkingModal />

      {/* Active prop-controlled modal. */}
      {active?.render && (
        <ModalErrorBoundary key={active.id} name={active.name} onClose={close}>
          {active.render(close)}
        </ModalErrorBoundary>
      )}

      {/* Safety hatch — always closes the active modal. */}
      {active && (
        <button
          type="button"
          onClick={close}
          className="pointer-events-auto fixed bottom-5 right-5 z-[600] inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      )}
    </div>
  );
}

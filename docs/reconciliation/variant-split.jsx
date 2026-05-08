// Split View — wrapped in a modal shell over a dimmed Billing & Subscription
// page. Master/detail interior with eligibility-aware bulk actions and a
// reschedule drawer (Edit Appointment) opened per-row or as a queue.

(function () {
  const { useState, useMemo } = React;
  const { Icons, Avatar, Status, Popover, MenuItem, MemberRow, SeatBar } = window.ZVUI;
  const { useDecisions, ApptsList } = window.ZVAppts;
  const { EditAppointmentDrawer } = window.ZVDrawer;

  // Faked Billing page behind the modal — just enough texture to suggest
  // "this opened on top of where I was".
  function BillingBackdrop({ lang }) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: '#F0EEE4',
        padding: 24, overflow: 'hidden',
        filter: 'blur(0.5px)',
      }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--color-neutral-200)', paddingBottom: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--color-neutral-500)' }}>{lang === 'ro' ? 'Profil' : 'Profile'}</span>
          <span style={{ fontSize: 14, fontWeight: 600, position: 'relative' }}>
            {lang === 'ro' ? 'Facturare & Abonament' : 'Billing & Subscription'}
            <span style={{ position: 'absolute', left: 0, right: 0, bottom: -11, height: 2, background: 'var(--accent)' }}/>
          </span>
        </div>
        {/* Plan card */}
        <div className="zv-card" style={{ padding: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-primary-100)',
                          color: 'var(--color-primary-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {Icons.crown}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 15 }}>Pro plan</strong>
              <Status kind="completed">Active</Status>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-neutral-600)', marginTop: 2 }}>
              {lang === 'ro' ? 'Se re\u00eennoie\u015fte 23 mai 2026' : 'Renews May 23, 2026'} · 7 seats
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>€35.00<span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>/mo</span></div>
          </div>
        </div>
        {/* Two cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="zv-card" style={{ padding: 18, height: 280 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{lang === 'ro' ? 'Detalii abonament' : 'Subscription details'}</div>
            <Skeleton n={5} />
          </div>
          <div className="zv-card" style={{ padding: 18, height: 280 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{lang === 'ro' ? 'Plan & utilizare' : 'Plan & usage'}</div>
            <Skeleton n={5} />
          </div>
        </div>
      </div>
    );
  }
  function Skeleton({ n }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{ height: 14, background: 'var(--color-neutral-100)', borderRadius: 4, width: (50 + (i*7)%50) + '%' }} />
        ))}
      </div>
    );
  }

  function SplitView({ t, lang, paid, total }) {
    const removable = window.ZVData.TEAM.filter(m => !m.you);
    const [selected, setSelected] = useState(() => new Set(removable.slice(-2).map(m => m.id)));
    const { decisions, decide, decideMany } = useDecisions();

    // Drawer state — single appt OR a queue of appts.
    const [drawerAppt, setDrawerAppt] = useState(null);
    const [queue, setQueue] = useState(null); // {appts:[], idx:0}

    const overBy = total - paid;
    const candidates = window.ZVData.TEAM.filter(m => !selected.has(m.id) && !m.you);
    const apptsToHandle = useMemo(
      () => window.ZVData.apptsByOwner(Array.from(selected)),
      [selected]
    );

    const toggleMember = (id) => {
      setSelected(s => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    };

    const decided = apptsToHandle.filter(a => decisions[a.id]).length;
    const totalCnt = apptsToHandle.length;
    const allHandled = decided === totalCnt;
    const correctCount = selected.size === overBy;
    const canSave = correctCount && allHandled;

    const [seatsToAdd, setSeatsToAdd] = useState(0);
    const SEAT_PRICE = 5; // EUR / seat / mo

    // Per-row reschedule
    const openReschedule = (appt) => { setQueue(null); setDrawerAppt(appt); };
    const closeDrawer = () => { setDrawerAppt(null); setQueue(null); };
    const onSaveDrawer = (decision) => {
      if (queue) {
        decide(queue.appts[queue.idx].id, decision);
        if (queue.idx + 1 < queue.appts.length) {
          const nextIdx = queue.idx + 1;
          setQueue({ ...queue, idx: nextIdx });
          setDrawerAppt(queue.appts[nextIdx]);
        } else {
          closeDrawer();
        }
      } else {
        decide(drawerAppt.id, decision);
        closeDrawer();
      }
    };

    // Queue-mode reschedule
    const startRescheduleQueue = () => {
      const undecided = apptsToHandle.filter(a => !decisions[a.id]);
      if (!undecided.length) return;
      setQueue({ appts: undecided, idx: 0 });
      setDrawerAppt(undecided[0]);
    };

    return (
      <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        {/* Page behind */}
        <BillingBackdrop lang={lang} />
        {/* Scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,28,26,0.42)' }} />

        {/* MODAL */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(1200px, calc(100% - 64px))',
          height: 'min(780px, calc(100% - 64px))',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 30px 80px rgba(28,28,26,0.30), 0 6px 20px rgba(28,28,26,0.10)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Modal title bar */}
          <div style={{
            padding: '18px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-neutral-200)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="zv-modal-icon" style={{ width: 40, height: 40 }}>{Icons.users}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {lang === 'ro' ? 'Reconciliere locuri' : 'Reconcile your team with your new plan'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-neutral-600)', marginTop: 1 }}>
                  {lang === 'ro'
                    ? `Treci de la ${total} la ${paid} locuri pl\u0103tite. Alege ${overBy} ${overBy === 1 ? 'membru' : 'membri'} de scos, apoi rezolv\u0103 program\u0103rile lor.`
                    : `Moving from ${total} to ${paid} paid seats. Pick ${overBy} ${overBy === 1 ? 'member' : 'members'} to remove, then handle their upcoming appointments.`}
                </div>
              </div>
            </div>
            <button style={{ background: 'transparent', border: 'none', padding: 8, cursor: 'not-allowed',
                              color: 'var(--color-neutral-300)', display: 'inline-flex' }}
                    title={lang === 'ro' ? 'Trebuie s\u0103 finalizezi reconcilierea' : 'You must complete reconciliation to continue'}>
              {Icons.x}
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', minHeight: 0 }}>
            {/* LEFT */}
            <aside style={{
              borderRight: '1px solid var(--color-neutral-200)',
              background: 'var(--color-neutral-50)',
              display: 'flex', flexDirection: 'column',
              minHeight: 0,
            }}>
              <div style={{ padding: '18px 18px 12px' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                  {lang === 'ro' ? 'Cine r\u0103m\u00e2ne \u00een echip\u0103?' : 'Who stays on the team?'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
                  {selected.size === 0
                    ? (lang === 'ro' ? 'Selecteaz\u0103 membrii pe care \u00eei sco\u0163i.' : 'Select members to remove.')
                    : (lang === 'ro' ? `${selected.size}/${overBy} selecta\u0163i.` : `${selected.size}/${overBy} selected.`)}
                </div>
              </div>

              <div style={{ padding: '0 18px 12px' }}>
                <SeatBar paid={paid} total={total} removed={selected.size} t={t} lang={lang} />
              </div>

              <div className="zv-scroll" style={{ padding: '0 10px 14px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {window.ZVData.TEAM.map(m => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      selected={selected.has(m.id)}
                      onToggle={() => toggleMember(m.id)}
                      locked={!!m.pinned}
                      badge={m.you ? <span className="zv-chip zv-chip--accent">{t('memberYou')}</span> : null}
                      t={t} lang={lang}
                    />
                  ))}
                </div>
              </div>
            </aside>

            {/* RIGHT */}
            <main style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <header style={{ padding: '18px 24px 12px', borderBottom: '1px solid var(--color-neutral-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {t('apptsTitle')}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                      {selected.size === 0
                        ? (lang === 'ro' ? 'Selecteaz\u0103 membri \u00een st\u00e2nga.' : 'Select members on the left.')
                        : totalCnt === 0
                          ? (lang === 'ro' ? 'Niciuna de rezolvat.' : 'Nothing to handle.')
                          : (lang === 'ro'
                              ? `${totalCnt} program\u0103ri \u00een urm\u0103toarele 14 zile.`
                              : `${totalCnt} appointments across the next 14 days.`)}
                    </div>
                  </div>
                  <Status kind={allHandled && totalCnt > 0 ? 'completed' : 'confirmed'}>
                    {totalCnt === 0
                      ? (lang === 'ro' ? '\u2014' : '—')
                      : `${decided}/${totalCnt} ${lang === 'ro' ? 'rezolvate' : 'handled'}`}
                  </Status>
                </div>

                {/* Bulk actions — only when something to handle */}
                {totalCnt > 0 && (
                  <BulkActions
                    appts={apptsToHandle.filter(a => !decisions[a.id])}
                    candidates={candidates}
                    selectedSet={selected}
                    decideMany={decideMany}
                    t={t} lang={lang}
                  />
                )}
              </header>

              <div className="zv-scroll" style={{ flex: 1, padding: '16px 24px 24px', overflowY: 'auto' }}>
                <ApptsList
                  appts={apptsToHandle}
                  decisions={decisions}
                  onDecide={decide}
                  onReschedule={openReschedule}
                  candidates={candidates}
                  t={t} lang={lang}
                  groupByDay
                />
              </div>
            </main>
          </div>

          {/* Modal footer — seat-purchase upsell on the left, primary action on the right.
              No Cancel: this modal is blocking until reconciliation completes. */}
          <div style={{
            padding: '14px 18px 14px 18px',
            borderTop: '1px solid var(--color-neutral-200)',
            background: 'white',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 16,
            alignItems: 'center',
          }}>
            {/* Seat purchase card — modeled on the billing page treatment */}
            <SeatUpsell
              currentTotal={total}
              paid={paid}
              seatsToAdd={seatsToAdd}
              onChange={setSeatsToAdd}
              seatPrice={SEAT_PRICE}
              t={t} lang={lang}
            />

            <button className="zv-btn zv-btn--primary"
                    disabled={!canSave && seatsToAdd === 0}
                    title={canSave ? '' : (lang === 'ro'
                      ? 'Termin\u0103 de rezolvat program\u0103rile sau adaug\u0103 locuri'
                      : 'Resolve all appointments or add seats')}>
              {seatsToAdd > 0
                ? (lang === 'ro' ? `Adaug\u0103 ${seatsToAdd} loc${seatsToAdd === 1 ? '' : 'uri'}` : `Add ${seatsToAdd} seat${seatsToAdd === 1 ? '' : 's'}`)
                : t('btnSave')}
              {' '}{Icons.arrow}
            </button>
          </div>

          {/* Reschedule drawer (lives inside the modal so it scrims the modal, not the page) */}
          <EditAppointmentDrawer
            open={!!drawerAppt}
            appt={drawerAppt}
            candidates={candidates}
            t={t} lang={lang}
            onClose={closeDrawer}
            onSave={onSaveDrawer}
            queueInfo={queue ? { idx: queue.idx, total: queue.appts.length } : null}
          />
        </div>
      </div>
    );
  }

  // ── Bulk action bar with eligibility-aware "Reassign all to…" ─────────
  function BulkActions({ appts, candidates, selectedSet, decideMany, t, lang }) {
    if (!appts.length) return null;

    // Compute coverage per candidate.
    const coverage = candidates.map(c => ({
      member: c,
      n: window.ZVData.coverageFor(c.id, appts, selectedSet),
    })).sort((a, b) => b.n - a.n);

    const fullCoverage = coverage.filter(x => x.n === appts.length);
    const partialCoverage = coverage.filter(x => x.n > 0 && x.n < appts.length);
    const noCoverage = coverage.filter(x => x.n === 0);

    // Appointments where NO remaining staff can take over — must be cancelled.
    const orphaned = appts.filter(a => window.ZVData.eligibleFor(a, selectedSet).length === 0);

    const handlePick = (memberId) => {
      const eligibleAppts = appts.filter(a => window.ZVData.eligibleFor(a, selectedSet).includes(memberId));
      decideMany(eligibleAppts.map(a => a.id), { kind: 'reassign', toId: memberId });
    };

    const cancelOrphaned = () => {
      decideMany(orphaned.map(a => a.id), { kind: 'cancel' });
    };

    const hasPickable = fullCoverage.length > 0 || partialCoverage.length > 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Popover trigger={
          <button className="zv-btn zv-btn--ghost zv-btn--sm">
            {t('bulkReassign')} {Icons.chevDown}
          </button>
        } align="left" width={360}>
          <div style={{ padding: '4px 0', maxHeight: 480, overflowY: 'auto' }}>
            {/* TOP HALF — pickable candidates */}
            {fullCoverage.length > 0 && (
              <>
                <SectionHeader>
                  {lang === 'ro' ? `Calificat pentru toate ${appts.length}` : `Eligible for all ${appts.length}`}
                </SectionHeader>
                {fullCoverage.map(({ member }) => (
                  <MenuItem key={member.id} icon={<Avatar member={member} size={22} />}
                            onClick={() => handlePick(member.id)}>
                    {member.name}
                  </MenuItem>
                ))}
              </>
            )}
            {partialCoverage.length > 0 && (
              <>
                <SectionHeader>
                  {lang === 'ro' ? 'Calificat par\u0163ial' : 'Partial coverage'}
                </SectionHeader>
                {partialCoverage.map(({ member, n }) => (
                  <MenuItem key={member.id}
                            icon={<Avatar member={member} size={22} />}
                            hint={`${n}/${appts.length}`}
                            onClick={() => handlePick(member.id)}>
                    {member.name}
                  </MenuItem>
                ))}
              </>
            )}
            {!hasPickable && (
              <div style={{ padding: '14px 12px', fontSize: 12.5, color: 'var(--color-neutral-600)' }}>
                {lang === 'ro' ? 'Nimeni r\u0103mas nu poate prelua aceste program\u0103ri.'
                                : 'No one remaining can take over these appointments.'}
              </div>
            )}

            {/* BOTTOM HALF — orphaned appointments callout (block + force cancel) */}
            {orphaned.length > 0 && (
              <>
                <div style={{
                  borderTop: '1px solid var(--color-neutral-200)',
                  margin: '6px 0 0',
                  background: 'var(--color-neutral-50)',
                  padding: '12px 12px 12px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    marginBottom: 10,
                  }}>
                    <span style={{
                      flexShrink: 0, marginTop: 1,
                      width: 20, height: 20, borderRadius: 6,
                      background: 'oklch(94% 0.04 40)',
                      color: 'var(--color-warning-600)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {Icons.warn}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-neutral-900)', marginBottom: 4 }}>
                        {orphaned.length} {lang === 'ro'
                          ? `program\u0103${orphaned.length === 1 ? 're' : 'ri'} nu pot fi reasignate`
                          : `appointment${orphaned.length === 1 ? '' : 's'} can\u2019t be reassigned`}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--color-neutral-600)', lineHeight: 1.45 }}>
                        {lang === 'ro'
                          ? 'Niciun alt membru nu efectueaz\u0103 aceste servicii. Trebuie anulate, sau p\u0103streaz\u0103 echipa actual\u0103 cump\u0103r\u00e2nd locuri suplimentare.'
                          : 'No remaining team member performs these services. They must be cancelled, or keep your current team by adding more seats.'}
                      </div>
                    </div>
                  </div>
                  <button className="zv-btn zv-btn--ghost zv-btn--xs" style={{
                    width: '100%', justifyContent: 'center', color: 'var(--color-error-600)',
                  }} onClick={cancelOrphaned}>
                    {lang === 'ro' ? `Anuleaz\u0103 cele ${orphaned.length}` : `Cancel the ${orphaned.length}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </Popover>

        <button className="zv-btn zv-btn--quiet zv-btn--sm" style={{ color: 'var(--color-error-600)' }}
                onClick={() => decideMany(appts.map(a => a.id), { kind: 'cancel' })}>
          {t('bulkCancel')}
        </button>

        {orphaned.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--color-warning-600)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-flex' }}>{Icons.warn}</span>
            {orphaned.length} {lang === 'ro' ? 'necesit\u0103 aten\u0163ie' : 'need attention'}
          </span>
        )}
      </div>
    );
  }

  function SectionHeader({ children }) {
    return (
      <div style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
        color: 'var(--color-neutral-500)',
        textTransform: 'uppercase',
        padding: '8px 10px 4px',
      }}>{children}</div>
    );
  }

  // Seat upsell — modeled on the billing page's "Current seats" card.
  // Lives in the modal footer to make adding seats a primary, friendly path.
  function SeatUpsell({ currentTotal, paid, seatsToAdd, onChange, seatPrice, t, lang }) {
    const newTotal = paid + seatsToAdd;
    const enoughSeats = newTotal >= currentTotal;
    const dec = () => onChange(Math.max(0, seatsToAdd - 1));
    const inc = () => onChange(seatsToAdd + 1);

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 14px',
        background: 'var(--color-neutral-50)',
        border: '1px solid var(--color-neutral-200)',
        borderRadius: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 13.5, color: 'var(--color-neutral-900)' }}>
              {lang === 'ro' ? 'Cump\u0103r\u0103 locuri suplimentare' : 'Add more seats'}
            </strong>
            {seatsToAdd > 0 && enoughSeats && (
              <span style={{ fontSize: 11.5, color: 'oklch(48% 0.10 160)', fontWeight: 500 }}>
                {lang === 'ro' ? '\u2713 \u00cei p\u0103strezi pe to\u0163i' : '\u2713 Keep your whole team'}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}>
            {seatsToAdd === 0
              ? (lang === 'ro'
                  ? `${paid} locuri active \u00b7 \u20ac${seatPrice.toFixed(2)}/loc/lun\u0103`
                  : `${paid} active seats \u00b7 \u20ac${seatPrice.toFixed(2)}/seat/mo`)
              : (
                <span>
                  {paid}
                  <span style={{ margin: '0 6px', color: 'var(--color-neutral-400)', display: 'inline-flex', verticalAlign: 'middle' }}>
                    {Icons.arrow}
                  </span>
                  <strong style={{ color: 'var(--color-neutral-900)' }}>{newTotal}</strong>
                  <span style={{ marginLeft: 8 }}>
                    {`\u00b7 +\u20ac${(seatsToAdd * seatPrice).toFixed(2)}/${lang === 'ro' ? 'lun\u0103' : 'mo'}`}
                  </span>
                </span>
              )}
          </div>
        </div>

        {/* Stepper */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'white',
          border: '1px solid var(--color-neutral-300)',
          borderRadius: 999,
          height: 36,
          padding: '0 4px',
        }}>
          <button onClick={dec} disabled={seatsToAdd === 0}
                  className="zv-btn zv-btn--quiet"
                  style={{ width: 28, height: 28, padding: 0, borderRadius: 999,
                            opacity: seatsToAdd === 0 ? 0.35 : 1 }}
                  aria-label="Decrease">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span style={{ minWidth: 28, textAlign: 'center', fontSize: 13.5, fontWeight: 600,
                          color: 'var(--color-neutral-900)', fontVariantNumeric: 'tabular-nums' }}>
            {seatsToAdd}
          </span>
          <button onClick={inc}
                  className="zv-btn zv-btn--quiet"
                  style={{ width: 28, height: 28, padding: 0, borderRadius: 999 }}
                  aria-label="Increase">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    );
  }

  window.ZVSplitView = { SplitView };
})();

// Appointments handler — used by all variants.
// Row layout matches the Calendar app's day list: customer · service · time · assigned-staff · status
// Exposes window.ZVAppts.

(function () {
  const { useState, useMemo, useEffect, useRef } = React;
  const { Icons, Icon, Avatar, Chip, Status, Popover, MenuItem } = window.ZVUI;
  const { formatHour, formatRelativeDay } = window.ZVI18n;

  function useDecisions() {
    const [decisions, setDecisions] = useState({});
    const decide = (apptId, decision) => {
      setDecisions(d => {
        const next = { ...d };
        if (!decision) delete next[apptId]; else next[apptId] = decision;
        return next;
      });
    };
    const decideMany = (apptIds, decision) => {
      setDecisions(d => {
        const next = { ...d };
        apptIds.forEach(id => {
          if (!decision) delete next[id]; else next[id] = decision;
        });
        return next;
      });
    };
    const reset = () => setDecisions({});
    return { decisions, decide, decideMany, reset };
  }

  function memberMap() {
    const m = {};
    window.ZVData.TEAM.forEach(t => { m[t.id] = t; });
    return m;
  }

  // Calendar-style row.
  // Layout: [client + service] [time] [assigned staff chip] [status pill] [actions]
  function ApptRow({ appt, decision, onDecide, onReschedule, candidates, t, lang }) {
    const mm = memberMap();
    const owner = mm[appt.ownerId];
    const newOwner = decision && decision.kind === 'reassign' ? mm[decision.toId] : null;
    const cancelled = decision && decision.kind === 'cancel';
    const reschedule = decision && decision.kind === 'reschedule';
    const decided = !!decision;

    // Decision marker — replaces status pill. Only shown when a decision was made.
    const decisionMarker =
      cancelled  ? { color: 'var(--color-error-600)', label: lang === 'ro' ? 'Anulat\u0103' : 'Cancelled' } :
      reschedule ? { color: 'oklch(45% 0.13 76)', label: lang === 'ro' ? 'Reprogramat\u0103' : 'Rescheduled' } :
      newOwner   ? { color: 'oklch(48% 0.10 160)', label: lang === 'ro' ? 'Reasignat\u0103' : 'Reassigned' } :
                   null;

    // For rescheduled rows, show the NEW time (and new staff if changed).
    const newSlotIso = reschedule ? decision.newScheduledAt : null;
    const newStaffMember = reschedule && decision.newStaffUserId ? mm[decision.newStaffUserId] : null;
    const effectiveNewOwner = newOwner || newStaffMember;

    // Reassign is only meaningful if at least one candidate exists for this row.
    const canReassign = !!(candidates && candidates.length);

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.3fr) 130px minmax(0,1fr) auto',
        alignItems: 'center',
        columnGap: 14,
        padding: '12px 14px',
        background: 'white',
        border: '1px solid ' + (decided ? 'var(--color-neutral-200)' : 'var(--color-neutral-200)'),
        borderLeft: decided && decisionMarker
          ? `3px solid ${decisionMarker.color}`
          : '1px solid var(--color-neutral-200)',
        paddingLeft: decided && decisionMarker ? 12 : 14,
        borderRadius: 10,
        opacity: cancelled ? 0.65 : 1,
      }}>
        {/* Client + service */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: 'var(--color-neutral-900)',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {appt.client}
            {appt.vip && <span title="VIP" style={{ fontSize: 10, color: 'var(--color-warning-600)' }}>★</span>}
            {appt.recurring && <span title={t('chipRecurring')} style={{ display: 'inline-flex', color: 'var(--color-info-600)' }}>{Icons.repeat}</span>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-neutral-600)', marginTop: 2,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {appt.service}
          </div>
        </div>

        {/* Time — original (struck) + new */}
        <div style={{ fontSize: 13, color: 'var(--color-neutral-700)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 500,
            color: newSlotIso ? 'var(--color-neutral-500)' : 'var(--color-neutral-900)',
            textDecoration: newSlotIso ? 'line-through' : 'none',
          }}>{formatHour(appt.start, lang)}</span>
          {newSlotIso && (
            <>
              <span style={{ color: 'var(--color-neutral-400)', display: 'inline-flex' }}>{Icons.arrow}</span>
              <span style={{ fontWeight: 600, color: 'oklch(45% 0.13 76)' }}>
                {formatHour(newSlotIso, lang)}
              </span>
            </>
          )}
          {!newSlotIso && <span style={{ color: 'var(--color-neutral-500)' }}>({appt.duration}m)</span>}
        </div>

        {/* Assigned staff */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Avatar member={owner} size={22} />
          <span style={{
            fontSize: 12.5,
            color: effectiveNewOwner || cancelled ? 'var(--color-neutral-500)' : 'var(--color-neutral-800)',
            textDecoration: effectiveNewOwner || cancelled ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {owner.name.split(' ')[0]}
          </span>
          {effectiveNewOwner && (
            <>
              <span style={{ color: 'var(--color-neutral-400)', display: 'inline-flex' }}>{Icons.arrow}</span>
              <Avatar member={effectiveNewOwner} size={22} />
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-neutral-900)' }}>
                {effectiveNewOwner.name.split(' ')[0]}
              </span>
            </>
          )}
        </div>

        {/* Status pill removed — decision is shown via left border + action label */}

        {/* Actions — fixed-width column so rows stay aligned regardless of state */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end',
          minWidth: 180,
        }}>
          {decided ? (
            <>
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: decisionMarker ? decisionMarker.color : 'var(--color-neutral-700)',
                marginRight: 4,
              }}>
                {decisionMarker && decisionMarker.label}
              </span>
              <button className="zv-btn zv-btn--quiet zv-btn--xs" onClick={() => onDecide(appt.id, null)}>
                {t('actUndo')}
              </button>
            </>
          ) : canReassign ? (
            <>
              <Popover trigger={
                <button className="zv-btn zv-btn--ghost zv-btn--xs">
                  {t('actReassign')} {Icons.chevDown}
                </button>
              } width={220}>
                {candidates.map(c => (
                  <MenuItem key={c.id} icon={<Avatar member={c} size={20} />}
                            onClick={() => onDecide(appt.id, { kind: 'reassign', toId: c.id })}>
                    {c.name}
                  </MenuItem>
                ))}
              </Popover>
              <Popover align="right" trigger={
                <button className="zv-btn zv-btn--quiet zv-btn--xs" style={{ width: 28, padding: 0 }}
                        title="More actions">
                  {Icons.moreHoriz}
                </button>
              } width={200}>
                <MenuItem icon={Icons.clock} onClick={() => onReschedule && onReschedule(appt)}>
                  {t('actReschedule')}
                </MenuItem>
                <MenuItem icon={Icons.x} danger onClick={() => onDecide(appt.id, { kind: 'cancel' })}>
                  {t('actCancel')}
                </MenuItem>
              </Popover>
            </>
          ) : (
            // No reassign candidates AND no reschedule path — only Cancel is available.
            <button className="zv-btn zv-btn--ghost zv-btn--xs"
                    style={{ color: 'var(--color-error-600)' }}
                    onClick={() => onDecide(appt.id, { kind: 'cancel' })}>
              <span style={{ display: 'inline-flex', marginRight: 4 }}>{Icons.x}</span>
              {t('actCancel')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Per-row candidates: filter the global candidate pool by the appt's
  // eligible-staff list. Empty `eligibleStaff` is meaningful — it means no one
  // can take over — so we honor it and return [] (which hides the Reassign
  // button at the row level). We only fall back to the global pool when the
  // metadata is missing entirely (undefined/null).
  function candidatesForAppt(appt, candidates) {
    if (!appt.eligibleStaff) return candidates;
    const elig = new Set(appt.eligibleStaff);
    return candidates.filter(c => elig.has(c.id));
  }

  function ApptsList({ appts, decisions, onDecide, onReschedule, candidates, t, lang, groupByDay = true }) {
    if (!appts.length) {
      return (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--color-neutral-600)',
          background: 'white',
          border: '1px dashed var(--color-neutral-300)',
          borderRadius: 12,
          fontSize: 13.5,
        }}>
          {t('apptsEmpty')}
        </div>
      );
    }

    if (groupByDay) {
      const groups = {};
      appts.forEach(a => {
        groups[a.day] = groups[a.day] || [];
        groups[a.day].push(a);
      });
      const days = Object.keys(groups).sort();
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {days.map(day => (
            <div key={day}>
              <div style={{
                fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                color: 'var(--color-neutral-500)',
                textTransform: 'uppercase',
                marginBottom: 8,
                paddingLeft: 2,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>{formatRelativeDay(groups[day][0].start, lang)}</span>
                <span style={{ color: 'var(--color-neutral-400)' }}>·</span>
                <span style={{ color: 'var(--color-neutral-500)' }}>
                  {groups[day].length} {lang === 'ro' ? 'program\u0103ri' : 'appointments'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {groups[day].map(a => (
                  <ApptRow key={a.id} appt={a} decision={decisions[a.id]}
                           onDecide={onDecide} onReschedule={onReschedule}
                           candidates={candidatesForAppt(a, candidates)} t={t} lang={lang} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {appts.map(a => (
          <ApptRow key={a.id} appt={a} decision={decisions[a.id]}
                   onDecide={onDecide} onReschedule={onReschedule}
                   candidates={candidatesForAppt(a, candidates)} t={t} lang={lang} />
        ))}
      </div>
    );
  }

  window.ZVAppts = { useDecisions, ApptsList, ApptRow };
})();

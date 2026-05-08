// Edit Appointment drawer (mocked, stage-mode only).
// Mirrors the visual language from the screenshots:
//   • Right-side drawer over a scrim
//   • Circular calendar icon, dashed underline
//   • Sections: Client (read-only), Service (read-only), Staff, Date & Time, Notes
//   • Footer: Cancel + Save Changes (terracotta)
// In reconciliation we open it with mode="stage": Save Changes does NOT hit
// the API, it writes a `reschedule` decision back to the parent.
//
// Exposes window.ZVDrawer.

(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const { Icons, Avatar, Status, Popover, MenuItem } = window.ZVUI;
  const { formatHour } = window.ZVI18n;

  // Minimal date picker — pretend it's the real one.
  const DAYS_AHEAD = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];

  function dayLabel(d, lang) {
    return d.toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function generateSlots(date) {
    // 09:00 – 17:00 in 15min increments
    const slots = [];
    const base = new Date(date);
    base.setHours(9, 0, 0, 0);
    for (let m = 0; m < (8*60); m += 15) {
      const t = new Date(base.getTime() + m * 60000);
      slots.push(t);
    }
    return slots;
  }

  // Pretend conflict map: a few slots are "blocked" so we can show conflict UX.
  function isConflict(date, staffId) {
    const key = date.toISOString().slice(0,16) + '|' + staffId;
    // simple deterministic blocker: a few hashed conflicts
    const h = [...key].reduce((a,c) => (a*31 + c.charCodeAt(0)) | 0, 0);
    return Math.abs(h) % 19 === 0;
  }

  function EditAppointmentDrawer({ open, appt, candidates, t, lang, onClose, onSave, queueInfo }) {
    const today = window.ZVData.today;
    const ownerId = appt ? appt.ownerId : null;

    const [staffId, setStaffId] = useState(ownerId);
    const [dayIdx, setDayIdx] = useState(0);
    const [slot, setSlot] = useState(null);
    const [showSlots, setShowSlots] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
      if (!open || !appt) return;
      // initial: keep current owner & current slot date as a starting point
      const eligible = (appt.eligibleStaff || []).filter(id => candidates.find(c => c.id === id));
      setStaffId(eligible[0] || (candidates[0] && candidates[0].id) || appt.ownerId);
      const start = new Date(appt.start);
      const ref = new Date(today); ref.setHours(0,0,0,0);
      const dayStart = new Date(start); dayStart.setHours(0,0,0,0);
      const di = Math.max(0, Math.round((dayStart - ref) / 86400000));
      setDayIdx(Math.min(di, DAYS_AHEAD.length - 1));
      setSlot(null);
      setShowSlots(false);
      setNotes('');
    }, [open, appt && appt.id]);

    if (!open || !appt) return null;

    const dayDate = new Date(today.getTime() + DAYS_AHEAD[dayIdx] * 86400000);
    const slots = generateSlots(dayDate);
    const eligibleHere = (appt.eligibleStaff || []).filter(id => candidates.find(c => c.id === id));
    const staffOptions = candidates.filter(c => eligibleHere.length === 0 || eligibleHere.includes(c.id));
    const selectedStaff = window.ZVData.TEAM.find(m => m.id === staffId);

    const slotConflict = slot ? isConflict(slot, staffId) : false;
    const canSave = !!slot && !slotConflict;

    const handleSave = () => {
      if (!canSave) return;
      onSave({
        kind: 'reschedule',
        newScheduledAt: slot.toISOString(),
        newStaffUserId: staffId,
      });
    };

    return (
      <>
        {/* scrim */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(28,28,26,0.42)',
            zIndex: 100,
          }}
        />
        {/* drawer */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 480, background: 'white',
          boxShadow: '-12px 0 40px rgba(28,28,26,0.18)',
          display: 'flex', flexDirection: 'column',
          zIndex: 101,
          animation: 'zvSlideIn .22s ease-out',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="zv-modal-icon" style={{ width: 40, height: 40 }}>{Icons.calendar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600 }}>
                    {lang === 'ro' ? 'Editeaz\u0103 programare' : 'Edit Appointment'}
                  </h2>
                  <button onClick={onClose}
                          style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer',
                                    color: 'var(--color-neutral-600)', display: 'inline-flex' }}>
                    {Icons.x}
                  </button>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                  {queueInfo
                    ? (lang === 'ro'
                        ? `Reprogram\u0103re ${queueInfo.idx + 1} din ${queueInfo.total}`
                        : `Reschedule ${queueInfo.idx + 1} of ${queueInfo.total}`)
                    : (lang === 'ro' ? 'Modific\u0103 ora sau persoana asignat\u0103' : 'Pick a new time and staff member')}
                </p>
              </div>
            </div>
            <div className="zv-modal-divider" style={{ marginTop: 16 }} />
          </div>

          {/* Body */}
          <div className="zv-scroll" style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
            {/* Client (read-only — backend forbids changing customer on existing appt) */}
            <Section label={lang === 'ro' ? 'Client' : 'Client'}>
              <div style={{
                background: 'var(--color-neutral-100)',
                border: '1px solid var(--color-neutral-200)',
                borderRadius: 10, padding: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 999,
                  background: 'var(--color-neutral-300)', color: 'var(--color-neutral-700)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {appt.client.split(' ').map(p => p[0]).slice(0,2).join('')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{appt.client}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{appt.clientPhone}</div>
                </div>
                {appt.vip && <span className="zv-chip zv-chip--warn">VIP</span>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 6 }}>
                {lang === 'ro' ? 'Clientul nu poate fi schimbat pentru program\u0103ri existente.'
                                : 'Customer cannot be changed for existing appointments.'}
              </div>
            </Section>

            {/* Service (read-only) */}
            <Section label={lang === 'ro' ? 'Serviciu' : 'Service'}>
              <div style={{
                background: 'white',
                border: '1px solid var(--color-neutral-200)',
                borderRadius: 10, padding: 12,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{appt.service}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                    {appt.duration} min · {lang === 'ro' ? appt.price + ' lei' : appt.price + ' RON'}
                  </div>
                </div>
              </div>
            </Section>

            {/* Staff — eligibility-filtered */}
            <Section label={lang === 'ro' ? 'Personal asignat' : 'Assigned staff'}>
              <Popover trigger={
                <button className="zv-input" style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  textAlign: 'left', cursor: 'pointer',
                }}>
                  {selectedStaff && <Avatar member={selectedStaff} size={22} />}
                  <span style={{ flex: 1, fontSize: 13.5 }}>{selectedStaff ? selectedStaff.name : '—'}</span>
                  <span style={{ display: 'inline-flex', color: 'var(--color-neutral-500)' }}>{Icons.chevDown}</span>
                </button>
              } align="left" width={400}>
                {staffOptions.map(c => (
                  <MenuItem key={c.id}
                            icon={<Avatar member={c} size={22} />}
                            onClick={() => setStaffId(c.id)}>
                    {c.name}
                  </MenuItem>
                ))}
              </Popover>
              <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 6 }}>
                {lang === 'ro'
                  ? `${staffOptions.length} ${staffOptions.length === 1 ? 'persoan\u0103 calificat\u0103' : 'persoane calificate'} pentru acest serviciu.`
                  : `${staffOptions.length} ${staffOptions.length === 1 ? 'staff member' : 'staff members'} can perform this service.`}
              </div>
            </Section>

            {/* Date & Time */}
            <Section label={lang === 'ro' ? 'Dat\u0103 & or\u0103' : 'Date & Time'}
                     hint={lang === 'ro' ? 'Alege c\u00e2nd va avea loc programarea.' : 'Select when the appointment will take place.'}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Date pill picker */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-neutral-700)', marginBottom: 6 }}>
                    {lang === 'ro' ? 'Dat\u0103' : 'Date'}
                  </div>
                  <Popover trigger={
                    <button className="zv-input" style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer',
                    }}>
                      <span style={{ display: 'inline-flex', color: 'var(--color-neutral-600)' }}>{Icons.calendar}</span>
                      <span style={{ flex: 1 }}>{dayLabel(dayDate, lang)}</span>
                      <span style={{ display: 'inline-flex', color: 'var(--color-neutral-500)' }}>{Icons.chevDown}</span>
                    </button>
                  } align="left" width={260}>
                    {DAYS_AHEAD.map(d => {
                      const dd = new Date(today.getTime() + d * 86400000);
                      return (
                        <MenuItem key={d} onClick={() => { setDayIdx(d); setSlot(null); }}>
                          {dayLabel(dd, lang)}
                        </MenuItem>
                      );
                    })}
                  </Popover>
                </div>

                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-neutral-700)', marginBottom: 6 }}>
                    {lang === 'ro' ? 'Or\u0103' : 'Time'}
                  </div>
                  <button onClick={() => setShowSlots(s => !s)} className="zv-input" style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer',
                  }}>
                    <span style={{ display: 'inline-flex', color: 'var(--color-neutral-600)' }}>{Icons.clock}</span>
                    <span style={{ flex: 1, color: slot ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)' }}>
                      {slot ? formatHour(slot.toISOString(), lang) : (lang === 'ro' ? 'Alege ora' : 'Select time')}
                    </span>
                    <span style={{ display: 'inline-flex', color: 'var(--color-neutral-500)' }}>{Icons.chevDown}</span>
                  </button>
                </div>
              </div>

              {showSlots && (
                <div style={{
                  marginTop: 10,
                  background: 'white',
                  border: '1px solid var(--color-neutral-200)',
                  borderRadius: 10,
                  padding: 10,
                  maxHeight: 200, overflowY: 'auto',
                }} className="zv-scroll">
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--color-neutral-500)',
                                 textTransform: 'uppercase', padding: '4px 6px 8px' }}>
                    09:00 – 17:00 · {lang === 'ro' ? 'Program de lucru' : 'Working hours'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {slots.map((s, i) => {
                      const conflict = isConflict(s, staffId);
                      const selected = slot && s.getTime() === slot.getTime();
                      return (
                        <button key={i}
                                disabled={conflict}
                                onClick={() => { setSlot(s); setShowSlots(false); }}
                                style={{
                                  padding: '7px 4px',
                                  borderRadius: 6,
                                  fontSize: 12.5,
                                  border: '1px solid ' + (selected ? 'var(--accent)' : 'var(--color-neutral-200)'),
                                  background: selected ? 'var(--color-primary-100)' : (conflict ? 'var(--color-neutral-100)' : 'white'),
                                  color: conflict ? 'var(--color-neutral-400)' : 'var(--color-neutral-900)',
                                  cursor: conflict ? 'not-allowed' : 'pointer',
                                  fontFamily: 'inherit',
                                  textDecoration: conflict ? 'line-through' : 'none',
                                }}>
                          {formatHour(s.toISOString(), lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {slot && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
                  {lang === 'ro' ? 'Programare:' : 'Appointment:'}{' '}
                  <strong style={{ color: 'var(--color-neutral-900)' }}>
                    {dayLabel(dayDate, lang)} · {formatHour(slot.toISOString(), lang)} – {
                      formatHour(new Date(slot.getTime() + appt.duration * 60000).toISOString(), lang)
                    }
                  </strong>
                </div>
              )}

              {slotConflict && (
                <div style={{
                  marginTop: 10, padding: 10, borderRadius: 8,
                  background: 'var(--color-error-100)', color: 'var(--color-error-600)',
                  fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ display: 'inline-flex' }}>{Icons.warn}</span>
                  {lang === 'ro' ? 'Conflict: persoana selectat\u0103 are deja o programare la acea or\u0103.'
                                  : 'Conflict: selected staff is already booked at this time.'}
                </div>
              )}
            </Section>

            {/* Notes */}
            <Section label={lang === 'ro' ? 'Note' : 'Notes'}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder={lang === 'ro' ? 'Ad\u0103ug\u0103 detalii\u2026' : 'Add any special notes\u2026'}
                        style={{
                          width: '100%', minHeight: 70, resize: 'vertical',
                          border: '1px solid var(--color-neutral-300)', borderRadius: 10,
                          padding: 10, font: 'inherit', fontSize: 13,
                          outline: 'none',
                        }}/>
            </Section>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px dashed var(--color-neutral-300)', padding: 16, display: 'flex', gap: 10 }}>
            <button className="zv-btn zv-btn--ghost" style={{ flex: 1 }} onClick={onClose}>
              {queueInfo ? (lang === 'ro' ? 'Sari peste' : 'Skip') : (lang === 'ro' ? 'Renun\u0163\u0103' : 'Cancel')}
            </button>
            <button className="zv-btn zv-btn--primary" style={{ flex: 1.4 }}
                    disabled={!canSave} onClick={handleSave}>
              {queueInfo
                ? (lang === 'ro' ? 'Salveaz\u0103 \u015fi continu\u0103' : 'Save & Next')
                : (lang === 'ro' ? 'Salveaz\u0103 modific\u0103rile' : 'Save Changes')} {Icons.arrow}
            </button>
          </div>
        </div>

        <style>{`@keyframes zvSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </>
    );
  }

  function Section({ label, hint, children }) {
    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: hint ? 2 : 8, color: 'var(--color-neutral-900)' }}>
          {label}
        </div>
        {hint && <div style={{ fontSize: 12.5, color: 'var(--color-neutral-600)', marginBottom: 10 }}>{hint}</div>}
        {children}
      </div>
    );
  }

  window.ZVDrawer = { EditAppointmentDrawer };
})();

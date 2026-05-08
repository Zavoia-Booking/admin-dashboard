// Shared bits: icons, avatar, chip, action menu, used by all layouts.
// Exposes: window.ZVUI.

(function () {
  const { useState, useRef, useEffect } = React;

  const Icon = ({ d, size = 16, stroke = 'currentColor', sw = 1.6, fill = 'none', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );

  const Icons = {
    chevRight: <Icon d="m9 6 6 6-6 6" />,
    chevLeft:  <Icon d="m15 6-6 6 6 6" />,
    chevDown:  <Icon d="m6 9 6 6 6-6" />,
    check:     <Icon d="M20 6 9 17l-5-5" />,
    plus:      <Icon d="M12 5v14M5 12h14" />,
    x:         <Icon d="M18 6 6 18M6 6l12 12" />,
    users:     <Icon d={['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75']} />,
    calendar:  <Icon d={['M3 10h18', 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M8 3v4', 'M16 3v4']} />,
    arrow:     <Icon d="M5 12h14M13 6l6 6-6 6" />,
    clock:     <Icon d={['M12 7v5l3 2', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z']} />,
    search:    <Icon d={['M21 21l-4.35-4.35', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z']} />,
    warn:      <Icon d={['M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01']} />,
    repeat:    <Icon d={['M17 2l4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'M7 22l-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3']} />,
    crown:     <Icon d="M2 7l4 8h12l4-8-6 5-4-7-4 7-6-5z" />,
    trash:     <Icon d={['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'm19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6']} />,
    link:      <Icon d={['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71']} />,
    moreHoriz: <Icon d="M5 12h.01M12 12h.01M19 12h.01" sw={4} />,
  };

  function Avatar({ member, size = 32 }) {
    const fontSize = Math.max(10, Math.round(size * 0.36));
    return (
      <span className="zv-avatar"
            style={{ width: size, height: size, background: member.color, fontSize }}>
        {member.initials}
      </span>
    );
  }

  function Chip({ kind, children, icon }) {
    const cls = 'zv-chip' + (kind ? ' zv-chip--' + kind : '');
    return <span className={cls}>{icon}{children}</span>;
  }

  function Status({ kind, children }) {
    return <span className={'zv-status zv-status--' + kind}>{children}</span>;
  }

  function Popover({ trigger, children, align = 'right', width = 240 }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      if (!open) return;
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onEsc);
      return () => {
        document.removeEventListener('mousedown', onDoc);
        document.removeEventListener('keydown', onEsc);
      };
    }, [open]);
    return (
      <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
        <span onClick={() => setOpen(o => !o)}>{trigger}</span>
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', [align]: 0, width,
            background: 'white', border: '1px solid var(--color-neutral-200)',
            borderRadius: 10, boxShadow: '0 12px 40px rgba(28,28,26,0.12), 0 2px 6px rgba(28,28,26,0.06)',
            padding: 6, zIndex: 50,
          }} onClick={() => setOpen(false)}>
            {children}
          </div>
        )}
      </span>
    );
  }

  function MenuItem({ icon, children, onClick, danger, hint }) {
    return (
      <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', background: 'transparent', border: 'none',
        padding: '8px 10px', borderRadius: 7, font: 'inherit', fontSize: 13,
        color: danger ? 'var(--color-error-600)' : 'var(--color-neutral-800)',
        cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-neutral-100)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {icon && <span style={{ display: 'inline-flex', color: danger ? 'var(--color-error-600)' : 'var(--color-neutral-600)' }}>{icon}</span>}
        <span style={{ flex: 1 }}>{children}</span>
        {hint && <span style={{ fontSize: 11, color: 'var(--color-neutral-500)' }}>{hint}</span>}
      </button>
    );
  }

  function MemberRow({ member, selected, onToggle, t, locked, badge, lang }) {
    const disabled = !!locked;
    return (
      <div
        onClick={disabled ? undefined : onToggle}
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 12px 11px 14px',
          borderRadius: 10,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: selected ? 'white' : 'transparent',
          border: '1px solid ' + (selected ? 'var(--color-neutral-200)' : 'transparent'),
          boxShadow: selected ? '0 1px 2px rgba(28,28,26,0.04)' : 'none',
          opacity: disabled ? 0.55 : 1,
          transition: 'background .12s, border-color .12s, box-shadow .12s',
        }}
        onMouseEnter={e => { if (!selected && !disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
        onMouseLeave={e => { if (!selected && !disabled) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Selected accent bar on the left */}
        {selected && (
          <span style={{
            position: 'absolute', left: 0, top: 8, bottom: 8, width: 3,
            background: 'var(--accent)', borderRadius: '0 3px 3px 0',
          }} />
        )}

        <div style={{ position: 'relative' }}>
          <Avatar member={member} size={34} />
          {selected && (
            <span style={{
              position: 'absolute', right: -4, bottom: -4,
              width: 16, height: 16, borderRadius: 999,
              background: 'var(--accent)',
              border: '2px solid white',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          )}
          {locked && (
            <span style={{
              position: 'absolute', right: -4, bottom: -4,
              width: 16, height: 16, borderRadius: 999,
              background: 'white',
              border: '1.5px solid var(--color-neutral-300)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-neutral-600)',
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 7l4 8h12l4-8-6 5-4-7-4 7-6-5z" />
              </svg>
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              fontWeight: 500, fontSize: 13.5,
              color: 'var(--color-neutral-900)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{member.name}</div>
            {badge}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 1,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.role}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-neutral-800)' }}>
            {member.appts}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)' }}>
            {lang === 'ro' ? 'program.' : (member.appts === 1 ? 'appt' : 'appts')}
          </div>
        </div>
      </div>
    );
  }

  function SeatBar({ paid, total, removed, t, lang }) {
    const cells = Array.from({ length: total });
    const overBy = total - paid;
    return (
      <div style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-neutral-200)', borderRadius: 10, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
            <strong style={{ color: 'var(--color-neutral-900)', fontWeight: 600 }}>{total}</strong>
            {' '}{lang === 'ro' ? 'membri' : 'members'} · {paid} {lang === 'ro' ? 'locuri pl\u0103tite' : 'paid seats'}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: removed >= overBy ? 'var(--color-success-600)' : 'var(--color-primary-700)' }}>
            {removed >= overBy ? '✓ ' : ''}{removed}/{overBy} {lang === 'ro' ? 'selecta\u0163i' : 'selected'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, position: 'relative', height: 22 }}>
          {cells.map((_, i) => {
            const overLimit = i >= paid;
            return (
              <div key={i} style={{
                flex: 1, borderRadius: 5,
                background: overLimit ? 'var(--color-primary-100)' : 'white',
                border: overLimit ? '1px dashed oklch(70% 0.10 38)' : '1px solid var(--color-neutral-300)',
              }} />
            );
          })}
          <div style={{
            position: 'absolute',
            left: `calc(${(paid / total) * 100}% - 1px)`,
            top: -4, bottom: -4, width: 2,
            background: 'var(--color-neutral-900)', borderRadius: 2,
          }} />
        </div>
      </div>
    );
  }

  window.ZVUI = { Icon, Icons, Avatar, Chip, Status, Popover, MenuItem, MemberRow, SeatBar };
})();

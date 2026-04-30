// Primitives matched to real Inno app vocabulary.

const PRIM_CSS = `
/* ── Buttons — fully rounded pills like real app ── */
.btn { display: inline-flex; align-items: center; gap: 7px; border-radius: var(--radius-pill); border: 1px solid transparent; cursor: pointer; font-weight: 500; transition: all .12s; white-space: nowrap; line-height: 1; font-family: inherit; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-sm { padding: 7px 12px; font-size: 12.5px; }
.btn-md { padding: 9px 16px; font-size: 13.5px; }
.btn-lg { padding: 12px 22px; font-size: 14.5px; font-weight: 600; }

.btn-accent { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-accent:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }

.btn-secondary { background: #fff; color: var(--ink); border-color: var(--line-strong); }
.btn-secondary:hover:not(:disabled) { background: var(--bg-sunk); }

.btn-ghost { background: transparent; color: var(--ink-1); border-color: transparent; }
.btn-ghost:hover:not(:disabled) { background: var(--bg-sunk); }

.btn-danger-ghost { background: transparent; color: var(--danger); }
.btn-danger-ghost:hover:not(:disabled) { background: var(--danger-soft); }

.btn-block { width: 100%; justify-content: center; }
.btn .arr { display: inline-flex; }

/* ── Pills (status badges with dot) ── */
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: var(--radius-pill); font-size: 11.5px; font-weight: 500; line-height: 1.4; white-space: nowrap; }
.pill-good { background: var(--good-pill-bg); color: var(--good-pill-fg); }
.pill-warn { background: var(--warn-soft); color: var(--warn); }
.pill-danger { background: var(--danger-pill-bg); color: var(--danger-pill-fg); }
.pill-info { background: var(--info-soft); color: var(--info); }
.pill-neutral { background: var(--bg-sunk); color: var(--ink-2); }
.pill-customized { background: var(--customized-soft); color: var(--customized); }
.pill-accent { background: var(--accent-soft); color: var(--accent-deep); }
.pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

/* ── Card ── */
.card { background: var(--bg-elev); border: 1px solid var(--line); border-radius: var(--radius); padding: var(--pad-card); box-shadow: var(--shadow-card); }
.card + .card { margin-top: var(--gap-card); }
.card-h { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.card-h h3 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -.01em; color: var(--ink); }
.card-h .sub { font-size: 12.5px; color: var(--ink-2); margin-top: 3px; line-height: 1.4; }
.card-h .right { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }

/* ── Section header (UPPERCASE outside cards, like real app) ── */
.section-h { font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--ink-3); text-transform: uppercase; margin: 18px 0 10px; padding: 0 2px; }

/* ── Banner (info/warn/danger strip inside cards) ── */
.banner { display: flex; gap: 10px; padding: 12px 14px; border-radius: var(--radius-sm); align-items: flex-start; font-size: 13px; }
.banner .b-ico { flex-shrink: 0; margin-top: 1px; }
.banner .b-body { flex: 1; line-height: 1.5; }
.banner .b-body strong { font-weight: 600; color: var(--ink); display: block; margin-bottom: 2px; font-size: 13.5px; }
.banner-info { background: var(--info-soft); color: var(--info); }
.banner-warn { background: var(--warn-soft); color: var(--warn); }
.banner-danger { background: var(--danger-soft); color: var(--danger); }
.banner-good { background: var(--good-soft); color: var(--good); }
.banner .b-body { color: var(--ink-1); }

/* ── Soft accent row card (like Marketplace Profile's blue toggle rows) ── */
.row-toggle { background: var(--bg-soft-blue); border: 1px solid #E1E7F4; border-radius: var(--radius); padding: 14px 16px; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: start; }
.row-toggle h4 { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.row-toggle p { margin: 4px 0 0; font-size: 12.5px; color: var(--ink-2); line-height: 1.5; }
.row-toggle .meta { margin-top: 10px; font-size: 13px; color: var(--ink-1); display: flex; align-items: center; gap: 8px; }

/* ── Toggle switch ── */
.tgl { width: 36px; height: 20px; border-radius: var(--radius-pill); background: var(--ink-4); position: relative; cursor: pointer; transition: background .15s; flex-shrink: 0; border: 0; padding: 0; }
.tgl::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 2px rgba(0,0,0,.18); }
.tgl[data-on="true"] { background: var(--accent); }
.tgl[data-on="true"]::after { transform: translateX(16px); }

/* ── Inputs ── */
.input { width: 100%; padding: 10px 12px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: #fff; font-size: 13.5px; color: var(--ink); transition: all .12s; outline: none; }
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.input::placeholder { color: var(--ink-3); }
select.input { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239A9A9A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; }
.label { display: block; font-size: 12px; font-weight: 500; color: var(--ink-2); margin-bottom: 6px; }
.hint { font-size: 11.5px; color: var(--ink-3); margin-top: 5px; line-height: 1.4; }
.input-row { display: flex; gap: 8px; align-items: stretch; }
.input-row > .input { flex: 1; }

/* ── Stepper ── */
.stepper { display: inline-flex; align-items: center; border: 1px solid var(--line-strong); border-radius: var(--radius-pill); overflow: hidden; background: #fff; }
.stepper button { border: 0; background: transparent; width: 30px; height: 32px; cursor: pointer; color: var(--ink-1); display: grid; place-items: center; }
.stepper button:hover:not(:disabled) { background: var(--bg-sunk); }
.stepper button:disabled { color: var(--ink-4); cursor: not-allowed; }
.stepper .v { min-width: 32px; text-align: center; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ink); }

/* ── Segmented (tabs-like) ── */
.seg { display: inline-flex; padding: 3px; background: var(--bg-sunk); border: 1px solid var(--line); border-radius: var(--radius-pill); }
.seg button { border: 0; background: transparent; padding: 6px 14px; font-size: 12.5px; font-weight: 500; border-radius: var(--radius-pill); cursor: pointer; color: var(--ink-2); }
.seg button.is-on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,.08); }

/* ── Progress ── */
.bar { height: 4px; background: var(--bg-sunk); border-radius: 2px; overflow: hidden; }
.bar > span { display: block; height: 100%; background: var(--accent); border-radius: 2px; transition: width .3s; }
.bar.warn > span { background: var(--warn); }
.bar.danger > span { background: var(--danger); }
.bar.good > span { background: var(--good); }

/* ── Money ── */
.money { font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.money-xl { font-size: 30px; font-weight: 600; letter-spacing: -.02em; line-height: 1; }
.money-xl small { font-size: 14px; font-weight: 400; color: var(--ink-2); margin-left: 2px; }

/* spinner */
.spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

(function inject() {
  if (document.getElementById('prim-css')) return;
  const s = document.createElement('style');
  s.id = 'prim-css';
  s.textContent = PRIM_CSS;
  document.head.appendChild(s);
})();

function Btn({ variant = "secondary", size = "md", icon, arrow, block, children, ...rest }) {
  const cls = `btn btn-${size} btn-${variant} ${block ? "btn-block" : ""}`;
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
      {arrow && <span className="arr"><I.ChevRight size={14} /></span>}
    </button>
  );
}

function Pill({ tone = "neutral", icon, dot = true, children }) {
  return (
    <span className={`pill pill-${tone}`}>
      {icon ? icon : (dot ? <span className="dot" /> : null)}
      {children}
    </span>
  );
}

function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-h">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          {action && <div className="right">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function Banner({ tone = "info", icon, title, children }) {
  return (
    <div className={`banner banner-${tone}`}>
      <div className="b-ico">{icon || <I.Info size={16} />}</div>
      <div className="b-body">
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return <button className="tgl" data-on={!!on} onClick={() => onChange?.(!on)} aria-pressed={!!on} />;
}

function Stepper({ value, min = 0, max = 99, onChange }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange?.(Math.max(min, value - 1))} disabled={value <= min}><I.ChevLeft size={12} /></button>
      <div className="v">{value}</div>
      <button onClick={() => onChange?.(Math.min(max, value + 1))} disabled={value >= max}><I.ChevRight size={12} /></button>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (<button key={v} className={value === v ? "is-on" : ""} onClick={() => onChange?.(v)}>{l}</button>);
      })}
    </div>
  );
}

function Progress({ value = 0, tone }) {
  return <div className={`bar ${tone || ""}`}><span style={{ width: Math.min(100, Math.max(0, value)) + "%" }} /></div>;
}

// State pill — semantic mapping
function StatusPill({ state }) {
  const map = {
    trial:        { tone: "warn",     label: "Trial" },
    active:       { tone: "good",     label: "Active" },
    pending_inc:  { tone: "info",     label: "Pending change" },
    pending_dec:  { tone: "info",     label: "Pending change" },
    scheduled:    { tone: "warn",     label: "Cancels at period end" },
    past_due:     { tone: "danger",   label: "Past due" },
    canceled:     { tone: "neutral",  label: "Canceled" },
    lifetime:     { tone: "accent",   label: "Lifetime access" },
    inactive:     { tone: "neutral",  label: "No subscription" },
  }[state] || { tone: "neutral", label: state };
  return <Pill tone={map.tone}>{map.label}</Pill>;
}

Object.assign(window, { Btn, Pill, Card, Banner, Toggle, Stepper, Segmented, Progress, StatusPill });

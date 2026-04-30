// Shell — sidebar, topbar, page wrapper. Matched to real Inno app.

const SHELL_CSS = `
.app { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; background: #fff; }
.app.sidebar-collapsed { grid-template-columns: 64px 1fr; }

/* ── Sidebar ── */
.sb { background: #fff; border-right: 1px solid var(--line); display: flex; flex-direction: column; padding: 16px 12px; position: sticky; top: 0; height: 100vh; }
.sb-brand { display: flex; align-items: center; gap: 10px; padding: 6px 8px 18px; }
.sb-brand .biz { display: flex; flex-direction: column; min-width: 0; }
.sb-brand .biz .nm { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-brand .icon-toggle { margin-left: auto; padding: 4px; color: var(--ink-3); border: 0; background: transparent; cursor: pointer; border-radius: 6px; }
.sb-brand .icon-toggle:hover { background: var(--bg-sunk); color: var(--ink-1); }
.sb-nav { display: flex; flex-direction: column; gap: 1px; }
.sb-item { display: flex; align-items: center; gap: 12px; padding: 8px 10px; color: var(--ink-1); font-size: 13.5px; font-weight: 500; border-radius: 8px; cursor: default; user-select: none; position: relative; }
.sb-item:hover { background: var(--bg-sunk); }
.sb-item.is-active { color: var(--accent); }
.sb-item.is-active::before { content: ''; position: absolute; left: -12px; top: 6px; bottom: 6px; width: 2px; background: var(--accent); border-radius: 2px; }
.sb-item .ico { color: inherit; flex-shrink: 0; }
.sb-item .chev { margin-left: auto; color: var(--ink-3); }
.sb-children { display: flex; flex-direction: column; padding-left: 36px; gap: 1px; padding-top: 2px; padding-bottom: 4px; }
.sb-child { padding: 6px 10px; font-size: 13px; color: var(--ink-2); border-radius: 6px; cursor: default; }
.sb-child.is-active { color: var(--accent); font-weight: 500; }
.sb-child:hover { background: var(--bg-sunk); }

.sb-foot { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); display: flex; align-items: center; gap: 4px; }
.sb-foot .pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border: 0; background: transparent; border-radius: 6px; cursor: pointer; font-size: 12px; color: var(--ink-1); font-family: inherit; }
.sb-foot .pill-btn:hover { background: var(--bg-sunk); }
.sb-foot .bell { position: relative; margin-left: auto; padding: 6px; border-radius: 6px; background: transparent; border: 0; cursor: pointer; color: var(--ink-1); }
.sb-foot .bell:hover { background: var(--bg-sunk); }
.sb-foot .bell .badge { position: absolute; top: 2px; right: 2px; min-width: 14px; height: 14px; padding: 0 4px; background: var(--danger); color: #fff; border-radius: 999px; font-size: 9.5px; font-weight: 600; display: grid; place-items: center; line-height: 1; }
.sb-foot .logout { display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; font-size: 12px; color: var(--ink-1); cursor: pointer; border-radius: 6px; background: transparent; border: 0; font-family: inherit; }
.sb-foot .logout:hover { background: var(--bg-sunk); }

/* ── Main ── */
.main { display: flex; flex-direction: column; min-width: 0; }

/* Topbar — Account / Profile-Billing tabs */
.tb { display: flex; align-items: center; padding: 0 28px; height: 56px; border-bottom: 1px solid var(--line); background: #fff; gap: 24px; position: sticky; top: 0; z-index: 5; }
.tb-tabs { display: flex; align-items: center; gap: 4px; }
.tb-tab { padding: 8px 16px; font-size: 13.5px; font-weight: 500; color: var(--ink-2); cursor: default; border-radius: var(--radius-pill); }
.tb-tab.is-active { background: var(--bg-sunk); color: var(--ink); }
.tb-spacer { flex: 1; }
.tb-crumbs { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--ink-3); }
.tb-crumbs strong { color: var(--ink); font-weight: 500; }

/* Page */
.page { padding: 28px; max-width: 1280px; width: 100%; margin: 0 auto; }
.page-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 20px; }
.page-h h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -.02em; color: var(--ink); }
.page-h p { margin: 4px 0 0; color: var(--ink-2); font-size: 13.5px; max-width: 60ch; line-height: 1.5; }
.page-h .actions { display: flex; gap: 8px; flex-shrink: 0; }

/* Two-col grid */
.grid-2 { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.grid-2 > .col { display: flex; flex-direction: column; gap: var(--gap-card); }
@media (max-width: 1100px) { .grid-2 { grid-template-columns: 1fr; } }

.grid-stack { display: flex; flex-direction: column; gap: var(--gap-card); }
`;

(function inject() {
  if (document.getElementById('shell-css')) return;
  const s = document.createElement('style');
  s.id = 'shell-css';
  s.textContent = SHELL_CSS;
  document.head.appendChild(s);
})();

function Sidebar() {
  const items = [
    { id: "dash", label: "Dashboard", icon: <I.Dashboard size={16} /> },
    { id: "cal", label: "Calendar", icon: <I.Calendar size={16} /> },
    { id: "cust", label: "Customers", icon: <I.Users size={16} /> },
    { id: "asg", label: "Assignments", icon: <I.Layers size={16} /> },
    { id: "team", label: "Team Members", icon: <I.User size={16} /> },
    { id: "svc", label: "Services", icon: <I.Briefcase size={16} />, expandable: true },
    { id: "loc", label: "Locations", icon: <I.Pin size={16} /> },
    { id: "mkt", label: "Marketplace", icon: <I.Map size={16} />, expandable: true },
    { id: "sup", label: "Support", icon: <I.Help size={16} /> },
    { id: "acc", label: "Account", icon: <I.User size={16} />, expandable: true, expanded: true,
      children: [{ id: "profile", label: "Profile" }, { id: "billing", label: "Billing & Subscription", active: true }] },
  ];
  return (
    <aside className="sb">
      <div className="sb-brand">
        <I.Inno size={20} />
        <div className="biz"><span className="nm">Ted business</span></div>
        <button className="icon-toggle" title="Collapse"><I.Sidebar size={16} /></button>
      </div>
      <nav className="sb-nav">
        {items.map((it) => (
          <React.Fragment key={it.id}>
            <div className={`sb-item ${it.id === "acc" ? "is-active" : ""}`}>
              <span className="ico">{it.icon}</span>
              <span>{it.label}</span>
              {it.expandable && <span className="chev"><I.Chevron size={12} style={{ transform: it.expanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform .15s" }} /></span>}
            </div>
            {it.children && it.expanded && (
              <div className="sb-children">
                {it.children.map((c) => (
                  <div key={c.id} className={`sb-child ${c.active ? "is-active" : ""}`}>{c.label}</div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="sb-foot">
        <button className="pill-btn"><I.Sun size={13} /> Light</button>
        <button className="pill-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-flex" }}><I.Globe size={13} /></span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>EN</span>
        </button>
        <button className="bell"><I.Bell size={15} /><span className="badge">3</span></button>
      </div>
      <button className="logout" style={{ marginTop: 6 }}><I.LogOut size={13} /> Log Out</button>
    </aside>
  );
}

function Topbar() {
  return (
    <div className="tb">
      <div className="tb-tabs">
        <div className="tb-tab">Profile</div>
        <div className="tb-tab is-active">Billing & Subscription</div>
      </div>
      <div className="tb-spacer" />
      <div className="tb-crumbs">
        <span>Account</span>
        <I.ChevRight size={12} />
        <strong>Billing & Subscription</strong>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;

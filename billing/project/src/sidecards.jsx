// Side cards — Plan & usage, SMS, History. Real-app vocabulary.

const SIDE_CSS = `
/* Plan & usage — three-tile layout, more visual */
.usage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--line); }
.usage-tile { background: #fff; padding: 14px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; }
.usage-tile.span-2 { grid-column: 1 / -1; }
.usage-tile-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.usage-tile-head .name { font-size: 12px; font-weight: 600; color: var(--ink-2); letter-spacing: .02em; }
.usage-tile-head .tag { font-size: 10.5px; padding: 2px 7px; border-radius: 4px; font-weight: 500; letter-spacing: .02em; }
.usage-tile-head .tag-ok { background: var(--good-soft); color: var(--good); }
.usage-tile-head .tag-warn { background: var(--warn-soft); color: var(--warn); }
.usage-tile-head .tag-info { background: var(--bg-sunk); color: var(--ink-2); }
.usage-tile .figure { display: flex; align-items: baseline; gap: 4px; line-height: 1; margin-top: auto; margin-bottom: 4px; }
.usage-tile .figure .num { font-size: 28px; font-weight: 600; letter-spacing: -.02em; color: var(--ink); font-variant-numeric: tabular-nums; }
.usage-tile .figure .denom { font-size: 14px; color: var(--ink-3); font-variant-numeric: tabular-nums; font-weight: 500; }
.usage-tile .figure .unit { font-size: 12px; color: var(--ink-3); margin-left: 2px; }
.usage-tile .meta { font-size: 12px; color: var(--ink-3); }
.usage-tile .meta strong { font-weight: 600; color: var(--ink-1); }
.usage-tile .bar-track { height: 5px; background: var(--bg-sunk); border-radius: 3px; overflow: hidden; }
.usage-tile .bar-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width .3s ease; }
.usage-tile .bar-fill.tone-warn { background: var(--warn); }
.usage-tile .bar-fill.tone-good { background: var(--good); }

/* Mini sparkline / dot pattern for SMS */
.usage-tile .dotrow { display: flex; gap: 2px; flex-wrap: nowrap; align-items: center; height: 10px; }
.usage-tile .dotrow span { flex: 1; height: 6px; border-radius: 1px; background: var(--bg-sunk); }
.usage-tile .dotrow span.on { background: var(--accent); opacity: .85; }
.usage-tile .dotrow span.on.tone-warn { background: var(--warn); }

/* Footer link row */
.usage-foot { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px dashed var(--line); font-size: 12px; color: var(--ink-3); }
.usage-foot strong { color: var(--ink-1); font-weight: 600; }

/* SMS — pricing-ladder rows */
.sms-balance-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius); margin-bottom: 16px; background: var(--bg-sunk); }
.sms-balance-bar .b-l { display: flex; flex-direction: column; gap: 2px; }
.sms-balance-bar .b-l .lbl { font-size: 10.5px; font-weight: 600; color: var(--ink-3); letter-spacing: .07em; text-transform: uppercase; }
.sms-balance-bar .b-l .val { font-size: 22px; font-weight: 600; letter-spacing: -.02em; font-variant-numeric: tabular-nums; line-height: 1.1; color: var(--ink); }
.sms-balance-bar .b-l .val small { font-size: 12px; font-weight: 500; color: var(--ink-3); margin-left: 4px; }
.sms-balance-bar .b-r { font-size: 11.5px; color: var(--ink-3); text-align: right; }
.sms-balance-bar .b-r strong { font-weight: 600; color: var(--ink-1); }

.sms-packs-label { font-size: 10.5px; font-weight: 600; color: var(--ink-3); letter-spacing: .07em; text-transform: uppercase; margin-bottom: 8px; }
.sms-packs { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; background: #fff; }
.sms-pack { padding: 14px 16px; cursor: pointer; transition: background .12s; position: relative; display: grid; grid-template-columns: 22px 1fr auto auto; gap: 14px; align-items: center; border-bottom: 1px solid var(--line); }
.sms-pack:last-child { border-bottom: 0; }
.sms-pack:hover { background: var(--bg-sunk); }
.sms-pack.is-sel { background: var(--bg-soft-accent); }
.sms-pack .radio { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--line-strong); background: #fff; flex-shrink: 0; display: grid; place-items: center; transition: all .12s; }
.sms-pack.is-sel .radio { border-color: var(--accent); background: var(--accent); }
.sms-pack.is-sel .radio::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.sms-pack .pack-l { display: flex; flex-direction: column; gap: 2px; }
.sms-pack .pack-count { font-size: 15px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; letter-spacing: -.01em; display: flex; align-items: center; gap: 8px; }
.sms-pack .pack-count small { font-size: 11px; font-weight: 500; color: var(--ink-3); letter-spacing: 0; }
.sms-pack .pack-badge { font-size: 9.5px; font-weight: 600; padding: 2px 6px; border-radius: 3px; letter-spacing: .05em; text-transform: uppercase; background: var(--accent-soft); color: var(--accent-deep); }
.sms-pack .pack-savings { font-size: 11.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.sms-pack .pack-savings .save { color: var(--good); font-weight: 500; }
.sms-pack .pack-rate { text-align: right; font-size: 12px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.sms-pack .pack-rate strong { display: block; font-size: 14px; color: var(--ink); font-weight: 600; letter-spacing: -.01em; }
.sms-pack .pack-price { text-align: right; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ink); padding-left: 4px; min-width: 56px; letter-spacing: -.01em; }

.sms-buy-row { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; gap: 12px; flex-wrap: wrap; }
.sms-buy-row .info { font-size: 11.5px; color: var(--ink-3); display: flex; align-items: center; gap: 6px; }
.sms-buy-row .info svg { color: var(--ink-3); }

/* History rows — invoice-style with hover affordance */
.hist-row { display: grid; grid-template-columns: auto 1fr auto auto; gap: 14px; align-items: center; padding: 12px 4px; border-bottom: 1px dashed var(--line); font-size: 13px; transition: background .12s; border-radius: 6px; }
.hist-row:hover { background: var(--bg-sunk); }
.hist-row:last-child { border-bottom: 0; }
.hist-row .hist-ico { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-sunk); color: var(--ink-2); display: grid; place-items: center; flex-shrink: 0; }
.hist-row.is-failed .hist-ico { background: var(--danger-soft); color: var(--danger); }
.hist-row.is-refunded .hist-ico { background: var(--bg-sunk); color: var(--ink-3); }
.hist-mid .l1 { font-weight: 500; color: var(--ink); }
.hist-mid .l2 { font-size: 11.5px; color: var(--ink-3); margin-top: 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hist-mid .inv { font-family: ui-monospace, Menlo, monospace; font-size: 10.5px; padding: 1px 5px; background: var(--bg-sunk); border-radius: 3px; color: var(--ink-2); }
.hist-amt { font-weight: 600; font-variant-numeric: tabular-nums; font-size: 14px; }
.hist-amt.is-refunded { color: var(--ink-3); text-decoration: line-through; }
.hist-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--radius-sm); margin-bottom: 14px; overflow: hidden; }
.hist-summary > div { background: #fff; padding: 12px 14px; }
.hist-summary .lbl { font-size: 10.5px; font-weight: 600; color: var(--ink-3); letter-spacing: .07em; text-transform: uppercase; }
.hist-summary .val { font-size: 17px; font-weight: 600; color: var(--ink); margin-top: 4px; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.hist-summary .val small { font-size: 11px; font-weight: 500; color: var(--ink-3); margin-left: 3px; }
.empty-state { padding: 28px 12px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-state .e-ico { width: 44px; height: 44px; border-radius: 12px; background: var(--bg-sunk); color: var(--ink-3); display: grid; place-items: center; }
.empty-state h4 { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink); }
.empty-state p { margin: 0; font-size: 12.5px; color: var(--ink-2); max-width: 32ch; line-height: 1.5; }

/* Plan compare — quiet pricing column layout */
.plan-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 6px; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; background: #fff; }
.plan-card { padding: 22px 20px 20px; position: relative; display: flex; flex-direction: column; gap: 16px; transition: background .15s; border-right: 1px solid var(--line); }
.plan-card:last-child { border-right: 0; }
.plan-card.is-current { background: var(--bg-sunk); }
.plan-card.is-current::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--ink); }
.plan-card.is-rec::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--accent); }
.plan-card .pl-tag { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
.plan-card.is-current .pl-tag { color: var(--ink); }
.plan-card.is-rec .pl-tag { color: var(--accent); }
.plan-card .pl-head { display: flex; flex-direction: column; gap: 4px; }
.plan-card .pl-name { font-size: 17px; font-weight: 600; color: var(--ink); letter-spacing: -.01em; }
.plan-card .pl-tag-line { font-size: 12px; color: var(--ink-3); line-height: 1.45; }
.plan-card .pl-price-row { display: flex; align-items: baseline; gap: 6px; padding-bottom: 14px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.plan-card .pl-price { font-size: 30px; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; line-height: 1; color: var(--ink); }
.plan-card .pl-price-unit { font-size: 12px; font-weight: 500; color: var(--ink-3); letter-spacing: 0; }
.plan-card .pl-feats { font-size: 12.5px; color: var(--ink-1); display: flex; flex-direction: column; gap: 9px; line-height: 1.4; }
.plan-card .pl-feats span { display: flex; align-items: flex-start; gap: 9px; }
.plan-card .pl-feats span::before { content: ''; width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none' stroke='%239A9A9A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 7 6 10 11 4'/></svg>"); background-repeat: no-repeat; }
.plan-card.is-current .pl-feats span::before, .plan-card.is-rec .pl-feats span::before { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none' stroke='%23111111' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 7 6 10 11 4'/></svg>"); }
.plan-card .pl-cta { margin-top: auto; padding-top: 4px; }
.plan-foot { margin-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--ink-3); flex-wrap: wrap; gap: 8px; }
.plan-foot .seat-note { display: inline-flex; align-items: center; gap: 6px; }
.plan-foot .seat-note strong { font-weight: 600; color: var(--ink-1); }
.plan-foot .total { color: var(--ink-2); }
.plan-foot .total strong { font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
`;
(function inject() {
  if (document.getElementById('side-css')) return;
  const s = document.createElement('style');
  s.id = 'side-css';
  s.textContent = SIDE_CSS;
  document.head.appendChild(s);
})();

// ── Plan & Usage ──
function PlanUsageCard({ state, ctx }) {
  const { plan, seats, locationsUsed, membersUsed, smsBalance, smsAvgPerMonth } = ctx;
  const seatPct = seats === 0 ? 0 : (membersUsed / seats) * 100;
  const locPct  = (locationsUsed / plan.locations) * 100;
  const isTrial = state === "trial";
  const isInactive = state === "inactive";

  const locTone = locPct >= 100 ? "warn" : locPct >= 80 ? "warn" : "ok";
  const seatTone = seatPct >= 100 ? "warn" : seatPct >= 80 ? "warn" : "ok";

  // SMS dot row — 12 dots showing relative balance
  const smsCap = Math.max(smsBalance, smsAvgPerMonth || 100, 100);
  const smsRatio = smsBalance / smsCap;
  const smsLow = smsAvgPerMonth && smsBalance < smsAvgPerMonth;
  const smsDots = Array.from({ length: 12 }, (_, i) => i / 12 < smsRatio);
  const smsRunsOut = smsAvgPerMonth && smsBalance > 0
    ? Math.floor(smsBalance / (smsAvgPerMonth / 30))
    : null;

  return (
    <Card title="Plan & usage" subtitle="What's used this billing period."
      action={!isInactive && <Btn variant="ghost" size="sm" icon={<I.External size={12} />}>Usage history</Btn>}>
      <div className="usage-grid">
        <div className="usage-tile">
          <div className="usage-tile-head">
            <div className="name">Locations</div>
            <span className={`tag tag-${locTone === "warn" ? "warn" : "ok"}`}>
              {locPct >= 100 ? "Full" : locPct >= 80 ? "Near limit" : `${Math.round(locPct)}%`}
            </span>
          </div>
          <div className="figure">
            <span className="num">{locationsUsed}</span>
            <span className="denom">/ {plan.locations}</span>
          </div>
          <div className="bar-track">
            <div className={`bar-fill ${locTone === "warn" ? "tone-warn" : "tone-good"}`} style={{ width: `${Math.min(locPct, 100)}%` }} />
          </div>
          <div className="meta">{plan.locations - locationsUsed > 0 ? <><strong>{plan.locations - locationsUsed}</strong> more available</> : "Limit reached"}</div>
        </div>

        <div className="usage-tile">
          <div className="usage-tile-head">
            <div className="name">Team seats</div>
            {isTrial ? <span className="tag tag-info">Unlimited</span> : <span className={`tag tag-${seatTone === "warn" ? "warn" : "ok"}`}>
              {seatPct >= 100 ? "Full" : `${Math.round(seatPct)}%`}
            </span>}
          </div>
          <div className="figure">
            {isTrial ? (
              <><span className="num" style={{ fontSize: 28 }}>∞</span><span className="unit">trial</span></>
            ) : (
              <><span className="num">{membersUsed}</span><span className="denom">/ {seats}</span></>
            )}
          </div>
          {isTrial ? (
            <div style={{ height: 5 }} />
          ) : (
            <div className="bar-track">
              <div className={`bar-fill ${seatTone === "warn" ? "tone-warn" : "tone-good"}`} style={{ width: `${Math.min(seatPct, 100)}%` }} />
            </div>
          )}
          <div className="meta">
            {isTrial ? <>€{SEAT_PRICE}/seat after trial</> :
              seats - membersUsed > 0 ? <><strong>{seats - membersUsed}</strong> seat{seats - membersUsed === 1 ? "" : "s"} unfilled</> :
              <>All seats invited</>}
          </div>
        </div>

        <div className="usage-tile span-2">
          <div className="usage-tile-head">
            <div className="name">SMS credits</div>
            {isTrial ? <span className="tag tag-info">Locked in trial</span> :
             smsBalance === 0 ? <span className="tag tag-warn">Empty</span> :
             smsLow ? <span className="tag tag-warn">Low</span> :
             <span className="tag tag-ok">Healthy</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
            <div className="figure" style={{ marginBottom: 0, marginTop: 0 }}>
              <span className="num">{smsBalance}</span>
              <span className="unit">credits</span>
            </div>
            <div className="dotrow">
              {smsDots.map((on, i) => <span key={i} className={`${on ? "on" : ""} ${smsLow ? "tone-warn" : ""}`} />)}
            </div>
          </div>
          <div className="meta">
            {smsAvgPerMonth ? (
              smsRunsOut !== null ? <>~<strong>{smsAvgPerMonth}</strong>/mo avg{smsRunsOut < 30 ? <> · runs out in <strong>~{smsRunsOut} days</strong></> : null}</> :
              <>~<strong>{smsAvgPerMonth}</strong> sent/month average</>
            ) : "Reminders & notifications"}
          </div>
        </div>
      </div>

      {!isInactive && (
        <div className="usage-foot">
          <span>Cycle resets <strong>{ctx.nextBilling}</strong></span>
          <Btn variant="ghost" size="sm" icon={<I.Bolt size={11} />}>Buy SMS</Btn>
        </div>
      )}
    </Card>
  );
}

// ── Plan compare ──
function PlanCompareCard({ ctx, state }) {
  const totalCurrent = ctx.plan.monthly + ctx.seats * SEAT_PRICE;
  return (
    <Card title="Available plans" subtitle="Switch anytime — proration handled automatically."
      action={<Btn variant="ghost" size="sm" icon={<I.External size={12} />}>Full comparison</Btn>}>
      <div className="plan-grid">
        {Object.entries(PLAN).map(([k, p]) => {
          const isCurrent = ctx.plan.name === p.name && state !== "trial" && state !== "inactive";
          const isRec = !isCurrent && k === "pro";
          const isHigher = ctx.plan.monthly < p.monthly;
          return (
            <div key={k} className={`plan-card ${isCurrent ? "is-current" : ""} ${isRec ? "is-rec" : ""}`}>
              <div className="pl-head">
                {isCurrent ? <span className="pl-tag">Current plan</span> :
                 isRec ? <span className="pl-tag">Recommended</span> :
                 <span className="pl-tag" style={{ visibility: "hidden" }}>—</span>}
                <div className="pl-name">{p.name}</div>
                <div className="pl-tag-line">{p.tagline}</div>
              </div>
              <div className="pl-price-row">
                <span className="pl-price">€{p.monthly}</span>
                <span className="pl-price-unit">/ month</span>
              </div>
              <div className="pl-feats">
                {p.features.map((f, i) => <span key={i}>{f}</span>)}
              </div>
              <div className="pl-cta">
                {isCurrent ? <Btn variant="secondary" size="sm" block>Manage plan</Btn> :
                 isRec ? <Btn variant="accent" size="sm" block arrow>Upgrade to {p.name}</Btn> :
                 isHigher ? <Btn variant="secondary" size="sm" block>Choose {p.name}</Btn> :
                 <Btn variant="secondary" size="sm" block>Switch to {p.name}</Btn>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="plan-foot">
        <span className="seat-note"><I.Info size={12} />Extra seats <strong>€{SEAT_PRICE}/mo</strong> per person</span>
        {state !== "trial" && state !== "inactive" && <span className="total">Currently paying <strong>€{totalCurrent}/mo</strong></span>}
      </div>
    </Card>
  );
}

// ── SMS Credits ──
const SMS_PACKS = [
  { id: "sms100", count: 100, price: 60.00, per: 0.60 },
  { id: "sms300", count: 300, price: 150.00, per: 0.50, badge: "Best value" },
  { id: "sms1000", count: 1000, price: 450.00, per: 0.45, badge: "Bulk" },
];

function SMSCard({ state, ctx }) {
  const [sel, setSel] = React.useState("sms300");
  const trial = state === "trial";
  const inactive = state === "inactive";
  const pack = SMS_PACKS.find((p) => p.id === sel);
  const baseline = SMS_PACKS[0].per;
  return (
    <Card title="SMS credits" subtitle="Appointment reminders & notifications">
      {trial ? (
        <Banner tone="warn" icon={<I.Lock size={16} />} title="SMS locked during trial">Upgrade to send reminders. Packs start at €0.45/SMS.</Banner>
      ) : inactive ? (
        <div className="empty-state">
          <div className="e-ico"><I.SMS size={20} /></div>
          <h4>Subscribe to buy SMS</h4>
          <p>SMS packs unlock once you start a subscription.</p>
        </div>
      ) : (
        <>
          <div className="sms-balance-bar">
            <div className="b-l">
              <div className="lbl">Available credits</div>
              <div className="val">{ctx.smsBalance}<small>SMS</small></div>
            </div>
            <div className="b-r">
              {ctx.smsAvgPerMonth ? <>~<strong>{ctx.smsAvgPerMonth}/mo</strong> avg<br/>Lasts <strong>{Math.max(1, Math.floor(ctx.smsBalance / (ctx.smsAvgPerMonth/30)))} days</strong></> : <>Top up anytime<br/>Credits never expire</>}
            </div>
          </div>
          <div className="sms-packs-label">Top up</div>
          <div className="sms-packs">
            {SMS_PACKS.map((p) => {
              const savings = (baseline - p.per) * p.count;
              return (
                <div key={p.id} className={`sms-pack ${sel === p.id ? "is-sel" : ""}`} onClick={() => setSel(p.id)}>
                  <div className="radio" />
                  <div className="pack-l">
                    <div className="pack-count">{p.count}<small>SMS</small>{p.badge && <span className="pack-badge">{p.badge}</span>}</div>
                    {savings > 0 && <div className="pack-savings"><span className="save">Save €{savings.toFixed(0)}</span> vs. starter pack</div>}
                  </div>
                  <div className="pack-rate"><strong>€{p.per.toFixed(2)}</strong>per SMS</div>
                  <div className="pack-price">€{p.price.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
          <div className="sms-buy-row">
            <div className="info"><I.Info size={12} />One-time charge · added immediately</div>
            <Btn variant="accent" size="md" icon={<I.Bolt size={13} />}>Buy {pack.count} SMS · €{pack.price.toFixed(0)}</Btn>
          </div>
        </>
      )}
    </Card>
  );
}

// ── History ──
function HistoryCard({ ctx }) {
  const items = ctx.history || [];
  const totalPaid = items.filter(i => i.status === "paid").reduce((a, i) => a + i.amount, 0);
  const ytdCount = items.filter(i => i.status === "paid").length;
  const lastPaid = items.find(i => i.status === "paid");

  const iconFor = (it) => {
    if (it.status === "failed") return <I.Alert size={14} />;
    if (it.label?.toLowerCase().includes("sms")) return <I.SMS size={14} />;
    if (it.label?.toLowerCase().includes("subscription")) return <I.Refresh size={14} />;
    return <I.Receipt size={14} />;
  };

  return (
    <Card title="Purchase history"
      action={items.length ? <Btn variant="ghost" size="sm" icon={<I.Download size={12} />}>Export all</Btn> : null}>
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="e-ico"><I.Receipt size={20} /></div>
          <h4>No invoices yet</h4>
          <p>Once you're charged, invoices appear here. PDF copies also go to your email.</p>
        </div>
      ) : (
        <>
          <div className="hist-summary">
            <div>
              <div className="lbl">Total paid</div>
              <div className="val">€{totalPaid.toFixed(2)}</div>
            </div>
            <div>
              <div className="lbl">Invoices</div>
              <div className="val">{ytdCount}<small>this year</small></div>
            </div>
            <div>
              <div className="lbl">Last payment</div>
              <div className="val" style={{ fontSize: 14 }}>{lastPaid ? lastPaid.date : "—"}</div>
            </div>
          </div>
          <div>
            {items.map((it) => (
              <div key={it.id} className={`hist-row is-${it.status}`}>
                <div className="hist-ico">{iconFor(it)}</div>
                <div className="hist-mid">
                  <div className="l1">{it.label}</div>
                  <div className="l2">
                    <span>{it.date}</span>
                    <span className="inv">{it.invoice}</span>
                    {it.status && <Pill tone={it.status === "paid" ? "good" : it.status === "refunded" ? "neutral" : "danger"}>{it.status}</Pill>}
                  </div>
                </div>
                <div className={`hist-amt ${it.status === "refunded" ? "is-refunded" : ""}`}>€{it.amount.toFixed(2)}</div>
                <div style={{ display: "flex", gap: 2 }}>
                  <Btn variant="ghost" size="sm" icon={<I.Download size={12} />} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

Object.assign(window, { PlanUsageCard, PlanCompareCard, SMSCard, HistoryCard, SMS_PACKS });

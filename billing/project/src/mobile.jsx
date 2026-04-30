// Mobile — purpose-built layout, not desktop-squeezed.

const MOB_CSS = `
.m-frame { background: var(--bg-sunk); min-height: 100vh; padding: 24px 0; }
.m-device { max-width: 414px; margin: 0 auto; box-shadow: 0 30px 80px -20px rgba(0,0,0,.2); border-radius: 32px; overflow: hidden; border: 1px solid var(--line); background: #fff; }

.m-shell { background: #fff; min-height: 100vh; padding-bottom: 90px; }

/* Top bar */
.m-top { position: sticky; top: 0; z-index: 5; background: rgba(255,255,255,.96); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); padding: 14px 16px 10px; }
.m-top .row1 { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.m-top .ic-btn { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; color: var(--ink-1); background: transparent; border: 0; cursor: pointer; }
.m-top .ic-btn:hover { background: var(--bg-sunk); }
.m-top h1 { font-size: 17px; font-weight: 600; margin: 0; letter-spacing: -.01em; flex: 1; }
.m-tabs { display: flex; padding: 3px; background: var(--bg-sunk); border-radius: var(--radius-pill); }
.m-tabs button { flex: 1; padding: 7px; background: transparent; border: 0; font-size: 13px; font-weight: 500; color: var(--ink-2); border-radius: var(--radius-pill); font-family: inherit; }
.m-tabs button.is-on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,.08); }

.m-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

/* Mobile hero — confident, tight, intentional */
.mh { position: relative; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-lg); overflow: hidden; }
.mh-band { padding: 18px 18px 16px; background: linear-gradient(180deg, var(--bg-soft-accent) 0%, #fff 100%); border-bottom: 1px solid var(--accent-soft); }
.mh.tone-warn .mh-band   { background: linear-gradient(180deg, #FEF8EC, #fff); border-bottom-color: #F0DCAA; }
.mh.tone-danger .mh-band { background: linear-gradient(180deg, #FEF1EE, #fff); border-bottom-color: #F0BFB2; }
.mh.tone-neutral .mh-band{ background: var(--bg-sunk); border-bottom-color: var(--line); }

.mh-row1 { display: flex; align-items: center; gap: 8px; }
.mh-row1 .label { font-size: 10.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); flex: 1; }
.mh-row2 { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 8px; }
.mh-name { font-size: 22px; font-weight: 600; letter-spacing: -.02em; line-height: 1.15; color: var(--ink); }
.mh-price { display: flex; align-items: baseline; gap: 3px; flex-shrink: 0; }
.mh-price .num { font-size: 28px; font-weight: 700; letter-spacing: -.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.mh-price .per { font-size: 12px; color: var(--ink-2); margin-left: 1px; }
.mh-price.is-danger .num { color: var(--danger); }

/* Trial-specific countdown */
.mh-trial { padding: 16px 18px 14px; }
.mh-trial-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.mh-trial-num { font-size: 36px; font-weight: 700; color: var(--accent); letter-spacing: -.025em; line-height: 1; font-variant-numeric: tabular-nums; }
.mh-trial-num small { font-size: 13px; font-weight: 500; color: var(--ink-2); margin-left: 6px; letter-spacing: 0; }
.mh-trial-end { font-size: 11.5px; color: var(--ink-3); }
.mh-trial-bar { height: 5px; background: rgba(var(--accent-rgb, 217, 119, 87), .15); border-radius: 3px; overflow: hidden; }
.mh-trial-bar > span { display: block; height: 100%; background: var(--accent); border-radius: 3px; }

/* Meta strip — directly under the band, no gap */
.mh-meta { display: grid; grid-template-columns: 1fr 1fr; }
.mh-meta > div { padding: 12px 18px; }
.mh-meta > div + div { border-left: 1px solid var(--line); }
.mh-meta .lbl { font-size: 10px; font-weight: 600; color: var(--ink-3); letter-spacing: .07em; text-transform: uppercase; margin-bottom: 3px; }
.mh-meta .val { font-size: 13.5px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1.2; }

.mh-actions { padding: 14px 16px 16px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px; background: var(--bg-sunk); }

/* Compact card title */
.m-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; }
.m-card-h { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 14px; }
.m-card-h h3 { margin: 0; font-size: 14.5px; font-weight: 600; letter-spacing: -.01em; }
.m-card-h .right { font-size: 12px; color: var(--ink-3); }

/* Mobile cost lines */
.m-line { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px dashed var(--line); font-size: 13.5px; }
.m-line:last-child { border-bottom: 0; }
.m-line .lbl { color: var(--ink-1); }
.m-line .lbl small { display: block; font-size: 11.5px; color: var(--ink-3); margin-top: 2px; font-weight: 400; }
.m-line .val { font-weight: 600; font-variant-numeric: tabular-nums; }
.m-total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 12px; margin-top: 4px; border-top: 1px solid var(--line); }
.m-total .l { font-size: 13px; color: var(--ink-2); }
.m-total .r { font-size: 20px; font-weight: 700; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }

/* Seat row mobile */
.m-seat-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-sunk); border-radius: var(--radius); margin-top: 12px; }
.m-seat-row .l { font-size: 13px; }
.m-seat-row .l strong { display: block; color: var(--ink); font-weight: 600; }
.m-seat-row .l span { color: var(--ink-3); font-size: 11.5px; margin-top: 1px; display: block; }

/* Payment method mobile */
.m-pm { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--line); border-radius: var(--radius); margin-top: 12px; }
.m-pm .pm-mid { flex: 1; min-width: 0; }
.m-pm .l1 { font-size: 13px; font-weight: 500; }
.m-pm .l2 { font-size: 11px; color: var(--ink-3); margin-top: 1px; }

/* Usage rows mobile (no progress sidebar squeeze) */
.m-usage { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px dashed var(--line); }
.m-usage:last-child { border-bottom: 0; padding-bottom: 0; }
.m-usage:first-child { padding-top: 0; }
.m-usage .ic { width: 30px; height: 30px; border-radius: 8px; background: var(--bg-sunk); display: grid; place-items: center; color: var(--ink-1); flex-shrink: 0; }
.m-usage .mid { flex: 1; min-width: 0; }
.m-usage .mid .l1 { font-size: 13px; font-weight: 500; }
.m-usage .mid .bar { margin-top: 5px; }
.m-usage .mid .l2 { font-size: 11.5px; color: var(--ink-3); margin-top: 3px; }
.m-usage .r { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.m-usage .r small { display: block; font-size: 10.5px; font-weight: 400; color: var(--ink-3); margin-top: 1px; }

/* Plan compare — horizontal scroll on mobile */
/* Plan compare — single-column stacked, restrained */
.m-plans { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; background: #fff; }
.m-plan { padding: 16px; position: relative; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 12px; }
.m-plan:last-child { border-bottom: 0; }
.m-plan.is-cur { background: var(--bg-sunk); }
.m-plan.is-cur::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 2px; background: var(--ink); }
.m-plan.is-rec::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 2px; background: var(--accent); }
.m-plan-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.m-plan-l { min-width: 0; flex: 1; }
.m-plan-tag { font-size: 9.5px; font-weight: 600; color: var(--ink-3); letter-spacing: .07em; text-transform: uppercase; margin-bottom: 4px; }
.m-plan.is-cur .m-plan-tag { color: var(--ink); }
.m-plan.is-rec .m-plan-tag { color: var(--accent); }
.m-plan-name { font-size: 16px; font-weight: 600; letter-spacing: -.01em; line-height: 1.2; }
.m-plan-tagline { font-size: 11.5px; color: var(--ink-3); margin-top: 2px; line-height: 1.4; }
.m-plan-price-block { text-align: right; flex-shrink: 0; }
.m-plan-price { font-size: 22px; font-weight: 600; letter-spacing: -.025em; line-height: 1; font-variant-numeric: tabular-nums; }
.m-plan-price-unit { font-size: 11px; color: var(--ink-3); margin-top: 4px; }
.m-plan-feats { font-size: 12px; color: var(--ink-1); display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; line-height: 1.4; }
.m-plan-feats span { display: flex; align-items: flex-start; gap: 6px; }
.m-plan-feats span::before { content: ''; width: 12px; height: 12px; flex-shrink: 0; margin-top: 2px; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%239A9A9A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='2 6 5 9 10 3'/></svg>"); background-repeat: no-repeat; }
.m-plan.is-cur .m-plan-feats span::before, .m-plan.is-rec .m-plan-feats span::before { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%23111111' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><polyline points='2 6 5 9 10 3'/></svg>"); }
.m-plans-foot { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--ink-3); flex-wrap: wrap; gap: 6px; }
.m-plans-foot strong { font-weight: 600; color: var(--ink-1); }

/* SMS — balance bar + ladder rows */
.m-sms-balance { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); margin-bottom: 12px; background: var(--bg-sunk); }
.m-sms-balance .lbl { font-size: 9.5px; font-weight: 600; color: var(--ink-3); letter-spacing: .07em; text-transform: uppercase; }
.m-sms-balance .val { font-size: 19px; font-weight: 600; letter-spacing: -.02em; font-variant-numeric: tabular-nums; line-height: 1.1; margin-top: 1px; }
.m-sms-balance .val small { font-size: 11px; font-weight: 500; color: var(--ink-3); margin-left: 4px; }
.m-sms-balance .runs { font-size: 10.5px; color: var(--ink-3); text-align: right; line-height: 1.4; }
.m-sms-balance .runs strong { font-weight: 600; color: var(--ink-1); }

.m-sms-label { font-size: 9.5px; font-weight: 600; color: var(--ink-3); letter-spacing: .07em; text-transform: uppercase; margin-bottom: 6px; }
.m-sms-packs { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; background: #fff; }
.m-sms-pack { display: grid; grid-template-columns: 18px 1fr auto; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border-bottom: 1px solid var(--line); transition: background .12s; }
.m-sms-pack:last-child { border-bottom: 0; }
.m-sms-pack.is-sel { background: var(--bg-soft-accent); }
.m-sms-pack .radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--line-strong); background: #fff; flex-shrink: 0; display: grid; place-items: center; }
.m-sms-pack.is-sel .radio { border-color: var(--accent); background: var(--accent); }
.m-sms-pack.is-sel .radio::after { content: ''; width: 5px; height: 5px; border-radius: 50%; background: white; }
.m-sms-pack .pl { min-width: 0; }
.m-sms-pack .pl .t { font-size: 13.5px; font-weight: 600; display: flex; align-items: center; gap: 6px; letter-spacing: -.005em; font-variant-numeric: tabular-nums; }
.m-sms-pack .pl .t small { font-size: 10.5px; font-weight: 500; color: var(--ink-3); letter-spacing: 0; }
.m-sms-pack .pl .t .badge { font-size: 9px; font-weight: 600; padding: 2px 5px; border-radius: 3px; letter-spacing: .04em; text-transform: uppercase; background: var(--accent-soft); color: var(--accent-deep); }
.m-sms-pack .pl .s { font-size: 10.5px; color: var(--ink-3); margin-top: 2px; font-variant-numeric: tabular-nums; }
.m-sms-pack .pl .s .save { color: var(--good); font-weight: 500; }
.m-sms-pack .pr { display: flex; flex-direction: column; align-items: flex-end; gap: 0; }
.m-sms-pack .pr .price { font-size: 14.5px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
.m-sms-pack .pr .rate { font-size: 10px; color: var(--ink-3); font-variant-numeric: tabular-nums; }

/* History */
.m-hist { padding: 11px 0; border-bottom: 1px dashed var(--line); display: flex; justify-content: space-between; gap: 10px; }
.m-hist:last-child { border-bottom: 0; }
.m-hist .l1 { font-size: 13px; font-weight: 500; }
.m-hist .l2 { font-size: 11.5px; color: var(--ink-3); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.m-hist .a { font-size: 13.5px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; flex-shrink: 0; }

/* Tab bar */
.m-tabbar { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,.97); backdrop-filter: blur(12px); border-top: 1px solid var(--line); display: grid; grid-template-columns: repeat(5, 1fr); padding: 8px 4px 14px; }
.m-tab { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 10.5px; color: var(--ink-3); padding: 4px; }
.m-tab.is-active { color: var(--accent); }

/* Section divider with title */
.m-section-h { font-size: 11px; font-weight: 600; letter-spacing: .08em; color: var(--ink-3); text-transform: uppercase; padding: 6px 2px 0; }

/* trial bar mobile */
.m-trial-bar { height: 6px; background: var(--bg-sunk); border-radius: 3px; overflow: hidden; margin-top: 8px; }
.m-trial-bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--warn)); border-radius: 3px; }
`;
(function inject() {
  if (document.getElementById('mob-css')) return;
  const s = document.createElement('style');
  s.id = 'mob-css';
  s.textContent = MOB_CSS;
  document.head.appendChild(s);
})();

// Derive primary action button per state
function MobileHero({ state, ctx, onAction }) {
  const tone = state === "past_due" ? "tone-danger" : (state === "trial" || state === "scheduled") ? "tone-warn" : (state === "canceled" || state === "inactive") ? "tone-neutral" : "";
  const baseLine = state === "lifetime" ? 0 : ctx.plan.monthly;
  const total = baseLine + ctx.seats * SEAT_PRICE;

  let actions = [];
  if (state === "trial")     actions = [<Btn key="up" variant="accent" size="lg" block arrow onClick={() => onAction("upgrade")}>Upgrade · €{ctx.plan.monthly}/mo</Btn>, <Btn key="cmp" variant="ghost" size="md" block>Compare plans</Btn>];
  if (state === "active")    actions = [<Btn key="pm" variant="secondary" size="md" block icon={<I.Card size={14} />} onClick={() => onAction("payment")}>Manage payment</Btn>];
  if (state === "past_due")  actions = [<Btn key="pay" variant="accent" size="lg" block icon={<I.Card size={14} />} onClick={() => onAction("retry")}>Pay €{ctx.amountDue.toFixed(2)} now</Btn>, <Btn key="upd" variant="secondary" size="md" block>Update card</Btn>];
  if (state === "canceled")  actions = [<Btn key="rn" variant="accent" size="lg" block arrow onClick={() => onAction("renew")}>Renew subscription</Btn>];
  if (state === "scheduled") actions = [<Btn key="kp" variant="accent" size="md" block onClick={() => onAction("keep")}>Keep my subscription</Btn>];
  if (state === "inactive")  actions = [<Btn key="st" variant="accent" size="lg" block arrow onClick={() => onAction("start")}>Start · €{ctx.plan.monthly}/mo</Btn>];
  if (state === "lifetime")  actions = [<Btn key="pm" variant="secondary" size="md" block icon={<I.Card size={14} />}>Manage payment</Btn>];
  if (state === "pending_inc" || state === "pending_dec") actions = [<Btn key="rv" variant="secondary" size="md" block onClick={() => onAction("revert")}>Revert change</Btn>];

  const showPrice = state !== "trial" && state !== "inactive" && state !== "canceled" && state !== "past_due";

  return (
    <div className={`mh ${tone}`}>
      <div className="mh-band">
        <div className="mh-row1">
          <span className="label">Current plan</span>
          <StatusPill state={state} />
        </div>

        {state === "trial" ? null : (
          <div className="mh-row2">
            <div className="mh-name">{ctx.plan.name}</div>
            {showPrice && (
              <div className="mh-price">
                <span className="num">€{total}</span>
                <span className="per">/mo</span>
              </div>
            )}
            {state === "past_due" && (
              <div className="mh-price is-danger">
                <span className="num">€{ctx.amountDue.toFixed(2)}</span>
                <span className="per">due</span>
              </div>
            )}
            {(state === "inactive" || state === "canceled") && (
              <div className="mh-price">
                <span className="per" style={{ fontSize: 13 }}>{state === "canceled" ? `Ended ${ctx.nextBilling}` : "Not subscribed"}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {state === "trial" && (
        <div className="mh-trial">
          <div className="mh-row2" style={{ marginTop: 0, marginBottom: 14 }}>
            <div className="mh-name">{ctx.plan.name}</div>
            <div className="mh-price"><span className="num">€{ctx.plan.monthly}</span><span className="per">/mo after</span></div>
          </div>
          <div className="mh-trial-row">
            <div><span className="mh-trial-num">{ctx.trialDaysLeft}<small>days left</small></span></div>
            <span className="mh-trial-end">Ends {ctx.trialEnds}</span>
          </div>
          <div className="mh-trial-bar"><span style={{ width: `${100 - (ctx.trialDaysLeft / 14) * 100}%` }} /></div>
        </div>
      )}

      <div className="mh-meta">
        <div>
          <div className="lbl">{state === "scheduled" ? "Active until" : state === "canceled" ? "Ended" : state === "trial" ? "Trial ends" : state === "lifetime" ? "Plan" : "Next billing"}</div>
          <div className="val">{state === "trial" ? ctx.trialEnds : state === "inactive" ? "—" : state === "lifetime" ? "Lifetime" : ctx.nextBilling}</div>
        </div>
        <div>
          <div className="lbl">Seats</div>
          <div className="val">{state === "trial" ? "Unlimited" : `${ctx.membersUsed} / ${ctx.seats}`}</div>
        </div>
      </div>

      <div className="mh-actions">{actions}</div>
    </div>
  );
}

// Lightweight mobile cost breakdown
function MobileCostCard({ state, ctx }) {
  if (state === "inactive" || state === "canceled") return null;
  const baseLine = state === "lifetime" ? 0 : ctx.plan.monthly;
  const seatLine = ctx.seats * SEAT_PRICE;
  const total = baseLine + seatLine;
  const isTrial = state === "trial";
  const isLifetime = state === "lifetime";

  return (
    <div className="m-card">
      <div className="m-card-h"><h3>Cost breakdown</h3></div>
      <div className="m-line">
        <div className="lbl">{ctx.plan.name} plan<small>{ctx.plan.locations} locations</small></div>
        <div className="val">€{baseLine.toFixed(2)}</div>
      </div>
      {!isTrial && !isLifetime && (
        <div className="m-line">
          <div className="lbl">Team seats<small>{ctx.seats} × €{SEAT_PRICE.toFixed(2)}</small></div>
          <div className="val">€{seatLine.toFixed(2)}</div>
        </div>
      )}
      {isLifetime && (
        <div className="m-line">
          <div className="lbl">Team seats<small>Included</small></div>
          <div className="val" style={{ color: "var(--good)" }}>Free</div>
        </div>
      )}
      <div className="m-total">
        <div className="l">{isTrial ? "After trial" : "Total"}</div>
        <div className="r">€{total.toFixed(2)}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-2)", marginLeft: 2 }}>{isLifetime ? "" : "/mo"}</span></div>
      </div>

      {/* Payment method */}
      {(state === "active" || state === "scheduled" || state === "past_due" || state === "pending_inc" || state === "pending_dec" || state === "lifetime") && (
        <div className="m-pm" style={state === "past_due" ? { borderColor: 'var(--danger-soft)', background: '#FEF7F5' } : null}>
          <div className="pm-brand visa">VISA</div>
          <div className="pm-mid">
            <div className="l1">•••• 4242</div>
            <div className="l2">{state === "past_due" ? <span style={{color:'var(--danger)'}}>Charge failed</span> : "Expires 09/27"}</div>
          </div>
          <Btn variant="ghost" size="sm">Edit</Btn>
        </div>
      )}
    </div>
  );
}

// Compact usage card — three tile design matching desktop
function MobileUsageCard({ state, ctx }) {
  const seatPct = ctx.seats === 0 ? 0 : (ctx.membersUsed / ctx.seats) * 100;
  const locPct = (ctx.locationsUsed / ctx.plan.locations) * 100;
  const isTrial = state === "trial";
  const isInactive = state === "inactive";
  const locTone = locPct >= 80 ? "warn" : "ok";
  const seatTone = seatPct >= 80 ? "warn" : "ok";
  const smsCap = Math.max(ctx.smsBalance, ctx.smsAvgPerMonth || 100, 100);
  const smsRatio = ctx.smsBalance / smsCap;
  const smsLow = ctx.smsAvgPerMonth && ctx.smsBalance < ctx.smsAvgPerMonth;
  const smsDots = Array.from({ length: 12 }, (_, i) => i / 12 < smsRatio);
  const smsRunsOut = ctx.smsAvgPerMonth && ctx.smsBalance > 0
    ? Math.floor(ctx.smsBalance / (ctx.smsAvgPerMonth / 30)) : null;

  return (
    <div className="m-card">
      <div className="m-card-h"><h3>Plan & usage</h3><div className="right">This cycle</div></div>
      <div className="usage-grid">
        <div className="usage-tile">
          <div className="usage-tile-head">
            <div className="name">Locations</div>
            <span className={`tag tag-${locTone === "warn" ? "warn" : "ok"}`}>
              {locPct >= 100 ? "Full" : locPct >= 80 ? "Near limit" : `${Math.round(locPct)}%`}
            </span>
          </div>
          <div className="figure">
            <span className="num">{ctx.locationsUsed}</span>
            <span className="denom">/ {ctx.plan.locations}</span>
          </div>
          <div className="bar-track">
            <div className={`bar-fill ${locTone === "warn" ? "tone-warn" : "tone-good"}`} style={{ width: `${Math.min(locPct, 100)}%` }} />
          </div>
          <div className="meta">{ctx.plan.locations - ctx.locationsUsed > 0 ? <><strong>{ctx.plan.locations - ctx.locationsUsed}</strong> more available</> : "Limit reached"}</div>
        </div>

        <div className="usage-tile">
          <div className="usage-tile-head">
            <div className="name">Team seats</div>
            {isTrial ? <span className="tag tag-info">Unlimited</span> :
             <span className={`tag tag-${seatTone === "warn" ? "warn" : "ok"}`}>{seatPct >= 100 ? "Full" : `${Math.round(seatPct)}%`}</span>}
          </div>
          <div className="figure">
            {isTrial ? (
              <><span className="num">∞</span><span className="unit">trial</span></>
            ) : (
              <><span className="num">{ctx.membersUsed}</span><span className="denom">/ {ctx.seats}</span></>
            )}
          </div>
          {isTrial ? <div style={{ height: 5 }} /> : (
            <div className="bar-track">
              <div className={`bar-fill ${seatTone === "warn" ? "tone-warn" : "tone-good"}`} style={{ width: `${Math.min(seatPct, 100)}%` }} />
            </div>
          )}
          <div className="meta">
            {isTrial ? <>€{SEAT_PRICE}/seat after</> :
              ctx.seats - ctx.membersUsed > 0 ? <><strong>{ctx.seats - ctx.membersUsed}</strong> unfilled</> :
              "All invited"}
          </div>
        </div>

        <div className="usage-tile span-2">
          <div className="usage-tile-head">
            <div className="name">SMS credits</div>
            {isTrial ? <span className="tag tag-info">Locked</span> :
             ctx.smsBalance === 0 ? <span className="tag tag-warn">Empty</span> :
             smsLow ? <span className="tag tag-warn">Low</span> :
             <span className="tag tag-ok">Healthy</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
            <div className="figure" style={{ marginBottom: 0, marginTop: 0 }}>
              <span className="num">{ctx.smsBalance}</span>
              <span className="unit">credits</span>
            </div>
            <div className="dotrow">
              {smsDots.map((on, i) => <span key={i} className={`${on ? "on" : ""} ${smsLow ? "tone-warn" : ""}`} />)}
            </div>
          </div>
          <div className="meta">
            {ctx.smsAvgPerMonth ? (
              smsRunsOut !== null && smsRunsOut < 30 ? <>~<strong>{ctx.smsAvgPerMonth}</strong>/mo · ~<strong>{smsRunsOut} days</strong> left</> :
              <>~<strong>{ctx.smsAvgPerMonth}</strong> sent/month avg</>
            ) : "Reminders & notifications"}
          </div>
        </div>
      </div>
      {!isInactive && (
        <div className="usage-foot">
          <span>Resets <strong>{ctx.nextBilling}</strong></span>
          <Btn variant="ghost" size="sm" icon={<I.Bolt size={11} />}>Buy SMS</Btn>
        </div>
      )}
    </div>
  );
}

// Plan compare — stacked rows
function MobilePlanCompare({ state, ctx }) {
  const totalCurrent = ctx.plan.monthly + ctx.seats * SEAT_PRICE;
  return (
    <div className="m-card">
      <div className="m-card-h">
        <h3>Available plans</h3>
        <Btn variant="ghost" size="sm" icon={<I.External size={11} />}>Details</Btn>
      </div>
      <div className="m-plans">
        {Object.entries(PLAN).map(([k, p]) => {
          const isCurrent = ctx.plan.name === p.name && state !== "trial" && state !== "inactive";
          const isRec = !isCurrent && k === "pro";
          const isHigher = ctx.plan.monthly < p.monthly;
          return (
            <div key={k} className={`m-plan ${isCurrent ? "is-cur" : ""} ${isRec ? "is-rec" : ""}`}>
              <div className="m-plan-top">
                <div className="m-plan-l">
                  <div className="m-plan-tag">{isCurrent ? "Current plan" : isRec ? "Recommended" : "\u00A0"}</div>
                  <div className="m-plan-name">{p.name}</div>
                  <div className="m-plan-tagline">{p.tagline}</div>
                </div>
                <div className="m-plan-price-block">
                  <div className="m-plan-price">€{p.monthly}</div>
                  <div className="m-plan-price-unit">/ month</div>
                </div>
              </div>
              <div className="m-plan-feats">
                {p.features.map((f, i) => <span key={i}>{f}</span>)}
              </div>
              {isCurrent ? <Btn variant="secondary" size="sm" block>Manage plan</Btn> :
               isRec ? <Btn variant="accent" size="sm" block arrow>Upgrade to {p.name}</Btn> :
               <Btn variant="secondary" size="sm" block>{isHigher ? "Choose" : "Switch to"} {p.name}</Btn>}
            </div>
          );
        })}
      </div>
      <div className="m-plans-foot">
        <span>Extra seats <strong>€{SEAT_PRICE}/mo</strong></span>
        {state !== "trial" && state !== "inactive" && <span>Currently <strong>€{totalCurrent}/mo</strong></span>}
      </div>
    </div>
  );
}

// SMS card
function MobileSMSCard({ state, ctx }) {
  const [sel, setSel] = React.useState("sms300");
  if (state === "trial") {
    return (
      <div className="m-card">
        <div className="m-card-h"><h3>SMS credits</h3></div>
        <Banner tone="warn" icon={<I.Lock size={14} />} title="Locked during trial">Upgrade to send reminders.</Banner>
      </div>
    );
  }
  if (state === "inactive") {
    return (
      <div className="m-card">
        <div className="m-card-h"><h3>SMS credits</h3></div>
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <div className="e-ico"><I.SMS size={18} /></div>
          <h4>Subscribe first</h4>
          <p style={{ fontSize: 12 }}>SMS unlocks once you start a plan.</p>
        </div>
      </div>
    );
  }
  const pack = SMS_PACKS.find((p) => p.id === sel);
  const baseline = SMS_PACKS[0].per;
  const lasts = ctx.smsAvgPerMonth ? Math.max(1, Math.floor(ctx.smsBalance / (ctx.smsAvgPerMonth/30))) : null;
  return (
    <div className="m-card">
      <div className="m-card-h"><h3>SMS credits</h3></div>
      <div className="m-sms-balance">
        <div>
          <div className="lbl">Available credits</div>
          <div className="val">{ctx.smsBalance}<small>SMS</small></div>
        </div>
        <div className="runs">
          {lasts ? <>~<strong>{ctx.smsAvgPerMonth}/mo</strong> avg<br/>Lasts <strong>{lasts} days</strong></> : <>Top up anytime<br/>Credits never expire</>}
        </div>
      </div>
      <div className="m-sms-label">Top up</div>
      <div className="m-sms-packs">
        {SMS_PACKS.map((p) => {
          const savings = (baseline - p.per) * p.count;
          return (
            <div key={p.id} className={`m-sms-pack ${sel === p.id ? "is-sel" : ""}`} onClick={() => setSel(p.id)}>
              <div className="radio" />
              <div className="pl">
                <div className="t">{p.count}<small>SMS</small>{p.badge && <span className="badge">{p.badge}</span>}</div>
                <div className="s">{savings > 0 ? <><span className="save">Save €{savings.toFixed(0)}</span> vs. starter</> : <>Starter pack</>}</div>
              </div>
              <div className="pr">
                <div className="price">€{p.price.toFixed(0)}</div>
                <div className="rate">€{p.per.toFixed(2)}/SMS</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <Btn variant="accent" size="md" block icon={<I.Bolt size={13} />}>Buy {pack.count} SMS · €{pack.price.toFixed(0)}</Btn>
      </div>
    </div>
  );
}

// History
function MobileHistory({ ctx }) {
  const items = (ctx.history || []).slice(0, 4);
  return (
    <div className="m-card">
      <div className="m-card-h">
        <h3>Recent invoices</h3>
        {items.length > 0 && <Btn variant="ghost" size="sm">View all</Btn>}
      </div>
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <div className="e-ico"><I.Receipt size={18} /></div>
          <h4>No invoices yet</h4>
        </div>
      ) : items.map((it) => (
        <div key={it.id} className="m-hist">
          <div>
            <div className="l1">{it.label}</div>
            <div className="l2">
              <span>{it.date}</span>
              {it.status && <Pill tone={it.status === "paid" ? "good" : it.status === "failed" ? "danger" : "neutral"}>{it.status}</Pill>}
            </div>
          </div>
          <div className="a">€{it.amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

// State messages — mirrors desktop banners, tuned for mobile
function MobileStateMessage({ state, ctx }) {
  if (state === "trial") {
    return (
      <Banner tone="warn" icon={<I.Sparkles size={14} />} title={`Trial ends in ${ctx.trialDaysLeft} days`}>
        Add a card to keep Calendar, SMS reminders & marketplace listing after {ctx.trialEnds}.
      </Banner>
    );
  }
  if (state === "past_due") {
    return (
      <Banner tone="danger" icon={<I.Alert size={14} />} title="Payment failed on Apr 22">
        We'll retry automatically in 3 days. Update your card or pay now to avoid interruption.
      </Banner>
    );
  }
  if (state === "scheduled") {
    return (
      <Banner tone="warn" icon={<I.Clock size={14} />} title={`Cancels on ${ctx.nextBilling}`}>
        You can keep your subscription anytime before then. After that, data is kept for 90 days.
      </Banner>
    );
  }
  if (state === "pending_inc" || state === "pending_dec") {
    const diff = state === "pending_inc" ? ctx.scheduledSeats - ctx.seats : ctx.seats - ctx.scheduledSeats;
    const verb = state === "pending_inc" ? "Adding" : "Removing";
    return (
      <Banner tone="info" icon={<I.Refresh size={14} />} title={`${verb} ${diff} seat${diff === 1 ? "" : "s"} on ${ctx.nextBilling}`}>
        Change applies at next renewal. No prorated charge today.
      </Banner>
    );
  }
  if (state === "canceled") {
    return (
      <Banner tone="neutral" icon={<I.Info size={14} />} title="Subscription ended">
        Your data is read-only and will be kept for 90 days. Renew anytime to restore full access.
      </Banner>
    );
  }
  if (state === "inactive") {
    return (
      <Banner tone="info" icon={<I.Sparkles size={14} />} title="Choose a plan to get started">
        14-day free trial · cancel anytime · no card required.
      </Banner>
    );
  }
  return null;
}

function MobileView({ state, ctx, onAction }) {
  const message = <MobileStateMessage state={state} ctx={ctx} />;
  return (
    <div className="m-frame">
      <div className="m-device">
        <div className="m-shell" style={{ position: 'relative' }}>
          <div className="m-top">
            <div className="row1">
              <button className="ic-btn"><I.ChevLeft size={20} /></button>
              <h1>Account</h1>
              <button className="ic-btn"><I.MoreH size={18} /></button>
            </div>
            <div className="m-tabs">
              <button>Profile</button>
              <button className="is-on">Billing</button>
            </div>
          </div>

          <div className="m-content">
            <MobileHero state={state} ctx={ctx} onAction={onAction} />
            {message}
            <MobileCostCard state={state} ctx={ctx} />
            <MobileUsageCard state={state} ctx={ctx} />
            <MobilePlanCompare state={state} ctx={ctx} />
            <MobileSMSCard state={state} ctx={ctx} />
            <MobileHistory ctx={ctx} />
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <Btn variant="ghost" size="sm" icon={<I.Building size={13} />}>Invoice details</Btn>
            </div>
          </div>

          <nav className="m-tabbar">
            <div className="m-tab"><I.Dashboard size={18} /><span>Dashboard</span></div>
            <div className="m-tab"><I.Layers size={18} /><span>Assignments</span></div>
            <div className="m-tab"><I.Calendar size={18} /><span>Calendar</span></div>
            <div className="m-tab"><I.Map size={18} /><span>Marketplace</span></div>
            <div className="m-tab is-active"><I.MoreH size={18} /><span>More</span></div>
          </nav>
        </div>
      </div>
    </div>
  );
}

window.MobileView = MobileView;

// Subscription card + Hero summary, real-app vocabulary.

const SUB_CSS = `
/* Hero summary — replaces my old AI-ish hero */
.hero { background: linear-gradient(180deg, var(--bg-soft-accent) 0%, #FFFCFA 100%); border: 1px solid var(--accent-soft); border-radius: var(--radius-lg); padding: 22px 24px; display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; }
.hero.tone-warn { background: linear-gradient(180deg, #FEF8EC 0%, #FFFEFA 100%); border-color: #F5E2BA; }
.hero.tone-danger { background: linear-gradient(180deg, #FEF1EE 0%, #FFFBF9 100%); border-color: #F5C9BE; }
.hero.tone-neutral { background: var(--bg-sunk); border-color: var(--line); }
.hero .left { display: flex; align-items: center; gap: 18px; }
.hero .crest { width: 44px; height: 44px; border-radius: 12px; background: #fff; border: 1px solid var(--line); display: grid; place-items: center; color: var(--accent); flex-shrink: 0; }
.hero .meta h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -.01em; display: flex; align-items: center; gap: 10px; }
.hero .meta .row2 { margin-top: 6px; font-size: 13px; color: var(--ink-2); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.hero .meta .row2 .sep { color: var(--ink-4); }
.hero .right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.hero .price { font-size: 24px; font-weight: 600; letter-spacing: -.02em; line-height: 1; }
.hero .price small { font-size: 12.5px; font-weight: 400; color: var(--ink-2); margin-left: 2px; }

/* Subscription detail rows */
.line-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; padding: 12px 0; border-bottom: 1px dashed var(--line); align-items: center; font-size: 13.5px; }
.line-row:last-child { border-bottom: 0; }
.line-row .lbl { color: var(--ink-1); }
.line-row .lbl .sub { font-size: 12px; color: var(--ink-3); display: block; margin-top: 2px; font-weight: 400; }
.line-row .val { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
.line-total { padding-top: 14px; margin-top: 4px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: baseline; }
.line-total .l { font-size: 13px; color: var(--ink-2); }
.line-total .r { font-size: 22px; font-weight: 600; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
.line-total .r small { font-size: 13px; font-weight: 400; color: var(--ink-2); margin-left: 2px; }

.seat-control { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--bg-sunk); border-radius: var(--radius); margin-top: 10px; gap: 12px; }
.seat-control .l { display: flex; flex-direction: column; }
.seat-control .l .ttl { font-size: 13.5px; font-weight: 600; color: var(--ink); }
.seat-control .l .sub { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
.seat-control .r { display: flex; align-items: center; gap: 12px; }

.pm-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); }
.pm-brand { width: 40px; height: 26px; border-radius: 5px; background: #1A1F36; color: white; display: grid; place-items: center; font-size: 9px; font-weight: 700; letter-spacing: .03em; flex-shrink: 0; }
.pm-brand.visa { background: linear-gradient(135deg, #1A1F71, #0E5BAA); }
.pm-brand.mc { background: linear-gradient(135deg, #EB001B 0%, #EB001B 50%, #F79E1B 50%, #F79E1B 100%); color: transparent; position: relative; }
.pm-brand.mc::before { content: 'MC'; position: absolute; color: white; font-size: 8px; }
.pm-mid { flex: 1; min-width: 0; }
.pm-mid .l1 { font-size: 13.5px; font-weight: 500; color: var(--ink); }
.pm-mid .l2 { font-size: 11.5px; color: var(--ink-3); margin-top: 2px; }

.cancel-link { background: transparent; border: 0; color: var(--ink-3); font-size: 12.5px; padding: 6px 0; cursor: pointer; font-family: inherit; text-decoration: underline; text-decoration-color: var(--line-strong); text-underline-offset: 3px; }
.cancel-link:hover { color: var(--danger); text-decoration-color: var(--danger); }

/* Trial countdown */
.trial-bar { display: flex; align-items: center; gap: 14px; }
.trial-bar .days { font-size: 28px; font-weight: 700; color: var(--accent); letter-spacing: -.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.trial-bar .days small { font-size: 12px; font-weight: 500; color: var(--ink-2); display: block; margin-top: 2px; letter-spacing: 0; }
.trial-bar-strip { flex: 1; height: 6px; background: var(--bg-sunk); border-radius: 3px; overflow: hidden; }
.trial-bar-strip > span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--warn)); border-radius: 3px; }
`;
(function inject() {
  if (document.getElementById('sub-css')) return;
  const s = document.createElement('style');
  s.id = 'sub-css';
  s.textContent = SUB_CSS;
  document.head.appendChild(s);
})();

const PLAN = {
  base:  { name: "Base",  monthly: 10, locations: 5,  members: 5,  tagline: "Solo or single-location.",  features: ["Up to 5 locations", "5 team members", "Email reminders", "Marketplace listing"] },
  pro:   { name: "Pro",   monthly: 25, locations: 15, members: 15, tagline: "Growing team or multi-site.", features: ["Up to 15 locations", "15 team members", "SMS + email reminders", "Priority support"] },
  scale: { name: "Scale", monthly: 60, locations: 50, members: 50, tagline: "Multi-region operations.",   features: ["Up to 50 locations", "50 team members", "API access + webhooks", "Dedicated CSM"] },
};
const SEAT_PRICE = 5;

function HeroBar({ state, ctx, onAction }) {
  const tone = state === "past_due" ? "tone-danger" : (state === "trial" || state === "scheduled") ? "tone-warn" : (state === "canceled" || state === "inactive") ? "tone-neutral" : "";
  const baseLine = state === "lifetime" ? 0 : ctx.plan.monthly;
  const total = baseLine + ctx.seats * SEAT_PRICE;

  let primaryAction = null;
  if (state === "trial")    primaryAction = <Btn variant="accent" size="lg" onClick={() => onAction("upgrade")} arrow>Upgrade · €{ctx.plan.monthly}/mo</Btn>;
  if (state === "active")   primaryAction = <Btn variant="secondary" size="md" icon={<I.Card size={14} />} onClick={() => onAction("payment")}>Manage payment</Btn>;
  if (state === "past_due") primaryAction = <Btn variant="accent" size="lg" icon={<I.Card size={14} />} onClick={() => onAction("retry")}>Pay €{ctx.amountDue.toFixed(2)} now</Btn>;
  if (state === "canceled") primaryAction = <Btn variant="accent" size="lg" onClick={() => onAction("renew")} arrow>Renew subscription</Btn>;
  if (state === "scheduled") primaryAction = <Btn variant="accent" size="md" onClick={() => onAction("keep")}>Keep my subscription</Btn>;
  if (state === "inactive") primaryAction = <Btn variant="accent" size="lg" onClick={() => onAction("start")} arrow>Start subscription · €{ctx.plan.monthly}/mo</Btn>;
  if (state === "lifetime") primaryAction = <Btn variant="secondary" size="md" icon={<I.Card size={14} />}>Manage payment</Btn>;
  if (state === "pending_inc" || state === "pending_dec") primaryAction = <Btn variant="secondary" size="md" onClick={() => onAction("revert")}>Revert change</Btn>;

  return (
    <div className={`hero ${tone}`}>
      <div className="left">
        <div className="crest"><I.Crown size={22} /></div>
        <div className="meta">
          <h2>{ctx.plan.name} plan <StatusPill state={state} /></h2>
          <div className="row2">
            {state === "trial" && <><span><strong style={{color:'var(--ink-1)', fontWeight:600}}>{ctx.trialDaysLeft}</strong> days left in trial</span><span className="sep">·</span><span>Ends {ctx.trialEnds}</span></>}
            {state === "active" && <><span>Renews {ctx.nextBilling}</span><span className="sep">·</span><span>{ctx.seats} seats · {ctx.locationsUsed}/{ctx.plan.locations} locations</span></>}
            {state === "pending_inc" && <><span>Going to {ctx.scheduledSeats} seats on {ctx.nextBilling}</span></>}
            {state === "pending_dec" && <><span>Going to {ctx.scheduledSeats} seats on {ctx.nextBilling}</span></>}
            {state === "scheduled" && <><span>Active until {ctx.nextBilling}</span><span className="sep">·</span><span>No further charges</span></>}
            {state === "past_due" && <><span style={{ color: "var(--danger)" }}>Last charge failed · retry now to keep features</span></>}
            {state === "canceled" && <><span>Ended {ctx.nextBilling}</span><span className="sep">·</span><span>Data retained 90 days</span></>}
            {state === "lifetime" && <><span>One-time purchase · No recurring charges</span></>}
            {state === "inactive" && <><span>No active subscription</span></>}
          </div>
        </div>
      </div>
      <div className="right">
        {state !== "trial" && state !== "inactive" && state !== "canceled" && state !== "past_due" && (
          <div className="price">€{total.toFixed(0)}<small>/month</small></div>
        )}
        {state === "past_due" && <div className="price" style={{ color: "var(--danger)" }}>€{ctx.amountDue.toFixed(2)}<small>due</small></div>}
        {primaryAction}
      </div>
    </div>
  );
}

function SubscriptionCard({ state, ctx, setCtx, onAction }) {
  const isTrial = state === "trial";
  const isInactive = state === "inactive";
  const isPastDue = state === "past_due";
  const isCanceled = state === "canceled";
  const isLifetime = state === "lifetime";
  const isScheduled = state === "scheduled";
  const showPending = state === "pending_inc" || state === "pending_dec";

  const baseLine = isLifetime ? 0 : ctx.plan.monthly;
  const seatLine = ctx.seats * SEAT_PRICE;
  const total = baseLine + seatLine;

  const setSeats = (n) => setCtx((c) => ({ ...c, seats: n }));

  return (
    <Card title="Subscription details" subtitle={isTrial ? "Trial · no payment method on file yet" : isLifetime ? "Lifetime access — no recurring charges" : null}
      action={!isTrial && !isInactive && !isCanceled && <Btn variant="ghost" size="sm" icon={<I.External size={12} />}>Open billing portal</Btn>}>

      {/* Trial banner */}
      {isTrial && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="warn" icon={<I.Sparkles size={16} />} title={`Trial ends in ${ctx.trialDaysLeft} days`}>
            <div className="trial-bar" style={{ marginTop: 10 }}>
              <div className="trial-bar-strip"><span style={{ width: `${100 - (ctx.trialDaysLeft / 14) * 100}%` }} /></div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{ctx.trialDaysLeft}/14 days</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 13 }}>Add a card to keep Calendar, SMS reminders & marketplace listing after {ctx.trialEnds}.</div>
          </Banner>
        </div>
      )}

      {isPastDue && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="danger" icon={<I.Alert size={16} />} title="Payment failed on Apr 22">
            We'll retry automatically in 3 days. To avoid interruption, update your card or pay now.
          </Banner>
        </div>
      )}

      {isScheduled && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="warn" icon={<I.Clock size={16} />} title={`Cancels on ${ctx.nextBilling}`}>
            You can keep your subscription anytime before then. After that date, your data is kept for 90 days.
          </Banner>
        </div>
      )}

      {showPending && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="info" icon={<I.Refresh size={16} />} title={state === "pending_inc" ? `Adding ${ctx.scheduledSeats - ctx.seats} seats on ${ctx.nextBilling}` : `Removing ${ctx.seats - ctx.scheduledSeats} seats on ${ctx.nextBilling}`}>
            Change applies at next renewal. No prorated charge today.
          </Banner>
        </div>
      )}

      {isCanceled && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="neutral" icon={<I.Info size={16} />} title="Subscription ended">
            Your data is read-only and will be kept for 90 days. Renew anytime to restore full access.
          </Banner>
        </div>
      )}

      {isInactive && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="info" icon={<I.Sparkles size={16} />} title="Choose a plan to get started">
            14-day free trial · cancel anytime · no card required to start.
          </Banner>
        </div>
      )}

      {/* Cost lines (hide for inactive) */}
      {!isInactive && !isCanceled && (
        <>
          <div className="line-row">
            <div className="lbl">{ctx.plan.name} plan <span className="sub">{ctx.plan.locations} locations · core features</span></div>
            <div className="val">€{baseLine.toFixed(2)}/mo</div>
          </div>
          {!isTrial && !isLifetime && (
            <div className="line-row">
              <div className="lbl">Team seats <span className="sub">{ctx.seats} × €{SEAT_PRICE.toFixed(2)} per active seat</span></div>
              <div className="val">€{seatLine.toFixed(2)}/mo</div>
            </div>
          )}
          {isLifetime && (
            <div className="line-row">
              <div className="lbl">Team seats <span className="sub">Included free with lifetime</span></div>
              <div className="val" style={{ color: 'var(--good)' }}>Free</div>
            </div>
          )}
          <div className="line-total">
            <div className="l">{isTrial ? "Total after trial" : isLifetime ? "Total this month" : "Total"}</div>
            <div className="r">€{total.toFixed(2)}<small>{isLifetime ? "" : "/month"}</small></div>
          </div>
        </>
      )}

      {/* Seat manager */}
      {!isTrial && !isInactive && !isCanceled && !isLifetime && (
        <div className="seat-control">
          <div className="l">
            <div className="ttl">Team seats</div>
            <div className="sub">{ctx.membersUsed} member{ctx.membersUsed === 1 ? "" : "s"} active · €{SEAT_PRICE}/seat/mo</div>
          </div>
          <div className="r">
            <Stepper value={ctx.seats} min={Math.max(1, ctx.membersUsed)} max={ctx.plan.members} onChange={setSeats} />
            <Btn variant="secondary" size="sm">Save</Btn>
          </div>
        </div>
      )}

      {/* Payment method */}
      {(state === "active" || state === "scheduled" || isPastDue || showPending || isLifetime) && (
        <div style={{ marginTop: 16 }}>
          <div className="label">Payment method</div>
          <div className="pm-row" style={isPastDue ? { borderColor: 'var(--danger-soft)', background: '#FEF7F5' } : null}>
            <div className="pm-brand visa">VISA</div>
            <div className="pm-mid">
              <div className="l1">Visa ending in 4242</div>
              <div className="l2">Expires 09/27 · {isPastDue ? <span style={{color:'var(--danger)'}}>Last charge failed</span> : "Default"}</div>
            </div>
            <Btn variant="ghost" size="sm">Update</Btn>
          </div>
        </div>
      )}

      {/* Trial CTA */}
      {isTrial && (
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <Btn variant="accent" size="md" icon={<I.Card size={14} />} onClick={() => onAction("upgrade")}>Add card to upgrade</Btn>
          <Btn variant="ghost" size="md">Compare plans</Btn>
        </div>
      )}

      {/* Cancel link, only when active */}
      {state === "active" && (
        <div style={{ marginTop: 14, textAlign: "right" }}>
          <button className="cancel-link" onClick={() => onAction("cancel")}>Cancel subscription</button>
        </div>
      )}
    </Card>
  );
}

Object.assign(window, { HeroBar, SubscriptionCard, PLAN, SEAT_PRICE });

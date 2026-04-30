// App — wires everything together.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "viewState": "active",
  "viewport": "desktop",
  "density": "regular",
  "layout": "twocol",
  "showCompare": true
}/*EDITMODE-END*/;

const STATES = [
  { value: "trial",        label: "Trial" },
  { value: "active",       label: "Active" },
  { value: "pending_inc",  label: "Pending +seats" },
  { value: "pending_dec",  label: "Pending -seats" },
  { value: "scheduled",    label: "Scheduled cancel" },
  { value: "past_due",     label: "Past due" },
  { value: "canceled",     label: "Canceled" },
  { value: "lifetime",     label: "Lifetime" },
  { value: "inactive",     label: "Inactive (no sub)" },
];

function ctxFor(state) {
  const base = {
    plan: PLAN.base, seats: 3, membersUsed: 2, locationsUsed: 3,
    smsBalance: 0, smsAvgPerMonth: null,
    nextBilling: "May 22, 2026", trialEnds: "May 6, 2026", trialDaysLeft: 11,
    amountDue: 0, scheduledSeats: null, history: [],
  };
  switch (state) {
    case "trial":       return { ...base, seats: 0, membersUsed: 0, locationsUsed: 1 };
    case "active":      return { ...base, smsBalance: 248, smsAvgPerMonth: 320, history: hist() };
    case "pending_inc": return { ...base, scheduledSeats: 6, smsBalance: 248, smsAvgPerMonth: 320, history: hist() };
    case "pending_dec": return { ...base, seats: 5, membersUsed: 2, scheduledSeats: 3, smsBalance: 248, smsAvgPerMonth: 320, history: hist() };
    case "scheduled":   return { ...base, smsBalance: 120, smsAvgPerMonth: 280, history: hist() };
    case "past_due":    return { ...base, amountDue: 25.00, smsBalance: 12, smsAvgPerMonth: 320, history: hist(true) };
    case "canceled":    return { ...base, smsBalance: 0, history: hist() };
    case "lifetime":    return { ...base, smsBalance: 1240, smsAvgPerMonth: 410, history: hist() };
    case "inactive":    return { ...base, seats: 0, membersUsed: 0, locationsUsed: 0, history: [] };
    default:            return base;
  }
}

function hist(failed = false) {
  return [
    { id: 1, label: "300 SMS credits", date: "Apr 22, 2026", invoice: "INV-2026-04122", amount: 150.00, status: "paid" },
    { id: 2, label: "Subscription · April", date: "Apr 22, 2026", invoice: "INV-2026-04121", amount: 25.00, status: failed ? "failed" : "paid" },
    { id: 3, label: "100 SMS credits", date: "Mar 18, 2026", invoice: "INV-2026-03088", amount: 60.00, status: "paid" },
    { id: 4, label: "Subscription · March", date: "Mar 22, 2026", invoice: "INV-2026-03087", amount: 25.00, status: "paid" },
    { id: 5, label: "Subscription · February", date: "Feb 22, 2026", invoice: "INV-2026-02061", amount: 20.00, status: "paid" },
  ];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const state = t.viewState;
  const [ctx, setCtx] = React.useState(() => ctxFor(state));
  React.useEffect(() => { setCtx(ctxFor(state)); }, [state]);

  React.useEffect(() => {
    document.body.classList.remove("density-compact", "density-regular", "density-comfy");
    document.body.classList.add(`density-${t.density}`);
  }, [t.density]);

  const onAction = (a) => {
    const map = {
      upgrade: () => setTweak("viewState", "active"),
      start: () => setTweak("viewState", "active"),
      renew: () => setTweak("viewState", "active"),
      cancel: () => setTweak("viewState", "scheduled"),
      keep: () => setTweak("viewState", "active"),
      revert: () => setTweak("viewState", "active"),
    };
    map[a]?.();
  };

  const isMobile = t.viewport === "mobile";

  const desktop = (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="page">
          <div className="page-h">
            <div>
              <h1>Billing & Subscription</h1>
              <p>Manage your plan, team seats, SMS credits and invoice details.</p>
            </div>
            <div className="actions">
              <Btn variant="ghost" size="sm" icon={<I.Download size={13} />}>Export invoices</Btn>
              <Btn variant="secondary" size="sm" icon={<I.External size={13} />}>Help center</Btn>
            </div>
          </div>

          <HeroBar state={state} ctx={ctx} onAction={onAction} />

          {t.layout === "twocol" ? (
            <div className="grid-2" style={{ marginTop: 20 }}>
              <div className="col">
                <SubscriptionCard state={state} ctx={ctx} setCtx={setCtx} onAction={onAction} />
                {t.showCompare && <PlanCompareCard ctx={ctx} state={state} />}
                <BillingDetailsCard />
              </div>
              <div className="col">
                <PlanUsageCard state={state} ctx={ctx} />
                <SMSCard state={state} ctx={ctx} />
                <HistoryCard ctx={ctx} />
              </div>
            </div>
          ) : (
            <div className="grid-stack" style={{ marginTop: 20 }}>
              <SubscriptionCard state={state} ctx={ctx} setCtx={setCtx} onAction={onAction} />
              <PlanUsageCard state={state} ctx={ctx} />
              {t.showCompare && <PlanCompareCard ctx={ctx} state={state} />}
              <SMSCard state={state} ctx={ctx} />
              <HistoryCard ctx={ctx} />
              <BillingDetailsCard />
            </div>
          )}
        </div>
      </main>
    </div>
  );

  const mobile = <MobileView state={state} ctx={ctx} onAction={onAction} />;

  return (
    <>
      {isMobile ? mobile : desktop}
      <TweaksPanel>
        <TweakSection label="State" />
        <TweakSelect label="Subscription" value={t.viewState} options={STATES} onChange={(v) => setTweak("viewState", v)} />
        <TweakRadio label="Viewport" value={t.viewport} options={["desktop", "mobile"]} onChange={(v) => setTweak("viewport", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Grid" value={t.layout} options={[{value:"twocol",label:"Two col"},{value:"stacked",label:"Stacked"}]} onChange={(v) => setTweak("layout", v)} />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="Show plan compare" value={t.showCompare} onChange={(v) => setTweak("showCompare", v)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// Billing details — Company / Individual with RO fiscal-code autofill mock.

const FORM_CSS = `
.form { display: grid; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-row.cols-1 { grid-template-columns: 1fr; }
@media (max-width: 720px) { .form-row { grid-template-columns: 1fr; } }
.form-foot { display: flex; justify-content: flex-end; gap: 8px; padding-top: 16px; border-top: 1px solid var(--line); margin-top: 4px; }
`;
(function inject() {
  if (document.getElementById('form-css')) return;
  const s = document.createElement('style');
  s.id = 'form-css';
  s.textContent = FORM_CSS;
  document.head.appendChild(s);
})();

function BillingDetailsCard() {
  const [type, setType] = React.useState("company");
  const [data, setData] = React.useState({
    legal: "Owner boss SRL", cui: "RO12345678", reg: "J40/1234/2020",
    address: "Strada Calea Victoriei 25", city: "București", county: "Sector 1",
    country: "RO", fullName: "Tedi Turluianu",
  });
  const [lookup, setLookup] = React.useState("done");
  const upd = (k) => (e) => setData({ ...data, [k]: e.target.value });

  const doLookup = () => {
    if (!/^RO\d{2,10}$/i.test(data.cui)) return;
    setLookup("loading");
    setTimeout(() => {
      setData((d) => ({ ...d, legal: "Owner boss SRL", reg: "J40/1234/2020", address: "Strada Calea Victoriei 25", city: "București", county: "Sector 1" }));
      setLookup("done");
    }, 800);
  };

  return (
    <Card title="Invoice details" subtitle="Used to generate your monthly invoices."
      action={lookup === "done" && type === "company" ? <Pill tone="good" icon={<I.CheckCircle size={11} />}>Verified</Pill> : null}>
      <div className="form">
        <div>
          <div className="label">Invoice as</div>
          <Segmented value={type} onChange={setType} options={[
            { value: "company", label: "Company" },
            { value: "individual", label: "Individual" },
          ]} />
          <div className="hint" style={{ marginTop: 8 }}>
            {type === "company"
              ? "Invoices issued to a legal entity with a fiscal code (CUI). Required for VAT deduction."
              : "Invoices issued to you personally with your full name and address."}
          </div>
        </div>

        {type === "company" ? (
          <>
            <div className="form-row">
              <div>
                <div className="label">Fiscal code (CUI) <I.RO size={11} /></div>
                <div className="input-row">
                  <input className="input" value={data.cui} onChange={upd("cui")} placeholder="RO12345678" />
                  <Btn variant="secondary" size="md" onClick={doLookup} disabled={!data.cui}>
                    {lookup === "loading" ? <span className="spin"><I.Refresh size={13} /></span> : <><I.Search size={13} /> Look up</>}
                  </Btn>
                </div>
                <div className="hint">We look up the company in the public Romanian register and auto-fill the rest.</div>
              </div>
              <div>
                <div className="label">Trade register</div>
                <input className="input" value={data.reg} onChange={upd("reg")} placeholder="J40/1234/2020" />
              </div>
            </div>
            <div className="form-row cols-1">
              <div>
                <div className="label">Company legal name</div>
                <input className="input" value={data.legal} onChange={upd("legal")} placeholder="Acme SRL" />
              </div>
            </div>
          </>
        ) : (
          <div className="form-row cols-1">
            <div>
              <div className="label">Full name</div>
              <input className="input" value={data.fullName} onChange={upd("fullName")} />
            </div>
          </div>
        )}

        <div className="form-row cols-1">
          <div>
            <div className="label">Address</div>
            <input className="input" value={data.address} onChange={upd("address")} placeholder="Stradă, număr, sector" />
          </div>
        </div>
        <div className="form-row">
          <div><div className="label">City</div><input className="input" value={data.city} onChange={upd("city")} /></div>
          <div><div className="label">County</div><input className="input" value={data.county} onChange={upd("county")} /></div>
        </div>
        <div className="form-row">
          <div>
            <div className="label">Country</div>
            <select className="input" value={data.country} onChange={upd("country")}>
              <option value="RO">Romania (RO)</option>
              <option value="DE">Germany (DE)</option>
              <option value="FR">France (FR)</option>
            </select>
          </div>
          <div />
        </div>

        <div className="form-foot">
          <Btn variant="ghost" size="md">Cancel</Btn>
          <Btn variant="accent" size="md" icon={<I.Check size={13} />}>Save details</Btn>
        </div>
      </div>
    </Card>
  );
}

window.BillingDetailsCard = BillingDetailsCard;

import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "AUD", symbol: "A$", name: "Aust. Dollar" },
  { code: "CAD", symbol: "C$", name: "Can. Dollar" },
];

const MEASURES_DATA = [
  { category: "Beer & Cider", items: [
    { name: "Pint", metric: "568ml", imperial: "20 fl oz" },
    { name: "Half Pint", metric: "284ml", imperial: "10 fl oz" },
    { name: "⅔ Pint (Schooner)", metric: "379ml", imperial: "13.3 fl oz" },
    { name: "Third Pint", metric: "189ml", imperial: "6.7 fl oz" },
  ]},
  { category: "Spirits", items: [
    { name: "Single (England & Wales)", metric: "25ml", imperial: "0.85 fl oz" },
    { name: "Single (Scotland & Ireland)", metric: "35ml", imperial: "1.2 fl oz" },
    { name: "Double (England & Wales)", metric: "50ml", imperial: "1.7 fl oz" },
    { name: "Double (Scotland & Ireland)", metric: "70ml", imperial: "2.4 fl oz" },
  ]},
  { category: "Wine", items: [
    { name: "Small Glass", metric: "125ml", imperial: "4.2 fl oz" },
    { name: "Standard Glass", metric: "175ml", imperial: "5.9 fl oz" },
    { name: "Large Glass", metric: "250ml", imperial: "8.5 fl oz" },
    { name: "Bottle", metric: "750ml", imperial: "25.4 fl oz" },
  ]},
  { category: "Cocktail Measures", items: [
    { name: "Shot", metric: "25–50ml", imperial: "0.85–1.7 fl oz" },
    { name: "Jigger (standard)", metric: "44ml", imperial: "1.5 fl oz" },
    { name: "Pony / Cordial", metric: "30ml", imperial: "1 fl oz" },
    { name: "Barspoon", metric: "5ml", imperial: "1 tsp" },
    { name: "Dash", metric: "~0.6ml", imperial: "~⅛ tsp" },
  ]},
  { category: "Kegs", items: [
    { name: "Mini Keg", metric: "11L", imperial: "2.4 gal" },
    { name: "Pin (½ Firkin)", metric: "20.5L", imperial: "4.5 gal" },
    { name: "Firkin", metric: "41L", imperial: "9 gal" },
    { name: "Standard Keg", metric: "50L", imperial: "11 gal" },
  ]},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcGP = (cost, sell) => (sell > 0 ? ((sell - cost) / sell) * 100 : 0);
const calcTarget = (cost, tgp) => (tgp < 100 ? cost / (1 - tgp / 100) : 0);

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary: "#2D6A4F",
  primaryDark: "#1B4332",
  light: "#40916C",
  accent: "#95D5B2",
  bg: "#F4F7F5",
  white: "#FFFFFF",
  text: "#1B2D27",
  muted: "#6B7F78",
  border: "#DDE8E3",
  danger: "#DC2626",
  warn: "#D97706",
  success: "#16A34A",
};

// ─── Shared Components ────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.white, borderRadius: 16, padding: 20, marginBottom: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)", ...style,
  }}>{children}</div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
    {children}
  </div>
);

const Field = ({ prefix, suffix, value, onChange, placeholder, type = "number" }) => (
  <div style={{ position: "relative", marginBottom: 10 }}>
    {prefix && (
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14, zIndex: 1, pointerEvents: "none" }}>
        {prefix}
      </span>
    )}
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box",
        padding: `10px ${suffix ? "36px" : "12px"} 10px ${prefix ? "28px" : "12px"}`,
        border: `1.5px solid ${C.border}`, borderRadius: 10,
        fontSize: 15, color: C.text, background: C.bg, fontFamily: "inherit", outline: "none",
      }}
    />
    {suffix && (
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13, pointerEvents: "none" }}>
        {suffix}
      </span>
    )}
  </div>
);

const Dropdown = ({ children, value, onChange }) => (
  <select value={value} onChange={onChange} style={{
    width: "100%", padding: "10px 12px", marginBottom: 10,
    border: `1.5px solid ${C.border}`, borderRadius: 10,
    fontSize: 14, color: C.text, background: C.bg, fontFamily: "inherit", outline: "none", cursor: "pointer",
  }}>
    {children}
  </select>
);

const SegControl = ({ options, value, onChange }) => (
  <div style={{ display: "flex", background: "#E4EDE8", borderRadius: 12, padding: 4, marginBottom: 12 }}>
    {options.map(([val, label]) => (
      <button key={val} onClick={() => onChange(val)} style={{
        flex: 1, padding: "9px 4px", borderRadius: 9, border: "none",
        background: value === val ? C.white : "transparent",
        color: value === val ? C.primary : C.muted,
        fontFamily: "inherit", fontSize: 13, fontWeight: value === val ? 600 : 400,
        cursor: "pointer", transition: "all 0.15s ease",
        boxShadow: value === val ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
      }}>{label}</button>
    ))}
  </div>
);

// ─── GP Result Box ────────────────────────────────────────────────────────────
const GPResultBox = ({ costPerUnit, sellingPrice, gpVal, targetGP, sym, meta }) => {
  const sell = parseFloat(sellingPrice) || 0;
  const diff = gpVal - targetGP;
  const color = gpVal >= targetGP ? C.success : gpVal >= targetGP - 10 ? C.warn : C.danger;
  const suggested = calcTarget(costPerUnit, targetGP);

  return (
    <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
      {meta && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {meta.map(([k, v]) => (
            <div key={k} style={{ background: C.white, borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
              <span style={{ color: C.muted }}>{k}: </span><strong style={{ color: C.text }}>{v}</strong>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: C.white, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 2 }}>UNIT COST</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>{sym}{costPerUnit.toFixed(2)}</div>
        </div>
        <div style={{ background: C.white, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 2 }}>GROSS PROFIT</div>
          <div style={{ fontSize: 22, fontWeight: 700, color }}>{gpVal.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ background: "#E0EDE8", borderRadius: 6, height: 8, position: "relative", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${Math.min(Math.max(gpVal, 0), 100)}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.4s ease" }} />
        <div style={{ position: "absolute", top: 0, left: `${targetGP}%`, width: 2, height: "100%", background: C.primaryDark, opacity: 0.6 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: gpVal < targetGP && sell > 0 ? 12 : 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{diff >= 0 ? `✓ ${diff.toFixed(1)}% above target` : `✗ ${Math.abs(diff).toFixed(1)}% below target`}</span>
        <span style={{ fontSize: 11, color: C.muted }}>Target: {targetGP}%</span>
      </div>
      {gpVal < targetGP && sell > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 10, color: "#92400E", fontWeight: 700, letterSpacing: 0.8, marginBottom: 3 }}>TO HIT {targetGP}% TARGET</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#92400E" }}>
            Charge {sym}{suggested.toFixed(2)}
            <span style={{ fontSize: 12, fontWeight: 400, color: "#B45309", marginLeft: 6 }}>(+{sym}{(suggested - sell).toFixed(2)})</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FOOD GP TAB
// ─────────────────────────────────────────────────────────────────────────────
function FoodGPTab({ sym, targetGP }) {
  const [dishes, setDishes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", ingredients: [{ name: "", cost: "" }], sellingPrice: "" });
  const [aiData, setAiData] = useState({});
  const [loadingAI, setLoadingAI] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const totalCost = (ings) => ings.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);

  const submit = () => {
    if (!form.name.trim()) return;
    const id = Date.now();
    setDishes(p => [...p, { ...form, id }]);
    setExpanded(id);
    setForm({ name: "", ingredients: [{ name: "", cost: "" }], sellingPrice: "" });
    setShowForm(false);
  };

  const getAI = async (dish) => {
    setLoadingAI(dish.id);
    const cost = totalCost(dish.ingredients);
    const gp = calcGP(cost, parseFloat(dish.sellingPrice));
    const prompt = `You are a hospitality cost management expert. Dish: "${dish.name}". Ingredients: ${dish.ingredients.filter(i => i.name).map(i => `${i.name} ${sym}${i.cost}`).join(", ")}. Total cost: ${sym}${cost.toFixed(2)}, Selling price: ${sym}${dish.sellingPrice}, GP: ${gp.toFixed(1)}%, Target: ${targetGP}%. Give 3 specific, actionable suggestions to improve the GP margin on this dish. Be precise and practical. Respond ONLY with a JSON array: [{"tip":"title max 5 words","detail":"1-2 sentences","impact":"High|Medium|Low"}]`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json();
      const txt = d.content.map(c => c.text || "").join("");
      setAiData(p => ({ ...p, [dish.id]: JSON.parse(txt.replace(/```json|```/g, "").trim()) }));
    } catch {
      setAiData(p => ({ ...p, [dish.id]: [{ tip: "Error loading", detail: "Please try again.", impact: "Low" }] }));
    }
    setLoadingAI(null);
  };

  const avgGP = dishes.length > 0
    ? dishes.reduce((s, d) => s + calcGP(totalCost(d.ingredients), parseFloat(d.sellingPrice) || 0), 0) / dishes.length
    : null;
  const onTarget = dishes.filter(d => calcGP(totalCost(d.ingredients), parseFloat(d.sellingPrice) || 0) >= targetGP).length;

  return (
    <div>
      {dishes.length > 0 && (
        <Card style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.light})` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
            {[["DISHES", dishes.length], ["AVG GP", `${avgGP?.toFixed(1)}%`], ["ON TARGET", `${onTarget}/${dishes.length}`]].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: 0.8 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {dishes.map(dish => {
        const cost = totalCost(dish.ingredients);
        const sell = parseFloat(dish.sellingPrice) || 0;
        const gpVal = calcGP(cost, sell);
        const color = gpVal >= targetGP ? C.success : gpVal >= targetGP - 10 ? C.warn : C.danger;
        const isOpen = expanded === dish.id;
        return (
          <Card key={dish.id}>
            <div onClick={() => setExpanded(isOpen ? null : dish.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{dish.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {sym}{cost.toFixed(2)} cost · {sym}{sell.toFixed(2)} sell
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{gpVal.toFixed(1)}%</div>
                <span style={{ color: C.muted, fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 12 }}>
                  {dish.ingredients.filter(i => i.name).map((ing, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                      <span style={{ color: C.text }}>{ing.name}</span>
                      <span style={{ color: C.muted }}>{sym}{parseFloat(ing.cost).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, fontWeight: 600 }}>
                    <span>Total food cost</span>
                    <span style={{ color: C.danger }}>{sym}{cost.toFixed(2)}</span>
                  </div>
                </div>
                <GPResultBox costPerUnit={cost} sellingPrice={dish.sellingPrice} gpVal={gpVal} targetGP={targetGP} sym={sym} />
                <div style={{ marginTop: 12 }}>
                  {!aiData[dish.id] ? (
                    <button
                      onClick={() => getAI(dish)}
                      disabled={loadingAI === dish.id}
                      style={{
                        width: "100%", padding: 12, borderRadius: 12, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        background: "#F0FDF4", color: C.primary, border: `1.5px solid ${C.accent}`,
                        opacity: loadingAI === dish.id ? 0.7 : 1,
                      }}
                    >
                      {loadingAI === dish.id ? "⏳ Analysing dish..." : "🤖 Get AI Margin Suggestions"}
                    </button>
                  ) : (
                    <div>
                      <Label>AI Recommendations</Label>
                      {aiData[dish.id].map((s, i) => {
                        const ic = { High: C.success, Medium: C.warn, Low: C.muted }[s.impact] || C.muted;
                        return (
                          <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "10px 12px", marginBottom: 8, borderLeft: `3px solid ${ic}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{s.tip}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: ic, background: `${ic}18`, padding: "2px 8px", borderRadius: 20, border: `1px solid ${ic}30` }}>{s.impact}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{s.detail}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button onClick={() => setDishes(p => p.filter(d => d.id !== dish.id))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, padding: "8px 0", fontFamily: "inherit", marginTop: 4 }}>
                  Remove dish
                </button>
              </div>
            )}
          </Card>
        );
      })}

      {showForm ? (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>New Dish</div>
          <Label>Dish Name</Label>
          <Field type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pan-Seared Salmon" />
          <Label>Ingredients & Costs</Label>
          {form.ingredients.map((ing, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="text" placeholder="Ingredient" value={ing.name}
                onChange={e => setForm(f => ({ ...f, ingredients: f.ingredients.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) }))}
                style={{ flex: 2, padding: "9px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: C.bg, color: C.text }}
              />
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13, pointerEvents: "none" }}>{sym}</span>
                <input type="number" placeholder="0.00" value={ing.cost}
                  onChange={e => setForm(f => ({ ...f, ingredients: f.ingredients.map((x, idx) => idx === i ? { ...x, cost: e.target.value } : x) }))}
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 8px 9px 22px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: C.bg, color: C.text }}
                />
              </div>
              {form.ingredients.length > 1 && (
                <button onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))}
                  style={{ background: "#FEF2F2", border: "none", borderRadius: 10, color: C.danger, cursor: "pointer", padding: "0 10px", fontSize: 18 }}>×</button>
              )}
            </div>
          ))}
          <button onClick={() => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: "", cost: "" }] }))}
            style={{ background: "none", border: `1.5px dashed ${C.border}`, borderRadius: 8, color: C.muted, cursor: "pointer", padding: "7px 14px", fontSize: 12, marginBottom: 12, fontFamily: "inherit" }}>
            + Add ingredient
          </button>
          <div style={{ background: C.bg, borderRadius: 10, padding: "8px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.muted }}>Total food cost</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>{sym}{form.ingredients.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0).toFixed(2)}</span>
          </div>
          <Label>Selling Price</Label>
          <Field prefix={sym} value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} placeholder="0.00" />
          {form.sellingPrice && (() => {
            const cost = form.ingredients.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
            const gp = calcGP(cost, parseFloat(form.sellingPrice));
            return (
              <div style={{ background: C.bg, borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: C.muted }}>Projected GP: </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: gp >= targetGP ? C.success : C.danger }}>{gp.toFixed(1)}%</span>
                {gp < targetGP && (
                  <span style={{ fontSize: 12, color: C.warn, marginLeft: 8 }}>· Suggest {sym}{calcTarget(cost, targetGP).toFixed(2)}</span>
                )}
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={submit} style={{ flex: 1, padding: 12, borderRadius: 12, background: C.primary, color: "#fff", border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Add Dish</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "12px 18px", borderRadius: 12, background: C.bg, color: C.muted, border: "none", fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setShowForm(true)}
          style={{ width: "100%", padding: 16, border: `2px dashed ${C.border}`, borderRadius: 16, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 15, fontFamily: "inherit" }}>
          + Add New Dish
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRINKS GP TAB
// ─────────────────────────────────────────────────────────────────────────────
function DraughtCalc({ sym, targetGP }) {
  const [f, setF] = useState({ kegCost: "", kegSize: "30", servingSize: "568", wastage: "5", sellingPrice: "" });
  const up = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const kegCost = parseFloat(f.kegCost) || 0;
  const usableML = parseFloat(f.kegSize) * 1000 * (1 - parseFloat(f.wastage) / 100);
  const units = usableML / parseFloat(f.servingSize);
  const cpu = kegCost / units;
  const sell = parseFloat(f.sellingPrice) || 0;
  const gpVal = calcGP(cpu, sell);
  return (
    <div>
      <Card>
        <Label>Keg Purchase Cost</Label>
        <Field prefix={sym} value={f.kegCost} onChange={up("kegCost")} placeholder="0.00" />
        <Label>Keg Size</Label>
        <Dropdown value={f.kegSize} onChange={up("kegSize")}>
          <option value="11">11L (Mini keg)</option>
          <option value="20">20L</option>
          <option value="30">30L</option>
          <option value="50">50L</option>
        </Dropdown>
        <Label>Serving Size</Label>
        <Dropdown value={f.servingSize} onChange={up("servingSize")}>
          <option value="568">Pint (568ml)</option>
          <option value="284">Half Pint (284ml)</option>
          <option value="379">⅔ Pint (379ml)</option>
          <option value="189">Third Pint (189ml)</option>
        </Dropdown>
        <Label>Wastage %</Label>
        <Field value={f.wastage} onChange={up("wastage")} suffix="%" placeholder="5" />
        <Label>Selling Price per Serve</Label>
        <Field prefix={sym} value={f.sellingPrice} onChange={up("sellingPrice")} placeholder="0.00" />
      </Card>
      {kegCost > 0 && (
        <Card>
          <GPResultBox costPerUnit={cpu} sellingPrice={f.sellingPrice} gpVal={gpVal} targetGP={targetGP} sym={sym}
            meta={[["Usable volume", `${usableML.toFixed(0)}ml`], ["Units per keg", units.toFixed(1)]]} />
        </Card>
      )}
    </div>
  );
}

function BottledCalc({ sym, targetGP }) {
  const [f, setF] = useState({ caseCost: "", caseUnits: "24", sellingPrice: "" });
  const up = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const caseCost = parseFloat(f.caseCost) || 0;
  const units = parseInt(f.caseUnits) || 1;
  const cpu = caseCost / units;
  const sell = parseFloat(f.sellingPrice) || 0;
  return (
    <div>
      <Card>
        <Label>Case Purchase Cost</Label>
        <Field prefix={sym} value={f.caseCost} onChange={up("caseCost")} placeholder="0.00" />
        <Label>Units Per Case</Label>
        <Dropdown value={f.caseUnits} onChange={up("caseUnits")}>
          <option value="12">12 units</option>
          <option value="24">24 units</option>
          <option value="48">48 units</option>
        </Dropdown>
        <Label>Selling Price Per Bottle / Can</Label>
        <Field prefix={sym} value={f.sellingPrice} onChange={up("sellingPrice")} placeholder="0.00" />
      </Card>
      {caseCost > 0 && (
        <Card>
          <GPResultBox costPerUnit={cpu} sellingPrice={f.sellingPrice} gpVal={calcGP(cpu, sell)} targetGP={targetGP} sym={sym}
            meta={[["Cost per unit", `${sym}${cpu.toFixed(2)}`]]} />
        </Card>
      )}
    </div>
  );
}

function WineCalc({ sym, targetGP }) {
  const [f, setF] = useState({ bottleCost: "", serveSize: "175", sellingPrice: "" });
  const up = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const bottleCost = parseFloat(f.bottleCost) || 0;
  const serveSize = parseFloat(f.serveSize);
  const servesPerBottle = serveSize === 750 ? 1 : 750 / serveSize;
  const cpu = bottleCost / servesPerBottle;
  const sell = parseFloat(f.sellingPrice) || 0;
  return (
    <div>
      <Card>
        <Label>Bottle Purchase Cost</Label>
        <Field prefix={sym} value={f.bottleCost} onChange={up("bottleCost")} placeholder="0.00" />
        <Label>Serve Size</Label>
        <Dropdown value={f.serveSize} onChange={up("serveSize")}>
          <option value="125">125ml glass</option>
          <option value="175">175ml glass</option>
          <option value="250">250ml glass</option>
          <option value="750">Bottle (750ml)</option>
        </Dropdown>
        <Label>Selling Price Per Serve</Label>
        <Field prefix={sym} value={f.sellingPrice} onChange={up("sellingPrice")} placeholder="0.00" />
      </Card>
      {bottleCost > 0 && (
        <Card>
          <GPResultBox costPerUnit={cpu} sellingPrice={f.sellingPrice} gpVal={calcGP(cpu, sell)} targetGP={targetGP} sym={sym}
            meta={[["Serves per bottle", servesPerBottle.toFixed(1)], ["Cost per serve", `${sym}${cpu.toFixed(2)}`]]} />
        </Card>
      )}
    </div>
  );
}

function SpiritsCalc({ sym, targetGP }) {
  const [f, setF] = useState({ bottleCost: "", bottleSize: "700", measureSize: "25", sellingPrice: "" });
  const up = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const bottleCost = parseFloat(f.bottleCost) || 0;
  const measures = parseFloat(f.bottleSize) / parseFloat(f.measureSize);
  const cpu = bottleCost / measures;
  const sell = parseFloat(f.sellingPrice) || 0;
  return (
    <div>
      <Card>
        <Label>Bottle Purchase Cost</Label>
        <Field prefix={sym} value={f.bottleCost} onChange={up("bottleCost")} placeholder="0.00" />
        <Label>Bottle Size</Label>
        <Dropdown value={f.bottleSize} onChange={up("bottleSize")}>
          <option value="700">700ml</option>
          <option value="1000">1 Litre</option>
        </Dropdown>
        <Label>Measure Size</Label>
        <Dropdown value={f.measureSize} onChange={up("measureSize")}>
          <option value="25">25ml — Single (England & Wales)</option>
          <option value="35">35ml — Single (Scotland & Ireland)</option>
          <option value="50">50ml — Double (England & Wales)</option>
          <option value="70">70ml — Double (Scotland & Ireland)</option>
        </Dropdown>
        <Label>Selling Price Per Measure</Label>
        <Field prefix={sym} value={f.sellingPrice} onChange={up("sellingPrice")} placeholder="0.00" />
      </Card>
      {bottleCost > 0 && (
        <Card>
          <GPResultBox costPerUnit={cpu} sellingPrice={f.sellingPrice} gpVal={calcGP(cpu, sell)} targetGP={targetGP} sym={sym}
            meta={[["Measures per bottle", measures.toFixed(0)], ["Cost per measure", `${sym}${cpu.toFixed(2)}`]]} />
        </Card>
      )}
    </div>
  );
}

function DrinksGPTab({ sym, targetGP }) {
  const [sub, setSub] = useState("draught");
  return (
    <div>
      <SegControl
        options={[["draught", "Draught"], ["bottled", "Bottles"], ["wine", "Wine"], ["spirits", "Spirits"]]}
        value={sub} onChange={setSub}
      />
      {sub === "draught" && <DraughtCalc sym={sym} targetGP={targetGP} />}
      {sub === "bottled" && <BottledCalc sym={sym} targetGP={targetGP} />}
      {sub === "wine" && <WineCalc sym={sym} targetGP={targetGP} />}
      {sub === "spirits" && <SpiritsCalc sym={sym} targetGP={targetGP} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VAT TAB
// ─────────────────────────────────────────────────────────────────────────────
function VATTab({ sym }) {
  const [f, setF] = useState({ amount: "", rate: "20", mode: "add" });
  const amount = parseFloat(f.amount) || 0;
  const rate = parseFloat(f.rate) / 100;
  const net = f.mode === "add" ? amount : amount / (1 + rate);
  const vatAmt = f.mode === "add" ? amount * rate : amount - amount / (1 + rate);
  const gross = f.mode === "add" ? amount + vatAmt : amount;
  return (
    <div>
      <Card>
        <SegControl options={[["add", "Add VAT"], ["remove", "Remove VAT"]]} value={f.mode} onChange={v => setF(x => ({ ...x, mode: v }))} />
        <Label>{f.mode === "add" ? "Net Amount (ex. VAT)" : "Gross Amount (inc. VAT)"}</Label>
        <Field prefix={sym} value={f.amount} onChange={e => setF(x => ({ ...x, amount: e.target.value }))} placeholder="0.00" />
        <Label>VAT Rate</Label>
        <Dropdown value={f.rate} onChange={e => setF(x => ({ ...x, rate: e.target.value }))}>
          <option value="20">Standard Rate (20%)</option>
          <option value="5">Reduced Rate (5%)</option>
          <option value="0">Zero Rated (0%)</option>
        </Dropdown>
      </Card>
      {amount > 0 && (
        <Card>
          <Label>Breakdown</Label>
          {[["Net (ex. VAT)", net, false], [`VAT (${f.rate}%)`, vatAmt, false], ["Gross (inc. VAT)", gross, true]].map(([lbl, val, bold]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: bold ? "none" : `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, color: bold ? C.text : C.muted, fontWeight: bold ? 600 : 400 }}>{lbl}</span>
              <span style={{ fontSize: bold ? 20 : 15, fontWeight: bold ? 700 : 500, color: bold ? C.primary : C.text }}>{sym}{val.toFixed(2)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCOUNT TAB
// ─────────────────────────────────────────────────────────────────────────────
function DiscountTab({ sym }) {
  const [f, setF] = useState({ price: "", type: "percent", value: "" });
  const price = parseFloat(f.price) || 0;
  const val = parseFloat(f.value) || 0;
  const discAmt = f.type === "percent" ? price * val / 100 : Math.min(val, price);
  const finalPrice = price - discAmt;
  const pct = price > 0 ? (discAmt / price * 100) : 0;
  return (
    <div>
      <Card>
        <Label>Original Price</Label>
        <Field prefix={sym} value={f.price} onChange={e => setF(x => ({ ...x, price: e.target.value }))} placeholder="0.00" />
        <Label>Discount Type</Label>
        <SegControl options={[["percent", "Percentage (%)"], ["fixed", `Fixed Amount (${sym})`]]} value={f.type} onChange={v => setF(x => ({ ...x, type: v, value: "" }))} />
        <Label>{f.type === "percent" ? "Discount Percentage" : "Discount Amount"}</Label>
        <Field
          prefix={f.type === "fixed" ? sym : undefined}
          suffix={f.type === "percent" ? "%" : undefined}
          value={f.value} onChange={e => setF(x => ({ ...x, value: e.target.value }))}
          placeholder={f.type === "percent" ? "e.g. 10" : "0.00"}
        />
      </Card>
      {price > 0 && val > 0 && (
        <Card>
          {[["Original Price", price, false, false], [`Discount (${pct.toFixed(1)}%)`, discAmt, true, false], ["Final Price", finalPrice, false, true]].map(([lbl, v, isDisc, bold]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: bold ? "none" : `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, color: bold ? C.text : isDisc ? C.danger : C.muted, fontWeight: bold ? 600 : 400 }}>{lbl}</span>
              <span style={{ fontSize: bold ? 22 : 15, fontWeight: bold ? 700 : 500, color: bold ? C.primary : isDisc ? C.danger : C.text }}>
                {isDisc ? "−" : ""}{sym}{v.toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <span style={{ fontSize: 14, color: C.success, fontWeight: 600 }}>Customer saves {sym}{discAmt.toFixed(2)}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BAR MEASURES TAB
// ─────────────────────────────────────────────────────────────────────────────
function MeasuresTab() {
  const [sys, setSys] = useState("metric");
  return (
    <div>
      <SegControl options={[["metric", "Metric (ml / L)"], ["imperial", "Imperial (fl oz / gal)"]]} value={sys} onChange={setSys} />
      {MEASURES_DATA.map(section => (
        <Card key={section.category}>
          <Label>{section.category}</Label>
          {section.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < section.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 14, color: C.text }}>{item.name}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{sys === "metric" ? item.metric : item.imperial}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SettingsModal({ currency, setCurrency, measureSystem, setMeasureSystem, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.white, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: 24, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Settings</div>
          <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16, color: C.muted }}>✕</button>
        </div>
        <Label>Currency</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {CURRENCIES.map(cur => (
            <button key={cur.code} onClick={() => setCurrency(cur)} style={{
              padding: "10px 8px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              border: `1.5px solid ${currency.code === cur.code ? C.primary : C.border}`,
              background: currency.code === cur.code ? "#F0FDF4" : C.bg,
              color: currency.code === cur.code ? C.primary : C.text,
              fontWeight: currency.code === cur.code ? 600 : 400,
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{cur.symbol}</div>
              <div style={{ fontSize: 12 }}>{cur.code}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{cur.name}</div>
            </button>
          ))}
        </div>
        <Label>Measurement System</Label>
        <SegControl
          options={[["metric", "Metric"], ["imperial", "Imperial"]]}
          value={measureSystem} onChange={setMeasureSystem}
        />
        <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>The Chef Pantry</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>Hospitality Calculators · Built for food & beverage professionals</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function ChefPantry() {
  const [tab, setTab] = useState("food");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [measureSystem, setMeasureSystem] = useState("metric");
  const [targetGP, setTargetGP] = useState(65);
  const [showSettings, setShowSettings] = useState(false);

  const sym = currency.symbol;

  const nav = [
    { id: "food", icon: "🍽️", label: "Food GP" },
    { id: "drinks", icon: "🍺", label: "Drinks GP" },
    { id: "vat", icon: "🧾", label: "VAT" },
    { id: "discount", icon: "🏷️", label: "Discount" },
    { id: "measures", icon: "📏", label: "Measures" },
  ];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: C.bg, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", position: "relative" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 100%)`, padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.4 }}>The Chef Pantry</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 0.6, marginTop: 1 }}>HOSPITALITY CALCULATORS</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{currency.code}</div>
            <button onClick={() => setShowSettings(true)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "7px 10px", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>⚙️</button>
          </div>
        </div>
        {/* GP Target strip */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>GP TARGET</span>
          <input type="range" min={40} max={85} value={targetGP} onChange={e => setTargetGP(Number(e.target.value))}
            style={{ flex: 1, accentColor: C.accent, cursor: "pointer", height: 4 }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: C.accent, minWidth: 46, textAlign: "right" }}>{targetGP}%</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 96px" }}>
        {tab === "food" && <FoodGPTab sym={sym} targetGP={targetGP} />}
        {tab === "drinks" && <DrinksGPTab sym={sym} targetGP={targetGP} />}
        {tab === "vat" && <VATTab sym={sym} />}
        {tab === "discount" && <DiscountTab sym={sym} />}
        {tab === "measures" && <MeasuresTab />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.white, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{
            flex: 1, border: "none", background: "transparent", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 2px 10px",
          }}>
            <span style={{ fontSize: 20, filter: tab === item.id ? "none" : "grayscale(1) opacity(0.45)", transition: "filter 0.15s" }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === item.id ? 700 : 400, color: tab === item.id ? C.primary : C.muted, fontFamily: "inherit", letterSpacing: 0.3 }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {showSettings && (
        <SettingsModal currency={currency} setCurrency={setCurrency} measureSystem={measureSystem} setMeasureSystem={setMeasureSystem} onClose={() => setShowSettings(false)} />
      )}

      <style>{`input[type=range]{height:4px;} input:focus{border-color:${C.light} !important;} button:active{opacity:0.75;}`}</style>
    </div>
  );
}
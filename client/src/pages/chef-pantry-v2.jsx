import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const FONT_LINK = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');`;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F7F6F2",
  card: "#FFFFFF",
  primary: "#1C3829",
  primaryMid: "#2D5A3D",
  gold: "#C9973A",
  goldLight: "#F5E6C8",
  text: "#1A1A18",
  muted: "#7A8880",
  border: "#E4E2DA",
  danger: "#B83232",
  dangerLight: "#FBF0F0",
  warn: "#C07A1A",
  warnLight: "#FDF3E0",
  success: "#1E6640",
  successLight: "#EBF5EE",
  overlay: "rgba(20,30,24,0.55)",
};

const CURRENCIES = [
  { code: "GBP", symbol: "£" }, { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" }, { code: "AUD", symbol: "A$" }, { code: "CAD", symbol: "C$" },
];

const MEASURES = [
  { category: "Beer & Cider", items: [
    { name: "Pint", metric: "568ml", imperial: "20 fl oz" },
    { name: "Half Pint", metric: "284ml", imperial: "10 fl oz" },
    { name: "⅔ Pint", metric: "379ml", imperial: "13.3 fl oz" },
    { name: "Third Pint", metric: "189ml", imperial: "6.7 fl oz" },
  ]},
  { category: "Spirits", items: [
    { name: "Single (Eng & Wales)", metric: "25ml", imperial: "0.85 fl oz" },
    { name: "Single (Scot & Ire)", metric: "35ml", imperial: "1.2 fl oz" },
    { name: "Double (Eng & Wales)", metric: "50ml", imperial: "1.7 fl oz" },
    { name: "Double (Scot & Ire)", metric: "70ml", imperial: "2.4 fl oz" },
  ]},
  { category: "Wine", items: [
    { name: "Small glass", metric: "125ml", imperial: "4.2 fl oz" },
    { name: "Standard glass", metric: "175ml", imperial: "5.9 fl oz" },
    { name: "Large glass", metric: "250ml", imperial: "8.5 fl oz" },
    { name: "Bottle", metric: "750ml", imperial: "25.4 fl oz" },
  ]},
  { category: "Kegs", items: [
    { name: "Mini keg", metric: "11L", imperial: "2.4 gal" },
    { name: "Pin", metric: "20.5L", imperial: "4.5 gal" },
    { name: "Firkin", metric: "41L", imperial: "9 gal" },
    { name: "Standard keg", metric: "50L", imperial: "11 gal" },
  ]},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gp = (cost, sell) => sell > 0 ? ((sell - cost) / sell) * 100 : 0;
const toHit = (cost, target) => target < 100 ? cost / (1 - target / 100) : 0;
const fmt = (n, d = 2) => n.toFixed(d);
const gpColor = (val, target) => val >= target ? C.success : val >= target - 10 ? C.warn : C.danger;
const gpBg = (val, target) => val >= target ? C.successLight : val >= target - 10 ? C.warnLight : C.dangerLight;

// ─── Shared UI ────────────────────────────────────────────────────────────────
const T = ({ children, size = 14, weight = 400, color = C.text, style = {} }) => (
  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: size, fontWeight: weight, color, ...style }}>{children}</span>
);

const Label = ({ children }) => (
  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: 1.4, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
    {children}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, borderRadius: 18, padding: "18px 20px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.border}`, ...style }}>
    {children}
  </div>
);

const Input = ({ prefix, suffix, value, onChange, placeholder, type = "number", style = {} }) => (
  <div style={{ position: "relative", marginBottom: 10 }}>
    {prefix && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14, pointerEvents: "none", zIndex: 1 }}>{prefix}</span>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box", padding: `11px ${suffix ? "38px" : "13px"} 11px ${prefix ? "30px" : "13px"}`, border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 15, color: C.text, background: C.bg, fontFamily: "'Outfit', sans-serif", outline: "none", ...style }} />
    {suffix && <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13, pointerEvents: "none" }}>{suffix}</span>}
  </div>
);

const Select = ({ children, value, onChange }) => (
  <select value={value} onChange={onChange} style={{ width: "100%", padding: "11px 13px", marginBottom: 10, border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, color: C.text, background: C.bg, fontFamily: "'Outfit', sans-serif", outline: "none", cursor: "pointer" }}>
    {children}
  </select>
);

const Seg = ({ options, value, onChange, compact }) => (
  <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 12, padding: 4, marginBottom: 12 }}>
    {options.map(([v, l]) => (
      <button key={v} onClick={() => onChange(v)} style={{
        flex: 1, padding: compact ? "7px 4px" : "9px 4px", borderRadius: 9, border: "none",
        background: value === v ? C.card : "transparent",
        color: value === v ? C.primary : C.muted,
        fontFamily: "'Outfit', sans-serif", fontSize: compact ? 12 : 13, fontWeight: value === v ? 600 : 400,
        cursor: "pointer", transition: "all 0.15s ease",
        boxShadow: value === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      }}>{l}</button>
    ))}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, full, small, style = {} }) => {
  const variants = {
    primary: { background: C.primary, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.muted, border: `1.5px solid ${C.border}` },
    gold: { background: C.gold, color: "#fff", border: "none" },
    danger: { background: C.dangerLight, color: C.danger, border: `1px solid ${C.danger}30` },
    ai: { background: `linear-gradient(135deg, #1C3829, #2D5A3D)`, color: "#fff", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...(variants[variant] || variants.primary),
      width: full ? "100%" : "auto",
      padding: small ? "8px 14px" : "12px 20px",
      borderRadius: 12, fontFamily: "'Outfit', sans-serif",
      fontSize: small ? 12 : 14, fontWeight: 600, cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.6 : 1, transition: "opacity 0.15s",
      ...style,
    }}>{children}</button>
  );
};

// ─── GP Result ────────────────────────────────────────────────────────────────
const GPResult = ({ costPerUnit, sellingPrice, gpVal, target, sym, meta }) => {
  const sell = parseFloat(sellingPrice) || 0;
  const diff = gpVal - target;
  const col = gpColor(gpVal, target);
  const suggested = toHit(costPerUnit, target);

  return (
    <div style={{ background: C.bg, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
      {meta && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {meta.map(([k, v]) => (
            <div key={k} style={{ background: C.card, borderRadius: 8, padding: "5px 10px", fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
              <span style={{ color: C.muted }}>{k}: </span><strong style={{ color: C.text }}>{v}</strong>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ background: C.card, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: 1, marginBottom: 3, fontFamily: "'Outfit', sans-serif" }}>UNIT COST</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.danger, fontFamily: "'Outfit', sans-serif" }}>{sym}{fmt(costPerUnit)}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: 1, marginBottom: 3, fontFamily: "'Outfit', sans-serif" }}>GROSS PROFIT</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: col, fontFamily: "'Outfit', sans-serif" }}>{fmt(gpVal, 1)}%</div>
        </div>
      </div>
      <div style={{ background: "#E8E4DC", borderRadius: 6, height: 8, position: "relative", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${Math.min(Math.max(gpVal, 0), 100)}%`, height: "100%", background: col, borderRadius: 6, transition: "width 0.5s cubic-bezier(.34,1.56,.64,1)" }} />
        <div style={{ position: "absolute", top: 0, left: `${target}%`, width: 2, height: "100%", background: C.primary, opacity: 0.5 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <T size={11} weight={600} color={col}>{diff >= 0 ? `✓ ${fmt(diff, 1)}% above target` : `✗ ${fmt(Math.abs(diff), 1)}% below target`}</T>
        <T size={11} color={C.muted}>Target: {target}%</T>
      </div>
      {gpVal < target && sell > 0 && (
        <div style={{ background: C.warnLight, border: `1px solid ${C.gold}50`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.warn, fontWeight: 700, letterSpacing: 1, marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>TO HIT {target}% TARGET</div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: C.warn }}>
            Charge {sym}{fmt(suggested)}
            <span style={{ fontSize: 13, fontWeight: 400, color: C.gold, marginLeft: 8 }}>+{sym}{fmt(suggested - sell)} more</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AI Suggestions ───────────────────────────────────────────────────────────
const AISuggestions = ({ dish, target, sym, aiData, loadingAI, onFetch }) => {
  if (!aiData) return (
    <Btn variant="ai" onClick={onFetch} disabled={loadingAI} full style={{ marginTop: 12 }}>
      {loadingAI ? "✦ Analysing your dish..." : "✦ Get AI Margin Suggestions"}
    </Btn>
  );
  return (
    <div style={{ marginTop: 12 }}>
      <Label>AI Recommendations</Label>
      {aiData.map((s, i) => {
        const impCol = { High: C.success, Medium: C.warn, Low: C.muted }[s.impact] || C.muted;
        return (
          <div key={i} style={{ background: C.bg, borderRadius: 12, padding: "12px 14px", marginBottom: 8, borderLeft: `3px solid ${impCol}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <T size={13} weight={600}>{s.tip}</T>
              <span style={{ fontSize: 10, fontWeight: 700, color: impCol, background: `${impCol}18`, padding: "2px 9px", borderRadius: 20, fontFamily: "'Outfit', sans-serif" }}>{s.impact}</span>
            </div>
            <T size={12} color={C.muted} style={{ lineHeight: "1.5", display: "block" }}>{s.detail}</T>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KITCHEN MODE — Menu Health + Dish Costing
// ─────────────────────────────────────────────────────────────────────────────
function KitchenMode({ sym, target }) {
  const [dishes, setDishes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Starter", ingredients: [{ name: "", cost: "" }], sellingPrice: "" });
  const [expanded, setExpanded] = useState(null);
  const [aiData, setAiData] = useState({});
  const [loadingAI, setLoadingAI] = useState(null);

  const dishCost = (d) => d.ingredients.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
  const dishGP = (d) => gp(dishCost(d), parseFloat(d.sellingPrice) || 0);

  const onTarget = dishes.filter(d => dishGP(d) >= target);
  const below = dishes.filter(d => dishGP(d) < target);
  const avgGP = dishes.length ? dishes.reduce((s, d) => s + dishGP(d), 0) / dishes.length : null;
  const worst = dishes.length ? dishes.reduce((a, b) => dishGP(a) < dishGP(b) ? a : b) : null;
  const best = dishes.length ? dishes.reduce((a, b) => dishGP(a) > dishGP(b) ? a : b) : null;

  const addDish = () => {
    if (!form.name.trim()) return;
    const id = Date.now();
    setDishes(p => [...p, { ...form, id }]);
    setExpanded(id);
    setForm({ name: "", category: "Starter", ingredients: [{ name: "", cost: "" }], sellingPrice: "" });
    setShowForm(false);
  };

  const fetchAI = async (dish) => {
    setLoadingAI(dish.id);
    const cost = dishCost(dish);
    const gpPct = dishGP(dish);
    const prompt = `You are a hospitality cost expert. Dish: "${dish.name}" (${dish.category}). Ingredients: ${dish.ingredients.filter(i => i.name).map(i => `${i.name} ${sym}${i.cost}`).join(", ")}. Total cost: ${sym}${cost.toFixed(2)}, Selling: ${sym}${dish.sellingPrice}, GP: ${gpPct.toFixed(1)}%, Target: ${target}%. Give 3 specific, actionable suggestions to improve GP. Respond ONLY with a JSON array: [{"tip":"max 5 words","detail":"1-2 sentences","impact":"High|Medium|Low"}]`;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers,
        body: JSON.stringify({ max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json();
      const txt = d.content.map(c => c.text || "").join("");
      setAiData(p => ({ ...p, [dish.id]: JSON.parse(txt.replace(/```json|```/g, "").trim()) }));
    } catch { setAiData(p => ({ ...p, [dish.id]: [{ tip: "Error", detail: "Please try again.", impact: "Low" }] })); }
    setLoadingAI(null);
  };

  return (
    <div>
      {/* Menu Health Dashboard */}
      {dishes.length > 0 && (
        <Card style={{ background: C.primary, border: "none", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 14, fontWeight: 600 }}>Menu Health</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              ["AVG GP", avgGP != null ? `${fmt(avgGP, 1)}%` : "–", avgGP >= target ? "#95D5B2" : "#F9A8A8"],
              ["ON TARGET", `${onTarget.length}/${dishes.length}`, "#95D5B2"],
              ["DISHES", dishes.length, "#C9D5E2"],
            ].map(([lbl, val, col]) => (
              <div key={lbl} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700, color: col }}>{val}</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
          {below.length > 0 && (
            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "10px 14px" }}>
              <T size={11} color="rgba(255,255,255,0.5)" weight={600} style={{ letterSpacing: 0.8, display: "block", marginBottom: 4 }}>NEEDS ATTENTION</T>
              {below.sort((a, b) => dishGP(a) - dishGP(b)).slice(0, 2).map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <T size={13} color="rgba(255,255,255,0.85)">{d.name}</T>
                  <T size={13} color="#F9A8A8" weight={700}>{fmt(dishGP(d), 1)}%</T>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Dish List */}
      {dishes.map(dish => {
        const cost = dishCost(dish);
        const sell = parseFloat(dish.sellingPrice) || 0;
        const gpVal = dishGP(dish);
        const col = gpColor(gpVal, target);
        const isOpen = expanded === dish.id;
        return (
          <Card key={dish.id} style={{ padding: "0" }}>
            <div onClick={() => setExpanded(isOpen ? null : dish.id)}
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <T size={15} weight={600}>{dish.name}</T>
                  <span style={{ fontSize: 10, background: C.bg, color: C.muted, padding: "2px 8px", borderRadius: 20, fontFamily: "'Outfit', sans-serif" }}>{dish.category}</span>
                </div>
                <T size={12} color={C.muted} style={{ display: "block", marginTop: 2 }}>{sym}{fmt(cost)} cost · {sym}{fmt(sell)} sell</T>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700, color: col, lineHeight: 1 }}>{fmt(gpVal, 1)}%</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.muted, marginTop: 2 }}>GP</div>
                </div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                {dish.ingredients.filter(i => i.name).map((ing, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                    <span style={{ color: C.text }}>{ing.name}</span>
                    <span style={{ color: C.muted }}>{sym}{fmt(parseFloat(ing.cost) || 0)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 14px", fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600 }}>
                  <span>Total food cost</span><span style={{ color: C.danger }}>{sym}{fmt(cost)}</span>
                </div>
                <GPResult costPerUnit={cost} sellingPrice={dish.sellingPrice} gpVal={gpVal} target={target} sym={sym} />
                <AISuggestions dish={dish} target={target} sym={sym} aiData={aiData[dish.id]} loadingAI={loadingAI === dish.id} onFetch={() => fetchAI(dish)} />
                <button onClick={() => setDishes(p => p.filter(d => d.id !== dish.id))}
                  style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 12, padding: "10px 0 0", fontFamily: "'Outfit', sans-serif" }}>
                  Remove dish
                </button>
              </div>
            )}
          </Card>
        );
      })}

      {/* Add Dish Form */}
      {showForm ? (
        <Card>
          <T size={16} weight={700} style={{ display: "block", marginBottom: 16 }}>New Dish</T>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 4 }}>
            <div>
              <Label>Dish Name</Label>
              <Input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pan-Seared Salmon" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {["Starter", "Main", "Dessert", "Side", "Snack"].map(c => <option key={c}>{c}</option>)}
              </Select>
            </div>
          </div>
          <Label>Ingredients & Costs</Label>
          {form.ingredients.map((ing, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="text" placeholder="Ingredient" value={ing.name}
                onChange={e => setForm(f => ({ ...f, ingredients: f.ingredients.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) }))}
                style={{ flex: 2, padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: C.bg, color: C.text }} />
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13, pointerEvents: "none" }}>{sym}</span>
                <input type="number" placeholder="0.00" value={ing.cost}
                  onChange={e => setForm(f => ({ ...f, ingredients: f.ingredients.map((x, idx) => idx === i ? { ...x, cost: e.target.value } : x) }))}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 8px 10px 22px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: "none", background: C.bg, color: C.text }} />
              </div>
              {form.ingredients.length > 1 && (
                <button onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))}
                  style={{ background: C.dangerLight, border: "none", borderRadius: 10, color: C.danger, cursor: "pointer", padding: "0 10px", fontSize: 18 }}>×</button>
              )}
            </div>
          ))}
          <button onClick={() => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: "", cost: "" }] }))}
            style={{ background: "none", border: `1.5px dashed ${C.border}`, borderRadius: 8, color: C.muted, cursor: "pointer", padding: "7px 14px", fontSize: 12, marginBottom: 14, fontFamily: "'Outfit', sans-serif" }}>
            + Add ingredient
          </button>
          <div style={{ background: C.bg, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <T size={13} color={C.muted}>Total food cost</T>
            <T size={13} weight={700} color={C.danger}>{sym}{fmt(form.ingredients.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0))}</T>
          </div>
          <Label>Selling Price</Label>
          <Input prefix={sym} value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} placeholder="0.00" />
          {form.sellingPrice && (() => {
            const cost = form.ingredients.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0);
            const gpPct = gp(cost, parseFloat(form.sellingPrice));
            const col = gpColor(gpPct, target);
            return (
              <div style={{ background: gpBg(gpPct, target), borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <T size={13} color={C.muted}>Projected GP</T>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <T size={15} weight={700} color={col}>{fmt(gpPct, 1)}%</T>
                  {gpPct < target && <T size={12} color={C.warn}>Suggest {sym}{fmt(toHit(cost, target))}</T>}
                </div>
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={addDish} full>Add Dish</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      ) : (
        <button onClick={() => setShowForm(true)}
          style={{ width: "100%", padding: 18, border: `2px dashed ${C.border}`, borderRadius: 18, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 15, fontFamily: "'Outfit', sans-serif" }}>
          + Add New Dish
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BAR MODE — AI Quick Ask + Calculators + Reference
// ─────────────────────────────────────────────────────────────────────────────
function BarMode({ sym, target }) {
  const [barTab, setBarTab] = useState("ask");

  return (
    <div>
      <Seg options={[["ask", "✦ Ask AI"], ["calc", "Calculators"], ["ref", "Reference"]]} value={barTab} onChange={setBarTab} />
      {barTab === "ask" && <QuickAsk sym={sym} target={target} />}
      {barTab === "calc" && <BarCalcs sym={sym} target={target} />}
      {barTab === "ref" && <Reference />}
    </div>
  );
}

// ─── AI Quick Ask ─────────────────────────────────────────────────────────────
function QuickAsk({ sym, target }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! I can help you work out margins on the spot. Try asking something like:\n\n"I'm paying ${sym}85 for a 30L Peroni keg and selling pints at ${sym}5.20 — is that any good?"\n\nOr: "What should I charge for a 175ml glass of wine if the bottle costs me ${sym}6?"` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    const systemPrompt = `You are a sharp, knowledgeable hospitality margins expert embedded in a bar manager's tool called The Chef Pantry. The user's currency is ${sym} and their target GP is ${target}%.

When answering questions about margins and pricing:
1. Do the maths clearly and show working
2. State the actual GP% achieved
3. Say whether it's above or below their ${target}% target
4. Give a specific recommended selling price if they need to hit target
5. Be concise and direct — bar managers are busy people
6. If the question isn't about hospitality costs/margins, gently redirect

Format your response in plain conversational English. Use numbers clearly. Keep it under 120 words unless the question genuinely requires more.`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const history = messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers,
        body: JSON.stringify({
          max_tokens: 500,
          system: systemPrompt,
          messages: [...history, { role: "user", content: userMsg }],
        }),
      });
      const d = await res.json();
      const reply = d.content.map(c => c.text || "").join("").trim();
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const starters = [
    `${sym}85 for 30L keg, selling pints at ${sym}5.20 — good GP?`,
    `Bottle of wine costs ${sym}6, what should I sell 175ml for?`,
    `Spirits bottle ${sym}22, what's my GP on a ${sym}4.50 single?`,
  ];

  return (
    <div>
      <Card style={{ background: C.primary, border: "none", padding: "16px 18px" }}>
        <T size={13} weight={600} color="rgba(255,255,255,0.6)" style={{ display: "block", marginBottom: 4, letterSpacing: 0.5 }}>JUST ASK</T>
        <T size={14} color="rgba(255,255,255,0.85)" style={{ display: "block", lineHeight: "1.5" }}>Type any pricing or margin question in plain English and get an instant answer.</T>
      </Card>

      {/* Starter prompts */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {starters.map((s, i) => (
            <button key={i} onClick={() => setInput(s)} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px",
              textAlign: "left", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.muted,
              lineHeight: 1.4,
            }}>↗ {s}</button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ minHeight: 80, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "88%", background: m.role === "user" ? C.primary : C.card,
              color: m.role === "user" ? "#fff" : C.text,
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: m.role === "user" ? "none" : `1px solid ${C.border}`,
            }}>
              <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" }}>{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "4px 18px 18px 18px", padding: "12px 18px" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about any margin or price..."
          style={{ flex: 1, padding: "13px 16px", border: `1.5px solid ${C.border}`, borderRadius: 14, fontSize: 14, fontFamily: "'Outfit', sans-serif", background: C.card, color: C.text, outline: "none" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          background: C.primary, border: "none", borderRadius: 14, padding: "0 20px",
          color: "#fff", fontSize: 20, cursor: "pointer", opacity: loading || !input.trim() ? 0.5 : 1,
        }}>↑</button>
      </div>
    </div>
  );
}

// ─── Bar Calculators ──────────────────────────────────────────────────────────
function BarCalcs({ sym, target }) {
  const [sub, setSub] = useState("draught");
  return (
    <div>
      <Seg compact options={[["draught", "Draught"], ["bottles", "Bottles"], ["wine", "Wine"], ["spirits", "Spirits"]]} value={sub} onChange={setSub} />
      {sub === "draught" && <DraughtCalc sym={sym} target={target} />}
      {sub === "bottles" && <BottlesCalc sym={sym} target={target} />}
      {sub === "wine" && <WineCalc sym={sym} target={target} />}
      {sub === "spirits" && <SpiritsCalc sym={sym} target={target} />}
    </div>
  );
}

function DraughtCalc({ sym, target }) {
  const [f, setF] = useState({ kegCost: "", kegSize: "30", serving: "568", wastage: "5", sell: "" });
  const u = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const kegCost = parseFloat(f.kegCost) || 0;
  const usable = parseFloat(f.kegSize) * 1000 * (1 - parseFloat(f.wastage) / 100);
  const units = usable / parseFloat(f.serving);
  const cpu = kegCost / units;
  const gpVal = gp(cpu, parseFloat(f.sell) || 0);
  return (
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Keg Cost</Label>
          <Input prefix={sym} value={f.kegCost} onChange={u("kegCost")} placeholder="0.00" />
        </div>
        <div>
          <Label>Keg Size</Label>
          <Select value={f.kegSize} onChange={u("kegSize")}>
            <option value="11">11L Mini</option><option value="20">20L</option>
            <option value="30">30L</option><option value="50">50L</option>
          </Select>
        </div>
        <div>
          <Label>Serving Size</Label>
          <Select value={f.serving} onChange={u("serving")}>
            <option value="568">Pint</option><option value="284">Half Pint</option>
            <option value="379">⅔ Pint</option><option value="189">Third Pint</option>
          </Select>
        </div>
        <div>
          <Label>Wastage</Label>
          <Input value={f.wastage} onChange={u("wastage")} suffix="%" placeholder="5" />
        </div>
      </div>
      <Label>Selling Price / Serve</Label>
      <Input prefix={sym} value={f.sell} onChange={u("sell")} placeholder="0.00" />
      {kegCost > 0 && <GPResult costPerUnit={cpu} sellingPrice={f.sell} gpVal={gpVal} target={target} sym={sym} meta={[["Usable", `${fmt(usable, 0)}ml`], ["Units", fmt(units, 1)]]} />}
    </Card>
  );
}

function BottlesCalc({ sym, target }) {
  const [f, setF] = useState({ caseCost: "", units: "24", sell: "" });
  const u = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const caseCost = parseFloat(f.caseCost) || 0;
  const units = parseInt(f.units) || 1;
  const cpu = caseCost / units;
  const gpVal = gp(cpu, parseFloat(f.sell) || 0);
  return (
    <Card>
      <Label>Case Cost</Label>
      <Input prefix={sym} value={f.caseCost} onChange={u("caseCost")} placeholder="0.00" />
      <Label>Units per Case</Label>
      <Select value={f.units} onChange={u("units")}>
        <option value="8">8 units</option><option value="12">12 units</option>
        <option value="24">24 units</option><option value="48">48 units</option>
      </Select>
      <Label>Selling Price / Bottle</Label>
      <Input prefix={sym} value={f.sell} onChange={u("sell")} placeholder="0.00" />
      {caseCost > 0 && <GPResult costPerUnit={cpu} sellingPrice={f.sell} gpVal={gpVal} target={target} sym={sym} meta={[["Cost/unit", `${sym}${fmt(cpu)}`]]} />}
    </Card>
  );
}

function WineCalc({ sym, target }) {
  const [f, setF] = useState({ bottleCost: "", serve: "175", sell: "" });
  const u = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const bottleCost = parseFloat(f.bottleCost) || 0;
  const serve = parseFloat(f.serve);
  const serves = serve === 750 ? 1 : 750 / serve;
  const cpu = bottleCost / serves;
  const gpVal = gp(cpu, parseFloat(f.sell) || 0);
  return (
    <Card>
      <Label>Bottle Cost</Label>
      <Input prefix={sym} value={f.bottleCost} onChange={u("bottleCost")} placeholder="0.00" />
      <Label>Serve Size</Label>
      <Select value={f.serve} onChange={u("serve")}>
        <option value="125">125ml glass</option><option value="175">175ml glass</option>
        <option value="250">250ml glass</option><option value="750">Full bottle</option>
      </Select>
      <Label>Selling Price / Serve</Label>
      <Input prefix={sym} value={f.sell} onChange={u("sell")} placeholder="0.00" />
      {bottleCost > 0 && <GPResult costPerUnit={cpu} sellingPrice={f.sell} gpVal={gpVal} target={target} sym={sym} meta={[["Serves/bottle", fmt(serves, 1)], ["Cost/serve", `${sym}${fmt(cpu)}`]]} />}
    </Card>
  );
}

function SpiritsCalc({ sym, target }) {
  const [f, setF] = useState({ bottleCost: "", size: "700", measure: "25", sell: "" });
  const u = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const bottleCost = parseFloat(f.bottleCost) || 0;
  const measures = parseFloat(f.size) / parseFloat(f.measure);
  const cpu = bottleCost / measures;
  const gpVal = gp(cpu, parseFloat(f.sell) || 0);
  return (
    <Card>
      <Label>Bottle Cost</Label>
      <Input prefix={sym} value={f.bottleCost} onChange={u("bottleCost")} placeholder="0.00" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Bottle Size</Label>
          <Select value={f.size} onChange={u("size")}>
            <option value="700">700ml</option><option value="1000">1 Litre</option>
          </Select>
        </div>
        <div>
          <Label>Measure</Label>
          <Select value={f.measure} onChange={u("measure")}>
            <option value="25">25ml Single</option><option value="35">35ml Single</option>
            <option value="50">50ml Double</option><option value="70">70ml Double</option>
          </Select>
        </div>
      </div>
      <Label>Selling Price / Measure</Label>
      <Input prefix={sym} value={f.sell} onChange={u("sell")} placeholder="0.00" />
      {bottleCost > 0 && <GPResult costPerUnit={cpu} sellingPrice={f.sell} gpVal={gpVal} target={target} sym={sym} meta={[["Measures/bottle", fmt(measures, 0)], ["Cost/measure", `${sym}${fmt(cpu)}`]]} />}
    </Card>
  );
}

// ─── Reference ────────────────────────────────────────────────────────────────
function Reference() {
  const [refTab, setRefTab] = useState("measures");
  const [sys, setSys] = useState("metric");

  return (
    <div>
      <Seg compact options={[["measures", "Measures"], ["vat", "VAT"], ["discount", "Discount"]]} value={refTab} onChange={setRefTab} />
      {refTab === "measures" && (
        <div>
          <Seg compact options={[["metric", "Metric"], ["imperial", "Imperial"]]} value={sys} onChange={setSys} />
          {MEASURES.map(s => (
            <Card key={s.category}>
              <Label>{s.category}</Label>
              {s.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < s.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <T size={14}>{item.name}</T>
                  <T size={14} weight={600} color={C.primaryMid}>{sys === "metric" ? item.metric : item.imperial}</T>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
      {refTab === "vat" && <VATCalc />}
      {refTab === "discount" && <DiscountCalc />}
    </div>
  );
}

function VATCalc() {
  const [sym] = useState("£");
  const [f, setF] = useState({ amount: "", rate: "20", mode: "add" });
  const amount = parseFloat(f.amount) || 0;
  const rate = parseFloat(f.rate) / 100;
  const net = f.mode === "add" ? amount : amount / (1 + rate);
  const vatAmt = f.mode === "add" ? amount * rate : amount - amount / (1 + rate);
  const gross = f.mode === "add" ? amount + vatAmt : amount;
  return (
    <Card>
      <Seg options={[["add", "Add VAT"], ["remove", "Remove VAT"]]} value={f.mode} onChange={v => setF(x => ({ ...x, mode: v }))} />
      <Label>{f.mode === "add" ? "Net Amount" : "Gross Amount"}</Label>
      <Input prefix={sym} value={f.amount} onChange={e => setF(x => ({ ...x, amount: e.target.value }))} placeholder="0.00" />
      <Label>VAT Rate</Label>
      <Select value={f.rate} onChange={e => setF(x => ({ ...x, rate: e.target.value }))}>
        <option value="20">Standard (20%)</option><option value="5">Reduced (5%)</option><option value="0">Zero Rated (0%)</option>
      </Select>
      {amount > 0 && (
        <div style={{ background: C.bg, borderRadius: 12, padding: "4px 0", marginTop: 4 }}>
          {[["Net (ex. VAT)", net, false], [`VAT (${f.rate}%)`, vatAmt, false], ["Gross (inc. VAT)", gross, true]].map(([lbl, val, bold]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: bold ? "none" : `1px solid ${C.border}` }}>
              <T size={14} weight={bold ? 600 : 400} color={bold ? C.text : C.muted}>{lbl}</T>
              <T size={bold ? 20 : 15} weight={bold ? 700 : 500} color={bold ? C.primary : C.text}>£{val.toFixed(2)}</T>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DiscountCalc() {
  const [sym] = useState("£");
  const [f, setF] = useState({ price: "", type: "percent", value: "" });
  const price = parseFloat(f.price) || 0;
  const val = parseFloat(f.value) || 0;
  const discAmt = f.type === "percent" ? price * val / 100 : Math.min(val, price);
  const finalPrice = price - discAmt;
  const pct = price > 0 ? (discAmt / price * 100) : 0;
  return (
    <Card>
      <Label>Original Price</Label>
      <Input prefix={sym} value={f.price} onChange={e => setF(x => ({ ...x, price: e.target.value }))} placeholder="0.00" />
      <Seg options={[["percent", "Percentage"], ["fixed", `Fixed ${sym}`]]} value={f.type} onChange={v => setF(x => ({ ...x, type: v, value: "" }))} />
      <Label>{f.type === "percent" ? "Discount %" : "Discount Amount"}</Label>
      <Input prefix={f.type === "fixed" ? sym : undefined} suffix={f.type === "percent" ? "%" : undefined}
        value={f.value} onChange={e => setF(x => ({ ...x, value: e.target.value }))} placeholder={f.type === "percent" ? "e.g. 10" : "0.00"} />
      {price > 0 && val > 0 && (
        <div style={{ background: C.bg, borderRadius: 12, padding: "4px 0", marginTop: 4 }}>
          {[["Original", price, false, false], [`Discount (${fmt(pct, 1)}%)`, discAmt, true, false], ["Final Price", finalPrice, false, true]].map(([lbl, v, isDisc, bold]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: bold ? "none" : `1px solid ${C.border}` }}>
              <T size={14} weight={bold ? 600 : 400} color={isDisc ? C.danger : bold ? C.text : C.muted}>{lbl}</T>
              <T size={bold ? 20 : 15} weight={bold ? 700 : 500} color={bold ? C.primary : isDisc ? C.danger : C.text}>{isDisc ? "−" : ""}{sym}{v.toFixed(2)}</T>
            </div>
          ))}
          <div style={{ margin: "10px 14px 4px", background: C.successLight, border: `1px solid ${C.success}30`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
            <T size={14} weight={600} color={C.success}>Customer saves {sym}{fmt(discAmt)}</T>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function Settings({ currency, setCurrency, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <T size={18} weight={700}>Settings</T>
          <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16, color: C.muted }}>✕</button>
        </div>
        <Label>Currency</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
          {CURRENCIES.map(cur => (
            <button key={cur.code} onClick={() => setCurrency(cur)} style={{
              padding: "10px 4px", borderRadius: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
              border: `1.5px solid ${currency.code === cur.code ? C.primary : C.border}`,
              background: currency.code === cur.code ? "#EBF5EE" : C.bg,
              color: currency.code === cur.code ? C.primary : C.text,
              fontWeight: currency.code === cur.code ? 700 : 400,
            }}>
              <div style={{ fontSize: 16 }}>{cur.symbol}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{cur.code}</div>
            </button>
          ))}
        </div>
        <div style={{ background: C.bg, borderRadius: 12, padding: 14 }}>
          <T size={13} weight={600} style={{ display: "block", marginBottom: 2 }}>The Chef Pantry</T>
          <T size={12} color={C.muted}>Hospitality Calculators · v2</T>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function ChefPantryV2() {
  const [mode, setMode] = useState(null); // null = picker, "kitchen", "bar"
  const [target, setTarget] = useState(65);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [showSettings, setShowSettings] = useState(false);

  const sym = currency.symbol;

  // Mode Picker
  if (!mode) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
      <style>{FONT_LINK}</style>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: C.primary, lineHeight: 1.1, marginBottom: 8 }}>The Chef Pantry</div>
        <T size={14} color={C.muted}>Who's using this right now?</T>
      </div>

      {[
        { id: "kitchen", icon: "👨‍🍳", title: "Kitchen", subtitle: "Menu costing, dish GP, ingredient breakdown, AI suggestions", detail: "Best for: Costing a new menu or reviewing dish margins" },
        { id: "bar", icon: "🍺", title: "Bar", subtitle: "Quick GP checks, conversational AI, pour calculations", detail: "Best for: Cash & carry, writing a menu, on-the-spot checks" },
      ].map(m => (
        <button key={m.id} onClick={() => setMode(m.id)} style={{
          width: "100%", background: C.card, border: `2px solid ${C.border}`, borderRadius: 20,
          padding: "22px 24px", marginBottom: 14, cursor: "pointer", textAlign: "left",
          fontFamily: "'Outfit', sans-serif", transition: "all 0.15s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = "#F0F7F3"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{m.icon}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.primary, marginBottom: 4 }}>{m.title} Mode</div>
          <T size={14} color={C.muted} style={{ display: "block", lineHeight: 1.5, marginBottom: 8 }}>{m.subtitle}</T>
          <T size={12} color={C.gold} weight={600}>{m.detail}</T>
        </button>
      ))}

      <T size={12} color={C.muted} style={{ display: "block", textAlign: "center", marginTop: 8 }}>You can switch modes anytime from the header</T>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: C.bg, minHeight: "100vh", fontFamily: "'Outfit', sans-serif", position: "relative" }}>
      <style>{`
        ${FONT_LINK}
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        input:focus,select:focus{border-color:${C.primaryMid} !important; box-shadow:0 0 0 3px ${C.primaryMid}15;}
        button:active{opacity:0.75;}
        input[type=range]{height:4px; accent-color:${C.gold};}
        ::-webkit-scrollbar{width:0;}
      `}</style>

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setMode(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.muted }}>
              ← Switch
            </button>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: C.primary, lineHeight: 1 }}>The Chef Pantry</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: C.muted, letterSpacing: 0.8 }}>{mode === "kitchen" ? "👨‍🍳 KITCHEN MODE" : "🍺 BAR MODE"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: C.bg, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.primary, fontWeight: 600 }}>{currency.code}</div>
            <button onClick={() => setShowSettings(true)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 10px", cursor: "pointer", fontSize: 16 }}>⚙️</button>
          </div>
        </div>
        {/* GP Target */}
        <div style={{ background: C.bg, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <T size={10} weight={700} color={C.muted} style={{ letterSpacing: 1.2, flexShrink: 0 }}>GP TARGET</T>
          <input type="range" min={40} max={85} value={target} onChange={e => setTarget(Number(e.target.value))} style={{ flex: 1, cursor: "pointer" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.gold, minWidth: 46, textAlign: "right" }}>{target}%</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 40px" }}>
        {mode === "kitchen" && <KitchenMode sym={sym} target={target} />}
        {mode === "bar" && <BarMode sym={sym} target={target} />}
      </div>

      {showSettings && <Settings currency={currency} setCurrency={setCurrency} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

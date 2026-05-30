// Desktop: Caja del día
function DesktopCashScreen() {
  const rows = [
    { label: "Efectivo",            amount: "$57.000",  color: "#1A1D21", pct: "6%"  },
    { label: "Transferencias",      amount: "$228.000", color: "#1A1D21", pct: "23%" },
    { label: "Pagado con crédito",  amount: "$646.000", color: "#534AB7", pct: "64%" },
    { label: "Cargas de crédito",   amount: "$285.000", color: "#1D9E75", pct: "—", note: "ingreso nuevo" },
  ];
  // Bar segments
  const segments = [
    { v: 57, c: "#1A1D21" },
    { v: 228, c: "#4B5158" },
    { v: 646, c: "#534AB7" },
  ];
  const total = segments.reduce((s, x) => s + x.v, 0);

  return (
    <DesktopFrame active="caja" user={{ name: "Carlos Torres", role: "Administrativo", color: "#1D9E75" }}>
      <div style={{ padding: "32px 40px 50px", maxWidth: 1100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Caja del día</div>
            <div style={{ fontSize: 15, color: "#8A9099", marginTop: 3 }}>Lunes 16 de junio</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{
              height: 44, padding: "0 16px", borderRadius: 12,
              background: "#fff", border: "1px solid #E8EAED", color: "#4B5158",
              fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <I.calendar size={18} stroke={1.75} /> Cambiar fecha
            </button>
            <button style={{
              height: 44, padding: "0 18px", borderRadius: 12,
              background: "#378ADD", border: "none", color: "#fff",
              fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(55,138,221,0.22)",
            }}>
              <I.download size={18} stroke={2.25} color="#fff" /> Descargar Excel
            </button>
          </div>
        </div>

        {/* Hero total */}
        <div style={{
          background: "#fff", border: "1px solid #EFF1F3", borderRadius: 18,
          padding: "28px 32px", marginBottom: 22,
        }}>
          <div style={{ fontSize: 13, color: "#8A9099", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Total del día</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 8 }}>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2.5, color: "#1A1D21", lineHeight: 1 }}>$1.007.500</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#1D9E75", fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
              +12% vs. semana pasada
            </div>
          </div>

          {/* Stacked bar */}
          <div style={{ marginTop: 22, display: "flex", height: 12, borderRadius: 999, overflow: "hidden", background: "#F1F2F4" }}>
            {segments.map((s, i) => (
              <div key={i} style={{ width: `${(s.v / total) * 100}%`, background: s.c }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 12.5, color: "#4B5158" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#1A1D21" }} /> Efectivo</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#4B5158" }} /> Transferencias</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#534AB7" }} /> Crédito</span>
          </div>
        </div>

        {/* Composition + side panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #EFF1F3", borderRadius: 16, padding: "8px 24px" }}>
            <div style={{ padding: "16px 0 8px", fontSize: 13, fontWeight: 700, color: "#8A9099", letterSpacing: 0.3, textTransform: "uppercase" }}>Cómo se compone</div>
            {rows.map((r, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr auto 80px",
                alignItems: "center", padding: "16px 0",
                borderBottom: i < rows.length - 1 ? "1px solid #F1F2F4" : "none",
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1D21" }}>{r.label}</div>
                  {r.note && <div style={{ fontSize: 12, color: "#1D9E75", marginTop: 2, fontWeight: 500 }}>{r.note}</div>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: r.color, letterSpacing: -0.3, padding: "0 18px" }}>{r.amount}</div>
                <div style={{ textAlign: "right", fontSize: 13, color: "#8A9099", fontWeight: 500 }}>{r.pct}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#fff", border: "1px solid #EFF1F3", borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, color: "#8A9099", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Pedidos cargados</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, marginTop: 6 }}>94</div>
              <div style={{ fontSize: 13, color: "#8A9099", marginTop: 2 }}>Ticket promedio <strong style={{ color: "#1A1D21" }}>$10.718</strong></div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #EFF1F3", borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ fontSize: 12, color: "#8A9099", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Pendientes de cobro</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, marginTop: 6, color: "#E0851F" }}>$117.000</div>
              <div style={{ fontSize: 13, color: "#8A9099", marginTop: 2 }}>13 pedidos sin pago</div>
            </div>
            <div style={{ background: "#ECEAF8", borderRadius: 16, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <I.wallet size={20} stroke={1.85} color="#fff" />
              </div>
              <div style={{ fontSize: 13, color: "#3A3380", lineHeight: 1.45 }}>
                <strong>Atención:</strong> el <strong>64%</strong> del consumo fue con crédito prepago. Si querés cobrar más, recordales a las familias que recarguen.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}
window.DesktopCashScreen = DesktopCashScreen;

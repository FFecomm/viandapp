// Caja del día — administrativo
function CashScreen() {
  const rows = [
    { label: "Efectivo",            amount: "$57.000",  color: "#1A1D21" },
    { label: "Transferencias",      amount: "$228.000", color: "#1A1D21" },
    { label: "Pagado con crédito",  amount: "$646.000", color: "#534AB7" },
    { label: "Cargas de crédito",   amount: "$285.000", color: "#1D9E75" },
  ];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 110 }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px 8px",
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Caja</div>
              <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>Lunes 16 de junio</div>
            </div>
            <Avatar name="Carlos Torres" color="#1D9E75" size={44} />
          </div>

          {/* Total */}
          <div style={{ padding: "32px 24px 8px" }}>
            <div style={{ fontSize: 14, color: "#8A9099", fontWeight: 500 }}>Total del día</div>
            <div style={{
              fontSize: 56, fontWeight: 700, letterSpacing: -2.2, color: "#1A1D21",
              marginTop: 6, lineHeight: 1.05,
            }}>$1.007.500</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, color: "#1D9E75", fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
              +12% vs. semana pasada
            </div>
          </div>

          {/* Composition */}
          <div style={{ padding: "28px 20px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#8A9099", letterSpacing: 0.2, textTransform: "uppercase", marginBottom: 10, padding: "0 4px" }}>
              Cómo se compone
            </div>
            <div style={{
              background: "#F7F8FA", borderRadius: 18, padding: "4px 18px",
            }}>
              {rows.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 0",
                  borderBottom: i < rows.length - 1 ? "1px solid #E8EAED" : "none",
                }}>
                  <div style={{ fontSize: 15, color: "#4B5158", fontWeight: 500 }}>{r.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: r.color, letterSpacing: -0.3 }}>{r.amount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary stat */}
          <div style={{ padding: "16px 24px 0", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #EFF1F3", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: "#8A9099", fontWeight: 500 }}>Pedidos</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>94</div>
            </div>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #EFF1F3", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: "#8A9099", fontWeight: 500 }}>Ticket prom.</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>$10.718</div>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 94, padding: "0 20px" }}>
          <PrimaryButton icon={<I.download size={20} stroke={2.25} color="#fff" />}>Descargar planilla</PrimaryButton>
        </div>

        <TabBar active="caja" />
      </div>
    </PhoneFrame>
  );
}
window.CashScreen = CashScreen;

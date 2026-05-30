// VARIANT — Caja del día con gráficos (donut + sparkline semanal)
function CashVariantScreen() {
  // Donut segments
  const total = 1007500;
  const segs = [
    { label: "Crédito",        v: 646000, color: "#534AB7" },
    { label: "Transferencias", v: 228000, color: "#378ADD" },
    { label: "Efectivo",       v: 57000,  color: "#1A1D21" },
    { label: "Recargas",       v: 76500,  color: "#1D9E75" },
  ];
  // Donut math
  const R = 64, C = 2 * Math.PI * R;
  let acc = 0;
  const donut = segs.map(s => {
    const len = (s.v / total) * C;
    const off = -acc;
    acc += len;
    return { ...s, len, off };
  });

  // Sparkline data (7 days)
  const days = [890, 920, 1050, 870, 980, 1110, 1007];
  const max = Math.max(...days);
  const spark = days.map((d, i) => ({ x: i * (260 / 6), y: 60 - (d / max) * 50 }));
  const pathD = spark.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 100 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 8px" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Caja</div>
              <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>Lunes 16 de junio</div>
            </div>
            <Avatar name="Carlos Torres" color="#1D9E75" size={44} />
          </div>

          {/* Donut card */}
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{
              background: "linear-gradient(160deg, #FAFAFB 0%, #F1F2F4 100%)",
              borderRadius: 22, padding: "22px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
                  <circle cx="80" cy="80" r={R} fill="none" stroke="#fff" strokeWidth="18" />
                  {donut.map((s, i) => (
                    <circle key={i} cx="80" cy="80" r={R} fill="none"
                      stroke={s.color} strokeWidth="18"
                      strokeDasharray={`${s.len} ${C}`}
                      strokeDashoffset={s.off}
                      transform="rotate(-90 80 80)"
                      strokeLinecap="butt"
                    />
                  ))}
                  <text x="80" y="76" textAnchor="middle" fontSize="11" fill="#8A9099" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="0.5">TOTAL</text>
                  <text x="80" y="98" textAnchor="middle" fontSize="20" fill="#1A1D21" fontFamily="Inter, sans-serif" fontWeight="700" letterSpacing="-0.5">$1.007k</text>
                </svg>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {donut.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: "#4B5158", fontWeight: 500, flex: 1 }}>{s.label}</span>
                      <span style={{ fontSize: 12.5, color: "#1A1D21", fontWeight: 700 }}>{Math.round((s.v / total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Big number */}
          <div style={{ padding: "22px 24px 4px" }}>
            <div style={{ fontSize: 13, color: "#8A9099", fontWeight: 600 }}>Total del día</div>
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.6, color: "#1A1D21", marginTop: 4, lineHeight: 1 }}>$1.007.500</div>
          </div>

          {/* Sparkline */}
          <div style={{ padding: "12px 20px 0" }}>
            <div style={{
              background: "#fff", border: "1px solid #EFF1F3", borderRadius: 16, padding: "16px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, color: "#8A9099", fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase" }}>Últimos 7 días</div>
                <div style={{ fontSize: 13, color: "#1D9E75", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
                  +12%
                </div>
              </div>
              <svg width="100%" height="80" viewBox="0 0 260 70" preserveAspectRatio="none" style={{ marginTop: 6 }}>
                <defs>
                  <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#378ADD" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#378ADD" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${pathD} L260,70 L0,70 Z`} fill="url(#sparkfill)" />
                <path d={pathD} fill="none" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {spark.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={i === spark.length - 1 ? 4 : 2.5}
                    fill={i === spark.length - 1 ? "#378ADD" : "#fff"}
                    stroke="#378ADD" strokeWidth="1.5" />
                ))}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A9099", padding: "4px 2px 0" }}>
                {["Lun","Mar","Mié","Jue","Vie","Sáb","Hoy"].map((d, i) => (
                  <span key={i} style={{ fontWeight: i === 6 ? 700 : 500, color: i === 6 ? "#1A1D21" : "#8A9099" }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ padding: "12px 20px 0", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "#E4F5EE", border: "1px solid #C4E5D5", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "#0F6E51", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Pedidos</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginTop: 2, color: "#1A1D21" }}>94</div>
            </div>
            <div style={{ flex: 1, background: "#FAEEDA", border: "1px solid #F0E0BB", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "#7A5A14", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Pendientes</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginTop: 2, color: "#1A1D21" }}>$117k</div>
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
window.CashVariantScreen = CashVariantScreen;

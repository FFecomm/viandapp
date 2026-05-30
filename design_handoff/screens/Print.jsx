// Planilla imprimible — preview
function PrintScreen() {
  const salon = [
    { grade: "1° A", count: 12 },
    { grade: "1° B", count: 9  },
    { grade: "2° A", count: 14 },
    { grade: "2° B", count: 10 },
    { grade: "3° A", count: 13 },
    { grade: "3° B", count: 11 },
  ];
  const cocina = [
    { menu: "Menú A — Pollo al horno",    count: 28 },
    { menu: "Menú B — Milanesa c/ puré",  count: 31 },
    { menu: "Menú C — Ensalada",          count: 14 },
    { menu: "Hamburguesa",                count: 11 },
    { menu: "Fideos",                     count: 6  },
    { menu: "Sandwich",                   count: 4  },
  ];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 110 }}>
          <div style={{ padding: "14px 24px 8px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Planilla del día</div>
            <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>Para imprimir y entregar en cocina</div>
          </div>

          {/* Date selector */}
          <div style={{ padding: "10px 20px" }}>
            <div style={{
              height: 56, borderRadius: 14, border: "1px solid #E8EAED",
              padding: "0 14px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: "#E6F1FB",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#378ADD",
              }}>
                <I.calendar size={20} stroke={1.85} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#8A9099", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Fecha</div>
                <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 1 }}>Lunes 16 de junio</div>
              </div>
              <I.chevron size={18} color="#8A9099" />
            </div>
          </div>

          {/* Preview paper */}
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8A9099", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8, padding: "0 4px" }}>Vista previa</div>
            <div style={{
              background: "#fff", border: "1px solid #E8EAED",
              borderRadius: 12, padding: "20px 22px",
              boxShadow: "0 6px 20px rgba(20,25,30,0.06)",
              fontFamily: "Georgia, serif",
            }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Viandas — Lunes 16/06</div>
                <div style={{ fontSize: 12, color: "#8A9099", marginTop: 2, fontFamily: "var(--va-font)" }}>94 pedidos</div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D21", marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase", fontFamily: "var(--va-font)" }}>Salón</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14, fontFamily: "var(--va-font)" }}>
                {salon.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", borderBottom: "1px dashed #E8EAED" }}>
                    <span>{r.grade}</span>
                    <span style={{ fontWeight: 600 }}>{r.count}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1D21", marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase", fontFamily: "var(--va-font)" }}>Cocina</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--va-font)" }}>
                {cocina.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", borderBottom: "1px dashed #E8EAED" }}>
                    <span style={{ color: "#4B5158" }}>{r.menu}</span>
                    <span style={{ fontWeight: 600 }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 94, padding: "0 20px" }}>
          <PrimaryButton icon={<I.print size={20} stroke={2} color="#fff" />}>Imprimir planilla</PrimaryButton>
        </div>

        <TabBar active="mas" disabled={["caja"]} />
      </div>
    </PhoneFrame>
  );
}
window.PrintScreen = PrintScreen;

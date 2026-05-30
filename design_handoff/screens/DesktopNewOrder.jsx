// Desktop: Nuevo pedido (wizard) — step 3
function DesktopNewOrderScreen() {
  const menus = [
    { title: "Menú A",      desc: "Pollo al horno" },
    { title: "Menú B",      desc: "Milanesa con puré", selected: true },
    { title: "Menú C",      desc: "Ensalada saludable" },
    { title: "Hamburguesa", desc: "con papas" },
    { title: "Fideos",      desc: "con queso" },
    { title: "Sandwich",    desc: "de suprema" },
  ];
  const steps = ["Alumno", "Día", "Menú", "Pago", "Confirmar"];

  return (
    <DesktopFrame active="nuevo">
      <div style={{ padding: "32px 40px 40px", maxWidth: 920 }}>
        {/* Breadcrumb / step header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, fontSize: 13.5, color: "#8A9099" }}>
          <span>Pedidos</span><I.chevron size={14} /><span style={{ color: "#1A1D21", fontWeight: 600 }}>Nuevo pedido</span>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          {steps.map((s, i) => {
            const done = i < 2, current = i === 2;
            return (
              <React.Fragment key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: done ? "#1D9E75" : current ? "#378ADD" : "#F1F2F4",
                    color: (done || current) ? "#fff" : "#8A9099",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                  }}>{done ? <I.check size={16} stroke={3} color="#fff" /> : (i + 1)}</div>
                  <span style={{ fontSize: 13.5, fontWeight: current ? 700 : 500, color: current ? "#1A1D21" : "#8A9099" }}>{s}</span>
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < 2 ? "#1D9E75" : "#E8EAED", borderRadius: 2, maxWidth: 60 }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected student */}
        <div style={{
          background: "#F7F8FA", borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14, marginBottom: 28,
        }}>
          <Avatar name="Tomás García" color="#378ADD" size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: -0.2 }}>Tomás García</div>
            <div style={{ fontSize: 13.5, color: "#534AB7", marginTop: 2, fontWeight: 500 }}>3° A · Tiene 7 viandas a favor</div>
          </div>
          <button style={{
            height: 40, padding: "0 16px", borderRadius: 10, background: "#fff",
            border: "1px solid #E8EAED", color: "#1A66B5", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
          }}>Cambiar alumno</button>
        </div>

        {/* Question */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15 }}>¿Qué menú querés?</div>
          <div style={{ fontSize: 15, color: "#8A9099", marginTop: 6 }}>Elegí una de las opciones del día.</div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
          {menus.map((m, i) => (
            <div key={i} style={{
              minHeight: 110,
              background: m.selected ? "#E6F1FB" : "#fff",
              border: m.selected ? "2px solid #378ADD" : "1px solid #E8EAED",
              borderRadius: 16, padding: "18px 18px",
              display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
              position: "relative", cursor: "pointer",
            }}>
              {m.selected && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  width: 24, height: 24, borderRadius: 999, background: "#378ADD",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <I.check size={15} stroke={2.75} color="#fff" />
                </div>
              )}
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1D21", letterSpacing: -0.2 }}>{m.title}</div>
              <div style={{ fontSize: 14, color: "#4B5158" }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #F1F2F4" }}>
          <button style={{
            height: 44, padding: "0 18px", borderRadius: 12, background: "#fff",
            border: "1px solid #E8EAED", color: "#4B5158", fontSize: 14, fontWeight: 500,
            fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            <I.back size={16} /> Atrás
          </button>
          <button style={{
            height: 44, padding: "0 22px", borderRadius: 12, background: "#378ADD",
            border: "none", color: "#fff", fontSize: 14.5, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 2px 8px rgba(55,138,221,0.22)",
          }}>
            Continuar <I.chevron size={16} color="#fff" stroke={2.25} />
          </button>
        </div>
      </div>
    </DesktopFrame>
  );
}
window.DesktopNewOrderScreen = DesktopNewOrderScreen;

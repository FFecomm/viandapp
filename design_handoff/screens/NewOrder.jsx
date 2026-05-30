// Nuevo pedido — Paso 3: ¿Qué menú?
function NewOrderScreen() {
  const menus = [
    { title: "Menú A",      desc: "Pollo al horno" },
    { title: "Menú B",      desc: "Milanesa con puré", selected: true },
    { title: "Menú C",      desc: "Ensalada saludable" },
    { title: "Hamburguesa", desc: "con papas" },
    { title: "Fideos",      desc: "con queso" },
    { title: "Sandwich",    desc: "de suprema" },
  ];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        {/* Top bar */}
        <div style={{
          paddingTop: 56, paddingBottom: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "56px 20px 14px",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: "#F1F2F4",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <I.back size={22} stroke={2} />
          </div>
          <div style={{ fontSize: 14, color: "#8A9099", fontWeight: 600 }}>Paso 3 de 5</div>
          <div style={{ width: 40, height: 40, color: "#8A9099", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>Cancelar</div>
        </div>

        {/* Progress */}
        <div style={{ padding: "0 20px", display: "flex", gap: 4 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: i <= 2 ? "#378ADD" : "#E8EAED",
            }} />
          ))}
        </div>

        <div className="va-scroll" style={{ flex: 1, paddingBottom: 110 }}>
          {/* Selected student card */}
          <div style={{ padding: "20px 20px 8px" }}>
            <div style={{
              background: "#F7F8FA", borderRadius: 16, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <Avatar name="Tomás García" color="#378ADD" size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>Tomás García</div>
                <div style={{ fontSize: 13, color: "#534AB7", marginTop: 2, fontWeight: 500 }}>3° A · Tiene 7 viandas a favor</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#378ADD" }}>Cambiar</div>
            </div>
          </div>

          {/* Question */}
          <div style={{ padding: "22px 24px 14px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15 }}>¿Qué menú querés?</div>
            <div style={{ fontSize: 14.5, color: "#8A9099", marginTop: 6 }}>Tocá una opción para seleccionarla.</div>
          </div>

          {/* Menu grid */}
          <div style={{
            padding: "0 20px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          }}>
            {menus.map((m, i) => (
              <div key={i} style={{
                minHeight: 92,
                background: m.selected ? "#E6F1FB" : "#fff",
                border: m.selected ? "2px solid #378ADD" : "1px solid #E8EAED",
                borderRadius: 16, padding: "14px 14px",
                display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
                position: "relative",
              }}>
                {m.selected && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 22, height: 22, borderRadius: 999, background: "#378ADD",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <I.check size={14} stroke={2.75} color="#fff" />
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1D21", letterSpacing: -0.2 }}>{m.title}</div>
                <div style={{ fontSize: 13, color: "#4B5158", lineHeight: 1.3 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, padding: "0 20px" }}>
          <PrimaryButton>Continuar</PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}
window.NewOrderScreen = NewOrderScreen;

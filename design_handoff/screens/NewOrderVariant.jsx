// VARIANT — Nuevo pedido con visual más rico: imágenes/ilustraciones por menú
function NewOrderVariantScreen() {
  // Each menu has a "plate" — a stylized SVG circle composition
  const menus = [
    { title: "Menú A", desc: "Pollo al horno",    bg: "#FDF2E0", accent: "#E0851F", glyph: "🍗" },
    { title: "Menú B", desc: "Milanesa con puré", bg: "#E6F1FB", accent: "#378ADD", glyph: "🥩", selected: true },
    { title: "Menú C", desc: "Ensalada",          bg: "#E4F5EE", accent: "#1D9E75", glyph: "🥗" },
    { title: "Hamburguesa", desc: "con papas",    bg: "#FCEBEB", accent: "#C0392B", glyph: "🍔" },
    { title: "Fideos",  desc: "con queso",        bg: "#FAEEDA", accent: "#B58A24", glyph: "🍝" },
    { title: "Sandwich",desc: "de suprema",       bg: "#ECEAF8", accent: "#534AB7", glyph: "🥪" },
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

        {/* Progress dots */}
        <div style={{ padding: "0 20px", display: "flex", gap: 4 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: i <= 2 ? "#378ADD" : "#E8EAED",
            }} />
          ))}
        </div>

        <div className="va-scroll" style={{ flex: 1, paddingBottom: 110 }}>
          {/* Student chip card */}
          <div style={{ padding: "16px 20px 4px" }}>
            <div style={{
              background: "#F7F8FA", borderRadius: 14, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Avatar name="Tomás García" color="#378ADD" size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2 }}>Tomás García <span style={{ color: "#8A9099", fontWeight: 500 }}>· 3° A</span></div>
                <div style={{ fontSize: 12.5, color: "#534AB7", fontWeight: 500, marginTop: 1 }}>7 viandas a favor</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#378ADD" }}>Cambiar</div>
            </div>
          </div>

          {/* Question */}
          <div style={{ padding: "20px 24px 14px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1 }}>¿Qué menú<br />querés hoy?</div>
            <div style={{ fontSize: 14, color: "#8A9099", marginTop: 6 }}>Tocá una opción para seleccionarla.</div>
          </div>

          {/* Vertical menu list — bigger touch target, with illustration tile */}
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {menus.map((m, i) => (
              <div key={i} style={{
                background: m.selected ? "#E6F1FB" : "#fff",
                border: m.selected ? "2px solid #378ADD" : "1px solid #E8EAED",
                borderRadius: 16, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, background: m.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, flexShrink: 0,
                  boxShadow: `inset 0 0 0 1px ${m.accent}22`,
                }}>{m.glyph}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1D21", letterSpacing: -0.2 }}>{m.title}</div>
                  <div style={{ fontSize: 13.5, color: "#4B5158", marginTop: 2 }}>{m.desc}</div>
                </div>
                {m.selected ? (
                  <div style={{ width: 26, height: 26, borderRadius: 999, background: "#378ADD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <I.check size={16} stroke={2.75} color="#fff" />
                  </div>
                ) : (
                  <div style={{ width: 26, height: 26, borderRadius: 999, border: "1.5px solid #D7DBE0", flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          {/* Tiny helper */}
          <div style={{ padding: "16px 24px 0", display: "flex", gap: 8, alignItems: "center", color: "#8A9099", fontSize: 12.5 }}>
            <I.bell size={14} stroke={1.85} />
            <span>El menú del día lo definís en Productos → Menús.</span>
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
window.NewOrderVariantScreen = NewOrderVariantScreen;

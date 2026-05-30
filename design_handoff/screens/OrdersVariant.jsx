// VARIANT — Pedidos del día, agrupado por estado con chips de filtro
function OrdersVariantScreen() {
  const pendientes = [
    { name: "Lucas Fernández",  meta: "2° A · Hamburguesa", note: "papas aparte", added: true },
    { name: "Mateo Romero",     meta: "1° B · Fideos", note: null, added: false },
    { name: "Julieta Ríos",     meta: "5° A · Menú B", note: "sin queso", added: false },
  ];
  const pagados = [
    { name: "Tomás García",     meta: "3° A · Menú B" },
    { name: "Sofía Martínez",   meta: "5° B · Menú A" },
    { name: "Valentina López",  meta: "4° A · Menú C" },
    { name: "Camila Suárez",    meta: "6° A · Menú A" },
    { name: "Joaquín Pérez",    meta: "3° B · Sandwich" },
  ];

  const chips = [
    { label: "Todos",       n: 94, on: true  },
    { label: "Pendientes",  n: 13, on: false, color: "#E0851F" },
    { label: "Pagados",     n: 81, on: false, color: "#1D9E75" },
    { label: "Agregados",   n: 6,  on: false, color: "#8A6A1F" },
  ];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 100 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 6px" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Pedidos</div>
              <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>Lunes 16 de junio</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F2F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <I.search size={20} color="#4B5158" />
              </div>
              <Avatar name="Laura Méndez" color="#378ADD" size={40} />
            </div>
          </div>

          {/* Stat strip */}
          <div style={{ padding: "10px 20px 6px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            <div style={{ background: "#E6F1FB", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "#1A66B5", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Total hoy</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1A1D21", marginTop: 2, letterSpacing: -0.4 }}>94</div>
            </div>
            <div style={{ background: "#E4F5EE", borderRadius: 14, padding: "12px 12px" }}>
              <div style={{ fontSize: 11, color: "#0F6E51", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Pagados</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1D9E75", marginTop: 2, letterSpacing: -0.4 }}>81</div>
            </div>
            <div style={{ background: "#FAEEDA", borderRadius: 14, padding: "12px 12px" }}>
              <div style={{ fontSize: 11, color: "#7A5A14", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>Pendientes</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#E0851F", marginTop: 2, letterSpacing: -0.4 }}>13</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: "14px 20px 6px" }}>
            <PrimaryButton icon={<I.plus size={22} stroke={2.25} color="#fff" />}>Cargar pedido</PrimaryButton>
          </div>

          {/* Chips */}
          <div style={{ padding: "16px 20px 4px", display: "flex", gap: 8, overflowX: "auto" }}>
            {chips.map((c, i) => (
              <div key={i} style={{
                padding: "8px 14px", borderRadius: 999,
                background: c.on ? "#1A1D21" : "#F1F2F4",
                color: c.on ? "#fff" : "#4B5158",
                fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
              }}>
                {c.label}
                <span style={{
                  background: c.on ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.07)",
                  fontSize: 11.5, padding: "1px 7px", borderRadius: 999,
                  color: c.on ? "#fff" : c.color || "#4B5158",
                }}>{c.n}</span>
              </div>
            ))}
          </div>

          {/* Section: Pendientes */}
          <div style={{ padding: "20px 24px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E0851F" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1D21" }}>Pendientes de pago</span>
            <span style={{ fontSize: 13, color: "#8A9099", fontWeight: 500, marginLeft: "auto" }}>{pendientes.length}</span>
          </div>
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {pendientes.map((o, i) => (
              <div key={i} style={{
                background: o.added ? "#FAEEDA" : "#fff",
                border: o.added ? "1px solid #F0E0BB" : "1px solid #EFF1F3",
                borderRadius: 14, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <Avatar name={o.name} color={o.added ? "#E0851F" : "#378ADD"} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{o.name}</span>
                    {o.added && <Pill bg="#F4DDA5" color="#7A5A14">Agregado</Pill>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#8A9099", marginTop: 2 }}>{o.meta}{o.note ? ` · ${o.note}` : ""}</div>
                </div>
                <button style={{
                  height: 32, padding: "0 12px", borderRadius: 8,
                  background: "#378ADD", color: "#fff",
                  border: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}>Cobrar</button>
              </div>
            ))}
          </div>

          {/* Section: Pagados */}
          <div style={{ padding: "20px 24px 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "#1D9E75" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1D21" }}>Pagados</span>
            <span style={{ fontSize: 13, color: "#8A9099", fontWeight: 500, marginLeft: "auto" }}>81 · viendo 5</span>
          </div>
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            {pagados.map((o, i) => (
              <div key={i} style={{
                padding: "10px 8px", display: "flex", alignItems: "center", gap: 12,
                borderBottom: i < pagados.length - 1 ? "1px solid #F1F2F4" : "none",
              }}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <I.check size={14} stroke={2.75} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1D21", letterSpacing: -0.2 }}>{o.name}</div>
                  <div style={{ fontSize: 12.5, color: "#8A9099" }}>{o.meta}</div>
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 8px", textAlign: "center", color: "#378ADD", fontSize: 14, fontWeight: 600 }}>Ver los 81 pagados</div>
          </div>
        </div>
        <TabBar active="pedidos" disabled={["caja"]} />
      </div>
    </PhoneFrame>
  );
}
window.OrdersVariantScreen = OrdersVariantScreen;

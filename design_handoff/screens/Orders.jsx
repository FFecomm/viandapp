// Pedidos del día — main screen
function OrdersScreen() {
  const orders = [
    { name: "Tomás García",     meta: "3° A · Menú B",        note: "sin tomate",        paid: true,  added: false },
    { name: "Sofía Martínez",   meta: "5° B · Menú A",        note: null,                 paid: true,  added: false },
    { name: "Lucas Fernández",  meta: "2° A · Hamburguesa",   note: "papas aparte",       paid: false, added: true  },
    { name: "Valentina López",  meta: "4° A · Menú C",        note: null,                 paid: true,  added: false },
    { name: "Mateo Romero",     meta: "1° B · Fideos",        note: null,                 paid: false, added: false },
    { name: "Camila Suárez",    meta: "6° A · Menú A",        note: "porción chica",      paid: true,  added: false },
    { name: "Joaquín Pérez",    meta: "3° B · Sandwich",      note: null,                 paid: true,  added: false },
    { name: "Renata Gómez",     meta: "2° B · Menú B",        note: null,                 paid: true,  added: true  },
  ];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 100 }}>
          {/* Greeting */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px 8px" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Hola, Laura</div>
              <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>Lunes 16 de junio</div>
            </div>
            <Avatar name="Laura Méndez" color="#378ADD" size={44} />
          </div>

          {/* Primary CTA */}
          <div style={{ padding: "16px 20px 8px" }}>
            <PrimaryButton icon={<I.plus size={22} stroke={2.25} color="#fff" />}>Cargar pedido</PrimaryButton>
          </div>

          {/* Section title */}
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "20px 24px 12px",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1D21", letterSpacing: -0.1 }}>Pedidos de hoy</div>
            <div style={{ fontSize: 13, color: "#8A9099", fontWeight: 500 }}>94 cargados</div>
          </div>

          {/* List */}
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map((o, i) => (
              <div key={i} style={{
                background: o.added ? "#FAEEDA" : "#fff",
                border: o.added ? "1px solid #F0E0BB" : "1px solid #EFF1F3",
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1D21", letterSpacing: -0.2 }}>{o.name}</div>
                    {o.added && <Pill bg="#F4DDA5" color="#7A5A14">Agregado</Pill>}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#8A9099", marginTop: 3 }}>
                    {o.meta}{o.note ? <span style={{ color: "#4B5158" }}> · {o.note}</span> : null}
                  </div>
                </div>
                {o.paid ? (
                  <div style={{
                    width: 28, height: 28, borderRadius: 999, background: "#1D9E75",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <I.check size={18} stroke={2.5} color="#fff" />
                  </div>
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: 999, border: "1.5px dashed #C8CCD1",
                    flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
        <TabBar active="pedidos" disabled={["caja"]} />
      </div>
    </PhoneFrame>
  );
}
window.OrdersScreen = OrdersScreen;

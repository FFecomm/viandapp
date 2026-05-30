// Desktop: Pedidos del día
function DesktopOrdersScreen() {
  const orders = [
    { name: "Tomás García",     grade: "3° A", menu: "Menú B · sin tomate",       payment: "Crédito",      paid: true,  added: false },
    { name: "Sofía Martínez",   grade: "5° B", menu: "Menú A",                     payment: "Transferencia",paid: true,  added: false },
    { name: "Lucas Fernández",  grade: "2° A", menu: "Hamburguesa · papas aparte", payment: "Efectivo",     paid: false, added: true  },
    { name: "Valentina López",  grade: "4° A", menu: "Menú C",                     payment: "Crédito",      paid: true,  added: false },
    { name: "Mateo Romero",     grade: "1° B", menu: "Fideos",                     payment: "—",            paid: false, added: false },
    { name: "Camila Suárez",    grade: "6° A", menu: "Menú A · porción chica",     payment: "Crédito",      paid: true,  added: false },
    { name: "Joaquín Pérez",    grade: "3° B", menu: "Sandwich",                   payment: "Efectivo",     paid: true,  added: false },
    { name: "Renata Gómez",     grade: "2° B", menu: "Menú B",                     payment: "Transferencia",paid: true,  added: true  },
    { name: "Bruno Castro",     grade: "2° A", menu: "Menú A",                     payment: "Crédito",      paid: true,  added: false },
    { name: "Ana López",        grade: "1° A", menu: "Menú C",                     payment: "Crédito",      paid: true,  added: false },
  ];
  return (
    <DesktopFrame active="pedidos">
      <div style={{ padding: "32px 40px 60px", maxWidth: 1100 }}>
        {/* Greeting */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Hola, Laura</div>
            <div style={{ fontSize: 15, color: "#8A9099", marginTop: 3 }}>Lunes 16 de junio · 94 pedidos cargados</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{
              height: 44, padding: "0 16px", borderRadius: 12,
              background: "#fff", border: "1px solid #E8EAED", color: "#4B5158",
              fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <I.print size={18} stroke={1.75} /> Imprimir planilla
            </button>
            <button style={{
              height: 44, padding: "0 18px", borderRadius: 12,
              background: "#378ADD", border: "none", color: "#fff",
              fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(55,138,221,0.22)",
            }}>
              <I.plus size={18} stroke={2.25} color="#fff" /> Cargar pedido
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total del día",     value: "94",   sub: "pedidos cargados" },
            { label: "Ya pagados",        value: "81",   sub: "86%", color: "#1D9E75" },
            { label: "Pendientes",        value: "13",   sub: "$117.000", color: "#E0851F" },
            { label: "Agregados hoy",     value: "6",    sub: "tarde", color: "#8A6A1F" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #EFF1F3", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#8A9099", letterSpacing: 0.3, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 6, color: s.color || "#1A1D21" }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: "#8A9099", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, maxWidth: 360 }}>
            <div style={{
              height: 42, padding: "0 14px", background: "#F1F2F4", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <I.search size={18} color="#8A9099" />
              <span style={{ fontSize: 14, color: "#8A9099" }}>Buscar alumno, menú…</span>
            </div>
          </div>
          <button style={{ height: 42, padding: "0 14px", borderRadius: 12, background: "#fff", border: "1px solid #E8EAED", fontSize: 13.5, fontWeight: 500, color: "#4B5158", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "inherit" }}>
            <I.filter size={16} /> Todos los grados
          </button>
          <button style={{ height: 42, padding: "0 14px", borderRadius: 12, background: "#fff", border: "1px solid #E8EAED", fontSize: 13.5, fontWeight: 500, color: "#4B5158", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "inherit" }}>
            <I.filter size={16} /> Todos los pagos
          </button>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #EFF1F3", borderRadius: 16, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.6fr 0.7fr 2fr 1fr 0.8fr 40px",
            padding: "14px 20px", borderBottom: "1px solid #F1F2F4",
            fontSize: 11.5, fontWeight: 700, color: "#8A9099", letterSpacing: 0.6, textTransform: "uppercase",
          }}>
            <div>Alumno</div><div>Grado</div><div>Menú</div><div>Pago</div><div>Estado</div><div></div>
          </div>
          {orders.map((o, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1.6fr 0.7fr 2fr 1fr 0.8fr 40px",
              padding: "14px 20px", alignItems: "center",
              background: o.added ? "#FDF6E6" : "transparent",
              borderBottom: i < orders.length - 1 ? "1px solid #F1F2F4" : "none",
              fontSize: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={o.name} color="#378ADD" size={32} />
                <span style={{ fontWeight: 600, letterSpacing: -0.15 }}>{o.name}</span>
                {o.added && <Pill bg="#F4DDA5" color="#7A5A14" style={{ fontSize: 10.5 }}>Agregado</Pill>}
              </div>
              <div style={{ color: "#4B5158" }}>{o.grade}</div>
              <div style={{ color: "#4B5158" }}>{o.menu}</div>
              <div style={{ color: "#4B5158" }}>{o.payment}</div>
              <div>
                {o.paid ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1D9E75", fontWeight: 600, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "#1D9E75" }} /> Pagado
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#E0851F", fontWeight: 600, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "#E0851F" }} /> Pendiente
                  </span>
                )}
              </div>
              <div style={{ color: "#8A9099", display: "flex", justifyContent: "flex-end" }}><I.more size={18} /></div>
            </div>
          ))}
        </div>
      </div>
    </DesktopFrame>
  );
}
window.DesktopOrdersScreen = DesktopOrdersScreen;

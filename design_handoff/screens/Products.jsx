// Productos — catálogo
function ProductsScreen() {
  const products = [
    { name: "Agua mineral",      detail: "500 ml",    price: "$1.500", active: true,  icon: "💧" },
    { name: "Jugo de naranja",   detail: "Tetra 250 ml", price: "$2.000", active: true,  icon: "🍊" },
    { name: "Gaseosa cola",      detail: "500 ml",    price: "$2.500", active: true,  icon: "🥤" },
    { name: "Yogur bebible",     detail: "Vainilla 200 ml", price: "$1.800", active: true,  icon: "🥛" },
    { name: "Postre flan",       detail: "Porción individual", price: "$2.200", active: true,  icon: "🍮" },
    { name: "Fruta de estación", detail: "Manzana o pera", price: "$1.200", active: true,  icon: "🍎" },
    { name: "Alfajor",           detail: "Chocolate",   price: "$1.600", active: false, icon: "🍫" },
    { name: "Galletitas dulces", detail: "Sobre 50 g",  price: "$1.300", active: true,  icon: "🍪" },
  ];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 100 }}>
          <div style={{ padding: "14px 24px 8px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Productos</div>
            <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>Bebidas y extras del menú</div>
          </div>

          <div style={{ padding: "10px 20px" }}>
            <PrimaryButton icon={<I.plus size={22} stroke={2.25} color="#fff" />}>Nuevo producto</PrimaryButton>
          </div>

          {/* Tabs */}
          <div style={{ padding: "16px 20px 4px", display: "flex", gap: 8 }}>
            {[
              { label: "Activos", count: 7, on: true },
              { label: "Pausados", count: 1, on: false },
            ].map((t, i) => (
              <div key={i} style={{
                padding: "8px 14px",
                background: t.on ? "#1A1D21" : "#F1F2F4",
                color: t.on ? "#fff" : "#4B5158",
                borderRadius: 999, fontSize: 13.5, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {t.label}
                <span style={{
                  background: t.on ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.06)",
                  fontSize: 11.5, padding: "1px 7px", borderRadius: 999,
                }}>{t.count}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map((p, i) => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #EFF1F3",
                borderRadius: 14, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 14,
                opacity: p.active ? 1 : 0.55,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: "#F7F8FA",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: "#1A1D21", letterSpacing: -0.2 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "#8A9099", marginTop: 1 }}>{p.detail} · {p.price}</div>
                </div>
                <div style={{
                  width: 46, height: 28, borderRadius: 999,
                  background: p.active ? "#378ADD" : "#D7DBE0",
                  padding: 3, display: "flex",
                  justifyContent: p.active ? "flex-end" : "flex-start",
                  transition: "all .2s",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999, background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <TabBar active="mas" disabled={["caja"]} />
      </div>
    </PhoneFrame>
  );
}
window.ProductsScreen = ProductsScreen;

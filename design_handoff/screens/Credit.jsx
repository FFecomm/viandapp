// Crédito a favor — saldos prepagos
function CreditScreen() {
  const students = [
    { name: "Tomás García",     grade: "3° A", viandas: 7,  amount: "$66.500" },
    { name: "Valentina Paz",    grade: "5° B", viandas: 15, amount: "$142.500" },
    { name: "Ana López",        grade: "1° A", viandas: 3,  amount: "$28.500" },
    { name: "Nicolás Suárez",   grade: "4° B", debt: true,  amount: "−$19.000" },
    { name: "Bruno Castro",     grade: "2° A", viandas: 12, amount: "$114.000" },
    { name: "Martina Acosta",   grade: "6° A", viandas: 5,  amount: "$47.500" },
  ];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 100 }}>
          {/* Header */}
          <div style={{ padding: "14px 24px 12px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Crédito a favor</div>
            <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>Saldos prepagos de las familias</div>
          </div>

          <div style={{ padding: "8px 20px" }}>
            <SearchField placeholder="Buscar alumno" />
          </div>

          <div style={{ padding: "12px 20px 4px" }}>
            <PrimaryButton icon={<I.plus size={22} stroke={2.25} color="#fff" />}>
              Cargar pago de un padre
            </PrimaryButton>
          </div>

          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "22px 24px 12px",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1D21" }}>Alumnos con crédito</div>
            <div style={{ fontSize: 13, color: "#8A9099", fontWeight: 500 }}>42</div>
          </div>

          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {students.map((s, i) => (
              <div key={i} style={{
                background: s.debt ? "#FCEBEB" : "#fff",
                border: s.debt ? "1px solid #F2C9C9" : "1px solid #EFF1F3",
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <Avatar name={s.name} color={s.debt ? "#C0392B" : "#378ADD"} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: "#1A1D21", letterSpacing: -0.2 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "#8A9099", marginTop: 2 }}>
                    {s.grade}{s.debt ? <span> · <span style={{ color: "#8A9099" }}>Debe plata</span></span> : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {s.debt ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#C0392B", letterSpacing: -0.3 }}>{s.amount}</div>
                      <div style={{ fontSize: 11.5, color: "#C0392B", opacity: 0.7, marginTop: 1 }}>en rojo</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#534AB7", letterSpacing: -0.3 }}>{s.viandas} viandas</div>
                      <div style={{ fontSize: 11.5, color: "#8A9099", marginTop: 1 }}>{s.amount}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <TabBar active="credito" disabled={["caja"]} />
      </div>
    </PhoneFrame>
  );
}
window.CreditScreen = CreditScreen;

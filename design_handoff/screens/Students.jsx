// Alumnos — lista buscable
function StudentsScreen() {
  const students = [
    { name: "Ana López",          grade: "1° A" },
    { name: "Bruno Castro",       grade: "2° A" },
    { name: "Camila Suárez",      grade: "6° A" },
    { name: "Joaquín Pérez",      grade: "3° B" },
    { name: "Lucas Fernández",    grade: "2° A" },
    { name: "Martina Acosta",     grade: "6° A" },
    { name: "Mateo Romero",       grade: "1° B" },
    { name: "Nicolás Suárez",     grade: "4° B" },
    { name: "Renata Gómez",       grade: "2° B" },
    { name: "Sofía Martínez",     grade: "5° B" },
    { name: "Tomás García",       grade: "3° A" },
    { name: "Valentina López",    grade: "4° A" },
    { name: "Valentina Paz",      grade: "5° B" },
  ];

  // Group by first letter
  const groups = {};
  students.forEach(s => {
    const k = s.name[0].toUpperCase();
    (groups[k] = groups[k] || []).push(s);
  });

  const palette = ["#378ADD", "#534AB7", "#1D9E75", "#C0392B", "#E0851F", "#1A66B5"];

  return (
    <PhoneFrame>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div className="va-scroll" style={{ flex: 1, paddingTop: 56, paddingBottom: 100 }}>
          <div style={{ padding: "14px 24px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Alumnos</div>
              <div style={{ fontSize: 14, color: "#8A9099", marginTop: 2 }}>312 cargados en total</div>
            </div>
          </div>

          <div style={{ padding: "8px 20px" }}>
            <SearchField placeholder="Buscar por nombre o grado" />
          </div>

          <div style={{ padding: "10px 20px" }}>
            <PrimaryButton icon={<I.plus size={22} stroke={2.25} color="#fff" />}>Nuevo alumno</PrimaryButton>
          </div>

          {Object.keys(groups).sort().map(letter => (
            <div key={letter}>
              <div style={{
                padding: "16px 24px 8px",
                fontSize: 12, fontWeight: 700, color: "#8A9099",
                letterSpacing: 1.5, textTransform: "uppercase",
              }}>{letter}</div>
              <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 2 }}>
                {groups[letter].map((s, i) => {
                  const c = palette[(letter.charCodeAt(0) + i) % palette.length];
                  return (
                    <div key={i} style={{
                      padding: "12px 8px",
                      display: "flex", alignItems: "center", gap: 12,
                      borderBottom: i < groups[letter].length - 1 ? "1px solid #F1F2F4" : "none",
                    }}>
                      <Avatar name={s.name} color={c} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15.5, fontWeight: 600, color: "#1A1D21", letterSpacing: -0.2 }}>{s.name}</div>
                        <div style={{ fontSize: 13, color: "#8A9099", marginTop: 1 }}>{s.grade}</div>
                      </div>
                      <I.chevron size={18} color="#C8CCD1" stroke={2} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <TabBar active="mas" disabled={["caja"]} />
      </div>
    </PhoneFrame>
  );
}
window.StudentsScreen = StudentsScreen;

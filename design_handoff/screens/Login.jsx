// Login screen
function LoginScreen() {
  return (
    <PhoneFrame>
      <div className="va-scroll" style={{ padding: "0 28px", height: "100%", background: "#fff" }}>
        <div style={{ height: 90 }} />
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 56 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22, background: "#378ADD",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(55,138,221,0.32)",
          }}>
            <I.store size={40} stroke={1.8} color="#fff" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6, color: "#1A1D21" }}>ViandApp</div>
            <div style={{ fontSize: 16, color: "#8A9099", marginTop: 6 }}>Tu sistema de viandas</div>
          </div>
        </div>

        <div style={{ height: 60 }} />

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4B5158", marginBottom: 8, letterSpacing: 0.1 }}>Usuario</label>
            <div style={{
              height: 56, padding: "0 16px", borderRadius: 14,
              border: "1.5px solid #E8EAED", background: "#fff",
              display: "flex", alignItems: "center",
              fontSize: 16, color: "#1A1D21",
            }}>laura</div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4B5158", marginBottom: 8, letterSpacing: 0.1 }}>Contraseña</label>
            <div style={{
              height: 56, padding: "0 16px", borderRadius: 14,
              border: "1.5px solid #378ADD", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 18, color: "#1A1D21", letterSpacing: 3,
            }}>
              ••••••••
              <span style={{ fontSize: 13, fontWeight: 600, color: "#378ADD", letterSpacing: 0 }}>Ver</span>
            </div>
          </div>
        </div>

        <div style={{ height: 36 }} />
        <PrimaryButton>Entrar</PrimaryButton>

        <div style={{ marginTop: 28, textAlign: "center", fontSize: 13, color: "#8A9099" }}>
          Colegio San Martín · Versión 1.0
        </div>
      </div>
    </PhoneFrame>
  );
}

window.LoginScreen = LoginScreen;

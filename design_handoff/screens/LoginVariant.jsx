// VARIANT — Login con fondo colorido y onda más expresiva
function LoginVariantScreen() {
  return (
    <PhoneFrame status="light">
      <div style={{
        height: "100%", background: "linear-gradient(160deg, #378ADD 0%, #2B6FB8 55%, #1F558F 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: 999, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", top: 120, left: -90, width: 220, height: 220, borderRadius: 999, background: "rgba(83,74,183,0.35)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -40, width: 240, height: 240, borderRadius: 999, background: "rgba(29,158,117,0.25)" }} />

        <div style={{ position: "relative", height: "100%", padding: "0 28px", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 90 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
            }}>
              <I.store size={28} stroke={1.85} color="#378ADD" />
            </div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>ViandApp</div>
          </div>

          <div style={{ marginTop: 60 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: -0.8, lineHeight: 1.1 }}>
              Buen día,<br />¿quién entra hoy?
            </div>
            <div style={{ fontSize: 15.5, color: "rgba(255,255,255,0.78)", marginTop: 10 }}>
              Cargá pedidos, controlá la caja y revisá la planilla del salón.
            </div>
          </div>

          {/* Card */}
          <div style={{
            marginTop: "auto", marginBottom: 50,
            background: "#fff", borderRadius: 24, padding: "24px 22px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#8A9099", marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>Usuario</label>
                <div style={{
                  height: 52, padding: "0 14px", borderRadius: 12,
                  background: "#F7F8FA",
                  display: "flex", alignItems: "center",
                  fontSize: 16, color: "#1A1D21", fontWeight: 500,
                }}>laura</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#8A9099", marginBottom: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>Contraseña</label>
                <div style={{
                  height: 52, padding: "0 14px", borderRadius: 12,
                  background: "#F7F8FA",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: 18, color: "#1A1D21", letterSpacing: 3,
                }}>
                  ••••••••
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#378ADD", letterSpacing: 0 }}>Ver</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <PrimaryButton>Entrar</PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
window.LoginVariantScreen = LoginVariantScreen;

// ViandApp — shared primitives, icons, tab bar
// Loaded before all screen files. Exports to window.

// ─── Lucide-style icons (1.5px stroke) ───────────────────────
const Icon = ({ path, size = 22, stroke = 1.75, color = "currentColor", fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {path}
  </svg>
);

const I = {
  plus:    (p) => <Icon {...p} path={<><path d="M12 5v14M5 12h14"/></>} />,
  check:   (p) => <Icon {...p} path={<path d="M4 12l5 5L20 6"/>} />,
  search:  (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>} />,
  back:    (p) => <Icon {...p} path={<path d="M15 6l-6 6 6 6"/>} />,
  chevron: (p) => <Icon {...p} path={<path d="M9 6l6 6-6 6"/>} />,
  user:    (p) => <Icon {...p} path={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>} />,
  users:   (p) => <Icon {...p} path={<><circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><path d="M16 4a4 4 0 010 8"/><path d="M22 21c0-3-2-5.5-4.5-6.5"/></>} />,
  wallet:  (p) => <Icon {...p} path={<><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="15" r="1.2" fill="currentColor"/></>} />,
  cash:    (p) => <Icon {...p} path={<><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M3 10h2M19 14h2"/></>} />,
  list:    (p) => <Icon {...p} path={<><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></>} />,
  box:     (p) => <Icon {...p} path={<><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></>} />,
  more:    (p) => <Icon {...p} path={<><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></>} />,
  download:(p) => <Icon {...p} path={<><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>} />,
  print:   (p) => <Icon {...p} path={<><path d="M7 9V4h10v5"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M7 14h10v6H7z"/></>} />,
  store:   (p) => <Icon {...p} path={<><path d="M3 9l1.5-4h15L21 9"/><path d="M3 9h18v11H3z"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/></>} />,
  calendar:(p) => <Icon {...p} path={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>} />,
  filter:  (p) => <Icon {...p} path={<path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>} />,
  bell:    (p) => <Icon {...p} path={<><path d="M6 16V11a6 6 0 0112 0v5l1.5 2H4.5L6 16z"/><path d="M10 21a2 2 0 004 0"/></>} />,
  x:       (p) => <Icon {...p} path={<path d="M6 6l12 12M18 6L6 18"/>} />,
  edit:    (p) => <Icon {...p} path={<><path d="M14 4l6 6-11 11H3v-6L14 4z"/></>} />,
};

// ─── Primitives ──────────────────────────────────────────────
function Avatar({ name = "", color = "#378ADD", size = 40 }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.36, letterSpacing: -0.3,
      flexShrink: 0,
    }}>{initials}</div>
  );
}

function Pill({ children, bg = "#FAEEDA", color = "#8A6A1F", style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color, padding: "3px 9px",
      borderRadius: 999, fontSize: 11.5, fontWeight: 600,
      letterSpacing: 0.1, ...style,
    }}>{children}</span>
  );
}

function PrimaryButton({ children, icon, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", height: 56, borderRadius: 14, border: "none",
      background: "#378ADD", color: "#fff",
      fontFamily: "inherit", fontSize: 17, fontWeight: 600,
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, cursor: "pointer", letterSpacing: -0.1,
      boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(55,138,221,0.18)",
      ...style,
    }}>
      {icon}
      {children}
    </button>
  );
}

function SecondaryButton({ children, icon, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", height: 52, borderRadius: 14, border: "1px solid #E8EAED",
      background: "#fff", color: "#1A1D21",
      fontFamily: "inherit", fontSize: 16, fontWeight: 500,
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, cursor: "pointer",
      ...style,
    }}>
      {icon}
      {children}
    </button>
  );
}

function SearchField({ placeholder = "Buscar", style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      height: 48, padding: "0 14px",
      background: "#F1F2F4", borderRadius: 12,
      ...style,
    }}>
      <I.search size={20} color="#8A9099" stroke={1.75} />
      <span style={{ color: "#8A9099", fontSize: 15.5 }}>{placeholder}</span>
    </div>
  );
}

// ─── Phone shell (custom, not iOS — simpler, brand-neutral) ──
function PhoneFrame({ children, width = 390, height = 844, time = "9:41", showStatus = true, showHome = true, status = "dark" }) {
  return (
    <div style={{
      width, height, borderRadius: 44, overflow: "hidden",
      position: "relative", background: "#FFFFFF",
      boxShadow: "0 28px 60px rgba(20,25,30,0.12), 0 0 0 1px rgba(20,25,30,0.08)",
    }} className="va">
      {showStatus && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 50, zIndex: 30,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 28px 0",
          color: status === "dark" ? "#1A1D21" : "#fff",
          fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2,
          pointerEvents: "none",
        }}>
          <div>{time}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", opacity: 0.92 }}>
            <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="currentColor"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx="0.6" fill="currentColor"/></svg>
            <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.45" fill="none"/><rect x="2" y="2" width="17" height="7" rx="1.5" fill="currentColor"/><path d="M22 3.5v4c0.6-0.2 1-0.9 1-2s-0.4-1.8-1-2z" fill="currentColor" opacity="0.5"/></svg>
          </div>
        </div>
      )}
      <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
        {children}
      </div>
      {showHome && (
        <div style={{
          position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
          width: 134, height: 5, borderRadius: 100, background: "rgba(20,25,30,0.22)",
          pointerEvents: "none", zIndex: 40,
        }} />
      )}
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────
function TabBar({ active = "pedidos", disabled = [] }) {
  const tabs = [
    { id: "pedidos", label: "Pedidos", icon: I.list },
    { id: "credito", label: "Crédito", icon: I.wallet },
    { id: "caja",    label: "Caja",    icon: I.cash },
    { id: "mas",     label: "Más",     icon: I.more },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      height: 84, paddingBottom: 22,
      background: "#fff", borderTop: "1px solid #F1F2F4",
      display: "flex", zIndex: 20,
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const isDisabled = disabled.includes(t.id);
        const color = isActive ? "#378ADD" : isDisabled ? "#C8CCD1" : "#8A9099";
        return (
          <div key={t.id} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            color, opacity: isDisabled ? 0.6 : 1,
          }}>
            <t.icon size={24} stroke={isActive ? 2 : 1.75} />
            <div style={{ fontSize: 11, fontWeight: isActive ? 600 : 500, letterSpacing: -0.1 }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Desktop chrome (sidebar) ────────────────────────────────
function DesktopFrame({ children, active = "pedidos", user = { name: "Laura Méndez", role: "Operadora", color: "#378ADD" } }) {
  const items = [
    { id: "pedidos",  label: "Pedidos",   icon: I.list },
    { id: "nuevo",    label: "Nuevo",     icon: I.plus },
    { id: "alumnos",  label: "Alumnos",   icon: I.users },
    { id: "credito",  label: "Crédito",   icon: I.wallet },
    { id: "productos",label: "Productos", icon: I.box },
    { id: "caja",     label: "Caja",      icon: I.cash },
    { id: "planilla", label: "Planilla",  icon: I.print },
  ];
  return (
    <div className="va" style={{
      width: "100%", height: "100%", display: "flex",
      background: "#FAFAFB", overflow: "hidden",
    }}>
      <aside style={{
        width: 230, flexShrink: 0, height: "100%",
        background: "#fff", borderRight: "1px solid #E8EAED",
        display: "flex", flexDirection: "column",
        padding: "22px 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: "#378ADD",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          }}>
            <I.store size={20} stroke={2} color="#fff" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>ViandApp</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(it => {
            const isActive = it.id === active;
            return (
              <div key={it.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10,
                background: isActive ? "#E6F1FB" : "transparent",
                color: isActive ? "#1A66B5" : "#4B5158",
                fontSize: 14.5, fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
              }}>
                <it.icon size={19} stroke={isActive ? 2 : 1.75} />
                {it.label}
              </div>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderTop: "1px solid #F1F2F4", paddingTop: 14 }}>
          <Avatar name={user.name} color={user.color} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1D21", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "#8A9099" }}>{user.role}</div>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}

Object.assign(window, {
  Icon, I, Avatar, Pill, PrimaryButton, SecondaryButton, SearchField,
  PhoneFrame, TabBar, DesktopFrame,
});

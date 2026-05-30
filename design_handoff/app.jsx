// App entry — mounts the design canvas with all screen artboards.
const PHONE_W = 390;
const PHONE_H = 844;
const DESKTOP_W = 1280;
const DESKTOP_H = 800;

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="mobile-core"
        title="Mobile · Pantallas principales"
        subtitle="Flujo diario de la operadora — login, lista del día y nuevo pedido"
      >
        <DCArtboard id="login" label="Login" width={PHONE_W} height={PHONE_H}>
          <LoginVariantScreen />
        </DCArtboard>
        <DCArtboard id="orders" label="Pedidos del día" width={PHONE_W} height={PHONE_H}>
          <OrdersVariantScreen />
        </DCArtboard>
        <DCArtboard id="new-order" label="Nuevo pedido · Paso 3" width={PHONE_W} height={PHONE_H}>
          <NewOrderVariantScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="mobile-money"
        title="Mobile · Plata"
        subtitle="Crédito a favor (operadora) y caja del día (administrativo)"
      >
        <DCArtboard id="credit" label="Crédito a favor" width={PHONE_W} height={PHONE_H}>
          <CreditScreen />
        </DCArtboard>
        <DCArtboard id="cash" label="Caja del día" width={PHONE_W} height={PHONE_H}>
          <CashVariantScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="mobile-catalog"
        title="Mobile · Catálogos y cocina"
        subtitle="Alumnos, productos extras y planilla imprimible"
      >
        <DCArtboard id="students" label="Alumnos" width={PHONE_W} height={PHONE_H}>
          <StudentsScreen />
        </DCArtboard>
        <DCArtboard id="products" label="Productos" width={PHONE_W} height={PHONE_H}>
          <ProductsScreen />
        </DCArtboard>
        <DCArtboard id="print" label="Planilla imprimible" width={PHONE_W} height={PHONE_H}>
          <PrintScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="desktop"
        title="Desktop · 3 pantallas clave"
        subtitle="Misma app adaptada a escritorio. Sidebar en vez de tab bar."
      >
        <DCArtboard id="d-orders" label="Pedidos del día · Desktop" width={DESKTOP_W} height={DESKTOP_H}>
          <DesktopOrdersScreen />
        </DCArtboard>
        <DCArtboard id="d-new" label="Nuevo pedido · Desktop" width={DESKTOP_W} height={DESKTOP_H}>
          <DesktopNewOrderScreen />
        </DCArtboard>
        <DCArtboard id="d-cash" label="Caja del día · Desktop" width={DESKTOP_W} height={DESKTOP_H}>
          <DesktopCashScreen />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="alt"
        title="Alternativas · v1"
        subtitle="Versiones más sobrias guardadas como referencia para comparar."
      >
        <DCArtboard id="login-v1" label="Login · sobrio" width={PHONE_W} height={PHONE_H}>
          <LoginScreen />
        </DCArtboard>
        <DCArtboard id="orders-v1" label="Pedidos · lista simple" width={PHONE_W} height={PHONE_H}>
          <OrdersScreen />
        </DCArtboard>
        <DCArtboard id="new-order-v1" label="Nuevo pedido · grilla" width={PHONE_W} height={PHONE_H}>
          <NewOrderScreen />
        </DCArtboard>
        <DCArtboard id="cash-v1" label="Caja · sin gráficos" width={PHONE_W} height={PHONE_H}>
          <CashScreen />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

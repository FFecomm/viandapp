# Manual de uso · ViandApp

Guía rápida para cada rol que usa la app. Imprimir o compartir el PDF correspondiente.

> Acceso: [viandapp.vercel.app](https://viandapp.vercel.app)

---

## 👨‍👩‍👧 Para FAMILIAS

### Crear tu cuenta
1. Entrá a la web y tocá **"Registrate"**.
2. Cargá nombre, email y elegí una contraseña.
3. Vas a recibir un email para confirmar tu cuenta. Si no lo ves, revisá spam.
4. Volvé a la app y entrá con tu email y contraseña.

### Sumar hijos
La primera vez la app te pide cargar a tus hijos. Por cada uno:
- Nombre completo
- Grado y división
- Relación (madre, padre, tutor)

Podés volver después y agregar más hijos desde la pantalla de inicio.

### Cargar saldo
1. En la home, tocá **"Cargar saldo"**.
2. Si tenés varios hijos, elegí a cuál cargarle.
3. Indicá la cantidad de viandas a comprar.
4. **"Pagar con Mercado Pago"** te lleva al checkout.
5. Una vez aprobado el pago, el saldo se acredita en segundos.

### Pedir viandas
1. Tocá **"Pedir vianda"**.
2. **Paso 1 de 3:** elegí los días de la semana que querés.
3. **Paso 2 de 3:** por cada día, elegí el menú. Podés agregar observaciones (ej: "sin queso").
4. **Paso 3 de 3:** revisá el resumen y confirmá.

Recibís una notificación al confirmar.

### Cancelar un pedido
- En **"Mis pedidos"** vas a ver los próximos. Tocá **"Cancelar"** en el que quieras anular.
- ⚠️ **No se puede cancelar después de las 8:00 AM del día de la vianda.** En ese caso la vianda se entrega o queda como ausencia (no devuelve saldo).

### Ausencias
Si tu hijo no fue al colegio, la encargada de salón marca la ausencia en la app y la vianda se reprograma para el próximo día hábil. No hace falta que hagas nada.

---

## 🍱 Para ENCARGADA DE SALÓN

### Tu pantalla principal
Al entrar ves la **lista del día**: todos los pedidos de hoy, ordenados por grado y división.

Por cada alumno: nombre, menú pedido, observaciones.

### Marcar ausencia
1. Buscá al alumno en la lista (filtros por grado).
2. Tocá **"Ausente"** en su fila.
3. Confirmá en el modal. La vianda se traslada al próximo día hábil automáticamente.

### Dar vianda sin pedido
Pasa un alumno que no había pedido y quiere comer.
1. Tocá **"Dar vianda sin pedido"**.
2. Buscá al alumno y elegí el menú.
3. **Si tiene saldo:** se descuenta automáticamente.
4. **Si NO tiene saldo:** aparece "Cobrar en efectivo" → vas al flujo de cobro.

### Cobrar en efectivo
1. En **"Cobro en efectivo"**: buscá al alumno, ingresá el monto.
2. Tocá **"Registrar cobro"**.

El movimiento queda en la caja del día.

### Exportar lista
Tocá **"PDF"** arriba a la derecha para imprimir la lista del día.

---

## 📋 Para OPERADORA

### Pedidos del día en vivo
Al entrar ves los pedidos del día actualizándose en tiempo real:
- Contador total de viandas
- Resumen por menú (Milanesa: 24, Pollo: 18, …)
- Lista detallada con observaciones

No hay que recargar — la pantalla se actualiza sola cuando una familia confirma un pedido.

### Cargar un pedido manual
Útil cuando una familia te llama o pasa por mostrador:
1. **"Pedido manual"** → elegí al alumno.
2. Mismo wizard de 3 pasos que usan las familias.
3. El pedido se registra como "cargado por operadora".

### Gestionar familias
En **"Familias"**: tabla con todas las familias, sus hijos y saldo.
- Filtro por nombre.
- Click en una familia: ves todos sus hijos, pedidos y recargas.

### Editar menús
En **"Menús"**:
- Editar nombre, descripción e imagen de cada uno de los 14 menús del ciclo.
- Activar/desactivar (un menú inactivo no aparece para los padres).
- Arrastrar para reordenar.

---

## 💼 Para ADMINISTRATIVO

### Lo mismo que la operadora, más:

### Caja del día (`/credito`)
- Total cobrado por Mercado Pago.
- Total cobrado en efectivo.
- Lista de todos los movimientos del día con hora, descripción, medio de pago, monto.
- **"Exportar Excel/CSV"** para llevarlo al sistema contable.

### Conectar Mercado Pago
Solo se hace una vez (o cuando cambia la cuenta cobradora):
1. En **"Caja"** vas a ver el panel de conexión MP.
2. Tocá **"Conectar Mercado Pago"** (o "Reconectar" si querés cambiar de cuenta).
3. Te logueás en Mercado Pago con la cuenta de Croix.
4. Volvés a la app — listo, todas las recargas siguientes se acreditan en esa cuenta.

### Gestión de usuarios staff
Para dar de alta una encargada u operadora nueva, contactá al desarrollador (Felipe) por ahora.
Próxima versión: pantalla de gestión propia.

---

## Problemas comunes

| Problema | Solución |
|----------|----------|
| No me llega el email de confirmación | Revisá spam. Si no, pedí a admin que confirme la cuenta. |
| Olvidé la contraseña | Tocá "¿Olvidaste tu contraseña?" en el login. |
| El pago no se acreditó | Esperá 1–2 minutos. Si no llega, contactá a admin con el número de operación de MP. |
| No puedo cancelar un pedido | Si es del mismo día y son después de las 8:00, no se puede cancelar más. |
| El menú que quiero pedir no aparece | Está inactivo. Avisarle a la operadora. |

---

**Contacto técnico:** {/* TODO: email/teléfono de soporte */}

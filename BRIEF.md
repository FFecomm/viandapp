# ViandApp — Brief para reunión con Croix SAS

## TL;DR

**ViandApp** es una app que reemplaza el caos actual de viandas escolares (WhatsApp + Excel + libreta de cobranzas) por un sistema digital en el que las familias piden y pagan solas desde el celular, y Croix administra todo desde una sola pantalla. Croix gana menos trabajo administrativo, menos deudas perdidas, y familias más contentas. Yo gano $400 por cada vianda vendida.

---

## El problema actual (lo que vive Croix hoy)

- La operadora recibe pedidos por **WhatsApp** uno por uno, los pasa a un **Excel** o cuaderno
- La encargada de salón arma la **planilla a mano** para cocina
- El administrativo persigue cobranzas: "Mariana, ¿me transferiste lo del lunes?"
- Las deudas se acumulan en cabeza de la administración y muchas se pierden
- Si una familia se queja por la comida, no queda registro
- Cero datos: nadie sabe qué menú gustó más, cuántas viandas piden por grado, qué familias deben siempre

Croix mueve **~110 viandas por día**, en plata son **~$385.000/día** o **~$8.5M/mes**. Esa operación está corriendo con herramientas de los años 90.

---

## Qué es ViandApp

Una app web (no hace falta descargarla, funciona desde el navegador del cel) con **tres interfaces** según quién entra:

### 1. Interfaz Croix (catering)

La usan la operadora, la encargada de salón y el administrativo. Cada uno con permisos distintos. 10 pantallas:

| Pantalla | Para qué |
|---|---|
| **Login** | Una sola puerta de entrada para los 3 roles |
| **Pedidos del día** | Lista en vivo de las 110 viandas del día, con quién pidió por la app vs por WhatsApp, qué falta cobrar |
| **Cobrar (bottom sheet)** | Toca "Cobrar" en un pedido → elige Efectivo / Transferencia / Descontar de viandas a favor |
| **Wizard nuevo pedido** | Si un padre pide por WhatsApp, la operadora carga el pedido en 5 pasos en menos de 1 minuto |
| **Familias** | Lista de todas las familias del cole con cuánto pagaron a favor o cuánto deben, con tope visual de 5 viandas sin pagar |
| **Caja del día** | Total cobrado hoy ($1M+), gráfico de cómo entró la plata (crédito / transferencia / efectivo / Mercado Pago), comparativa con semana pasada, descarga Excel |
| **Alumnos** | Listado por grado, con saldo o deuda de cada uno a la vista |
| **Productos** | ABM de bebidas y extras (jugo, postre, fruta, etc.) |
| **Planilla del día** | Genera la planilla para cocina y la imprime, manda por WhatsApp o descarga en PDF |
| **Opiniones de las familias** | Feed con rating promedio (★4.3), mejor y peor menú del mes, comentarios y sugerencias de los papás |

### 2. Interfaz Familias

La usan los papás y mamás de los chicos. Diseñada para que la pueda usar una mamá que nunca usó una app. 9 pantallas:

| Pantalla | Para qué |
|---|---|
| **3 pantallas de bienvenida** | Primera vez que abre la app: "Pedile la vianda desde el cel" / "Pagás cuando quieras" / "Las viandas no caducan" |
| **Inicio** | "Hola Mariana 👋" con sus hijos listados. Saldo a favor en violeta o deuda en rojo con countdown |
| **Wizard de pedido** | Elige día, menú, extras y forma de pago en 4 pasos |
| **Cancelar pedido (modal)** | Confirmación con consecuencia clara: "Si cancelás, Tomás no come milanesa el lunes" |
| **Cargar viandas** | Carga 5/10/20 viandas con Mercado Pago o en efectivo en el cole |
| **¿Cómo estuvo?** | Después del consumo: rating con estrellas + chips rápidos + comentario opcional |
| **Buzón de opiniones** | Sugerencias o quejas por categoría (Comida / Atención / Sugerencia), con respuestas del catering |

### 3. Interfaz Cobranzas (la uso yo)

Mi panel privado, en otro dominio (`admin.viandapp.com`), que Croix no ve. 3 pantallas para llevar la facturación de las comisiones por vianda vendida.

---

## Modelo de pagos (clave para la conversación)

### El padre tiene 3 formas de pagar

1. **Usar viandas que ya pagó** (saldo a favor, prepago)
2. **Mercado Pago** ahora — acreditación inmediata, tarjeta o dinero en cuenta
3. **Pagar en hasta 5 días** — genera una deuda con cronómetro

### La regla de la deuda

- Máximo **5 viandas sin pagar por alumno** (lo que dura una semana lectiva)
- Plazo de pago: **5 días** desde el primer pedido sin cancelar
- Si la familia llega al tope o pasan los 5 días → la app **bloquea** nuevos pedidos hasta que cancele

Esto cubre el caso real: el padre encarga lunes a viernes sin pagar; el lunes siguiente, si no pagó, no puede seguir pidiendo. La app **no te deja seguir hundiéndote en deuda**.

### El cobro de la plata

- Familias que pagan por la app (Mercado Pago) → el dinero entra automático y se splittea: una parte para Croix, $400 para mí
- Familias que pagan en efectivo o transferencia en el cole → la admin lo carga manualmente en la app y se les acreditan las viandas
- Las deudas son visibles permanentemente para Croix con countdown

### El precio al público

El precio final de la vianda lo decide Croix. Sugerencia: si una vianda hoy vale $3.500, en la app se vende a **$3.900**, de los cuales **$3.500 quedan para Croix** y **$400 son mi comisión**. El padre no paga más caro por sumar comisión: el costo absoluto crece $400, pero a cambio gana una herramienta que le ahorra horas de WhatsApp.

---

## Por qué le conviene a Croix

### Lo que les ahorra (cosas que hacen hoy y dejan de hacer)

- ❌ Tomar pedidos por WhatsApp uno por uno → ahora el 70%+ los carga la familia sola
- ❌ Pasar pedidos a Excel → la app es el Excel
- ❌ Armar la planilla a mano → se genera automática, lista para imprimir
- ❌ Perseguir cobranzas → la app cobra antes de que el chico coma, o bloquea
- ❌ Discutir con familias por deudas viejas → la app tiene historial inapelable
- ❌ Llevar la caja del día a mano → dashboard automático

### Lo que les abre (cosas nuevas que no podían antes)

- ✅ **Saber qué menú gusta y cuál no** — rating por plato, para mejorar la carta
- ✅ **Volumen** — familias que hoy no piden porque "es un quilombo por WhatsApp" empiezan a pedir
- ✅ **Predictibilidad financiera** — saben de antemano cuánta plata les entra el lunes (todo prepago o con deuda acotada)
- ✅ **Profesionalización** — pasan de "el catering del cole" a "el catering moderno con app" → diferenciador vs otros caterings de la zona
- ✅ **Data para crecer** — pueden ver tendencias, momentos pico, qué grados consumen más
- ✅ **Comunicación directa con familias** — pueden responder sugerencias dentro de la app, sin armar grupos de WhatsApp

### Qué les cuesta

Una comisión de **$400 por cada vianda efectivamente vendida**. No pagan setup, no pagan abono mensual, no pagan por familias inactivas. Si un mes venden 0 viandas, pagan $0.

---

## Estado del proyecto

- ✅ **Diseño completo**: 22 pantallas mockup listas y testeadas (las llevo impresas a la reunión)
- ⏳ **Desarrollo**: en planificación. Plazo estimado de un MVP funcional para piloto: **8 a 10 semanas**
- ⏳ **Integración con Mercado Pago**: pendiente de activar la cuenta de catering Croix en MP

### Próximos pasos sugeridos

1. Reunión de validación de mockups con Croix (esta reunión)
2. Ajustes según feedback
3. Firma de acuerdo de comisión $400/vianda
4. Desarrollo del MVP (2-3 meses)
5. Piloto con un grupo de 20-30 familias durante 2 semanas
6. Roll-out al cole completo

---

## Pantallas de referencia

Las 22 pantallas están en el PDF adjunto, divididas en 3 secciones:

1. **Croix SAS** — 10 pantallas (lo que ven los empleados del catering)
2. **Familias** — 9 pantallas (lo que ven los papás y mamás)
3. **Cobranzas** — 3 pantallas (mi panel privado, no se muestra al cliente)

---

## Prompt sugerido para usar con Claude

Después de subir este BRIEF + el PDF del preview, copiá y pegá en una conversación nueva de claude.ai:

> Soy Felipe y estoy por presentarle ViandApp a los dueños de Croix SAS, el catering que sirve viandas en un colegio primario. Te paso el brief y los mockups del producto.
>
> Necesito que me armes una **presentación de 10 a 12 slides** para una reunión de 20 minutos. Tono profesional pero cercano (Croix es PyME familiar argentina, no corporativo).
>
> Orden de slides sugerido:
> 1. Portada
> 2. El problema actual de Croix (sin acusar, mostrando que entendí su día a día)
> 3. La solución en una frase + screenshot de la pantalla "Pedidos del día"
> 4. Las 3 interfaces (1 slide por audiencia con 2-3 screenshots)
> 5. Modelo de pagos (la regla de 5 viandas / 5 días)
> 6. Qué les ahorra
> 7. Qué les abre (nuevas oportunidades)
> 8. Modelo comercial ($400/vianda, sin abono)
> 9. Estado del proyecto + timeline
> 10. Próximos pasos
> 11. Cierre con call to action
>
> Para cada slide quiero: título corto, 3-5 bullets máximo, y nota de qué decir mientras hablás (script de 30-60 segundos).
>
> Después de los slides, dame un **guión de 5 minutos** con el speech de apertura y las 5 objeciones más probables del cliente con cómo responderlas.

---

**Contacto**
Felipe Majul
ffecomm3@gmail.com

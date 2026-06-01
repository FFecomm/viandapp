export const metadata = {
  title: 'Política de Privacidad · ViandApp',
}

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Política de Privacidad</h1>
      <p className="text-sm text-muted-foreground">Última actualización: 1 de junio de 2026</p>

      <h2 className="text-lg font-semibold mt-6">1. Quiénes somos</h2>
      <p>
        ViandApp es una herramienta operada en colaboración con <strong>Croix SAS</strong> ({/* TODO: dirección legal */}),
        que permite a las familias gestionar y pagar las viandas escolares de sus hijos.
      </p>

      <h2 className="text-lg font-semibold mt-6">2. Qué datos guardamos</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Datos de la cuenta: nombre, email, teléfono (opcional).</li>
        <li>Datos de los alumnos vinculados: nombre, grado, división, observaciones (alergias, indicaciones).</li>
        <li>Pedidos, saldos, recargas y movimientos de pago.</li>
        <li>Datos técnicos mínimos: dirección IP, navegador y errores de la app, para diagnóstico.</li>
      </ul>
      <p>
        No guardamos datos de tarjetas de crédito ni débito. Los pagos los procesa <strong>Mercado Pago</strong>,
        que tiene su propia política de privacidad.
      </p>

      <h2 className="text-lg font-semibold mt-6">3. Para qué los usamos</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Operar el servicio: tomar pedidos, cobrar, entregar viandas, llevar saldos.</li>
        <li>Mandarte notificaciones operativas (pedidos confirmados, saldo bajo, pagos acreditados).</li>
        <li>Cumplir con obligaciones legales (impositivas, contables, sanitarias).</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6">4. Con quién los compartimos</h2>
      <p>
        Solo con prestadores estrictamente necesarios para que la app funcione:
        Supabase (base de datos y autenticación), Vercel (hosting), Mercado Pago (pagos) y
        servicios de envío de notificaciones push. Ninguno los usa para fines propios.
      </p>

      <h2 className="text-lg font-semibold mt-6">5. Tus derechos</h2>
      <p>
        Tenés derecho a acceder, rectificar o pedir la eliminación de tus datos en cualquier momento.
        Escribinos a <strong>{/* TODO: email de contacto */}</strong> y respondemos dentro de los 10 días hábiles.
      </p>

      <h2 className="text-lg font-semibold mt-6">6. Datos de menores</h2>
      <p>
        Los datos de los alumnos los carga el padre/madre/tutor a través de su propia cuenta. Solo se usan
        para gestionar pedidos y entregas. No se comparten con terceros con fines comerciales.
      </p>

      <h2 className="text-lg font-semibold mt-6">7. Cuánto tiempo los guardamos</h2>
      <p>
        Los datos personales se conservan mientras tu cuenta esté activa. Los registros contables y de pagos
        se conservan según los plazos exigidos por la legislación argentina (mínimo 10 años para registros de IVA).
      </p>

      <h2 className="text-lg font-semibold mt-6">8. Cambios a esta política</h2>
      <p>
        Si hacemos cambios sustanciales, te avisamos por email y dentro de la app antes de que entren en vigencia.
      </p>
    </>
  )
}

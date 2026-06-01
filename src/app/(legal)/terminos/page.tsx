export const metadata = {
  title: 'Términos y Condiciones · ViandApp',
}

export default function TerminosPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Términos y Condiciones</h1>
      <p className="text-sm text-muted-foreground">Última actualización: 1 de junio de 2026</p>

      <h2 className="text-lg font-semibold mt-6">1. Aceptación</h2>
      <p>
        Al usar ViandApp aceptás estos términos. Si no estás de acuerdo, no uses el servicio.
      </p>

      <h2 className="text-lg font-semibold mt-6">2. Cómo funciona</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Las familias cargan saldo en pesos mediante Mercado Pago.</li>
        <li>El saldo se mide en <strong>viandas enteras</strong> (no en pesos sueltos).</li>
        <li>Solo se puede confirmar un pedido si hay saldo suficiente (<strong>prepago estricto</strong>).</li>
        <li>El sistema nunca permite que un alumno quede con saldo negativo.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6">3. Pedidos, cancelaciones y ausencias</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Los pedidos se pueden cancelar hasta las <strong>8:00 AM del día de la vianda</strong>. Después de esa hora no se devuelve el saldo.</li>
        <li>Si un alumno está ausente, la encargada de salón marca la ausencia y la vianda se reprograma automáticamente para el próximo día hábil.</li>
        <li>Las ausencias no devuelven dinero — solo trasladan la vianda.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6">4. Pagos</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Los pagos se procesan a través de <strong>Mercado Pago</strong>. ViandApp no almacena datos de tarjetas.</li>
        <li>Una vez acreditado el pago, el saldo se carga automáticamente en la cuenta del alumno.</li>
        <li>No se aceptan reembolsos en efectivo. Si un saldo cargado no se va a usar, contactanos para coordinar.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6">5. Responsabilidades</h2>
      <p>
        El padre/madre/tutor es responsable de los datos cargados y de mantener su contraseña en secreto.
        Croix SAS es responsable de la calidad y entrega de las viandas. ViandApp es la plataforma tecnológica
        que registra la operación.
      </p>

      <h2 className="text-lg font-semibold mt-6">6. Disponibilidad del servicio</h2>
      <p>
        Hacemos lo posible para que la app esté siempre disponible, pero pueden ocurrir interrupciones por
        mantenimiento o problemas técnicos. En esos casos, los pedidos en curso se respetan según los registros
        del último día operativo.
      </p>

      <h2 className="text-lg font-semibold mt-6">7. Contacto</h2>
      <p>
        Para consultas, reclamos o ejercer tus derechos sobre tus datos, escribinos a{' '}
        <a href="mailto:fmajul2@gmail.com" className="text-primary underline"><strong>fmajul2@gmail.com</strong></a>.
      </p>

      <h2 className="text-lg font-semibold mt-6">8. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia se somete a los
        tribunales ordinarios de la ciudad de San Miguel de Tucumán, provincia de Tucumán.
      </p>
    </>
  )
}

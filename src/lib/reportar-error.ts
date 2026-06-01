/**
 * Reporta un error en server side. Si `ERROR_WEBHOOK_URL` está configurado,
 * postea un mensaje (compatible con Slack y Discord). Si no, queda en consola
 * y se ve en los logs de Vercel.
 *
 * Para activar:
 *   - Slack: crear un Incoming Webhook → poner URL en ERROR_WEBHOOK_URL
 *   - Discord: server settings → Integrations → New Webhook → poner URL en ERROR_WEBHOOK_URL
 *
 * Usar SOLO en server actions / API routes (no en client components).
 */
export async function reportarError(scope: string, error: unknown, contexto?: Record<string, unknown>): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  const fecha = new Date().toISOString()

  console.error(`[viandapp:${scope}]`, msg, contexto ?? '', stack ?? '')

  const webhook = process.env.ERROR_WEBHOOK_URL
  if (!webhook) return

  // Mensaje plano compatible con Slack/Discord
  const lineas = [
    `🚨 *ViandApp · ${scope}*`,
    '```',
    `Error: ${msg}`,
    contexto ? `Contexto: ${JSON.stringify(contexto)}` : null,
    `UTC: ${fecha}`,
    '```',
  ].filter(Boolean)

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Slack usa `text`, Discord usa `content`; mandamos ambos.
      body: JSON.stringify({ text: lineas.join('\n'), content: lineas.join('\n') }),
    })
  } catch (e) {
    // No queremos que un fallo del notificador rompa la request.
    console.error('[reportarError] webhook falló:', e)
  }
}

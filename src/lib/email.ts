import { reportarError } from '@/lib/reportar-error'

type EmailInput = {
  to: string
  subject: string
  /** HTML body. Para texto plano usar <pre> o sumamos `text` field más adelante. */
  html: string
}

/**
 * Envía un email transaccional vía Resend.
 * - Si RESEND_API_KEY no está configurado, no tira: devuelve `{ ok: false }`
 *   y reporta. Permite que dev/staging sin Resend no se rompa.
 * - El FROM se arma con FROM_EMAIL y FROM_NAME (env vars). Default razonable
 *   si faltan.
 *
 * Usar SOLO server-side (API routes, server actions). Si se importa desde un
 * componente cliente, RESEND_API_KEY queda expuesta.
 */
export async function enviarEmail(input: EmailInput): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // En dev/preview sin Resend no es un error; en prod conviene saberlo.
    if (process.env.NODE_ENV === 'production') {
      await reportarError('email-sin-api-key', new Error('RESEND_API_KEY no configurada'), { to: input.to, subject: input.subject })
    }
    return { ok: false }
  }

  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  const fromName = process.env.FROM_NAME || 'ViandApp'
  const from = `${fromName} <${fromEmail}>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    })
    if (!res.ok) {
      const detalle = await res.text().catch(() => '')
      await reportarError('email-resend-fallo', new Error(`Resend respondió ${res.status}: ${detalle}`), { to: input.to, subject: input.subject })
      return { ok: false }
    }
    return { ok: true }
  } catch (e) {
    await reportarError('email-resend-excepcion', e, { to: input.to, subject: input.subject })
    return { ok: false }
  }
}

/**
 * Email genérico de "se hizo X en tu cuenta". Patrón base para notificaciones
 * de seguridad (cambio de password, cambio de email, login desde nuevo
 * dispositivo, etc).
 */
export function emailNotificacionSeguridad({
  titulo,
  saludoNombre,
  accion,
  cuando,
  consejo,
}: {
  titulo: string
  saludoNombre: string
  accion: string
  cuando: string
  consejo: string
}): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1A1D21;">
  <h1 style="font-size: 20px; margin: 0 0 16px;">${titulo}</h1>
  <p style="margin: 0 0 12px;">Hola ${saludoNombre},</p>
  <p style="margin: 0 0 12px;">Te avisamos que ${accion}.</p>
  <p style="margin: 0 0 12px; color: #666; font-size: 14px;">Cuándo: ${cuando}</p>
  <div style="background: #f5f5f5; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 14px;">
    <strong>¿No fuiste vos?</strong> ${consejo}
  </div>
  <p style="margin: 24px 0 0; font-size: 12px; color: #999;">
    Este es un mensaje automático de ViandApp. No respondas a este email.
  </p>
</body>
</html>`
}

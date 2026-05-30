import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SubBody = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let sub: SubBody
  try {
    sub = (await req.json()) as SubBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: 'Suscripción incompleta' }, { status: 400 })
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? null

  // Upsert por endpoint: si ya existe, actualiza last_seen_at
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        usuario_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

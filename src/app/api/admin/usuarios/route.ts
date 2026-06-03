import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/profile'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarAudit } from '@/lib/audit'

const ROLES = new Set(['operadora', 'encargada', 'administrativo'])

export async function POST(req: Request) {
  const profile = await getProfile()
  if (!profile || profile.rol !== 'administrativo') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: { email?: string; password?: string; nombre?: string; rol?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const nombre = String(body.nombre ?? '').trim()
  const rol = String(body.rol ?? '')

  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  if (!nombre) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
  if (!ROLES.has(rol)) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  })
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'No se pudo crear el usuario' }, { status: 400 })
  }

  // Insertar perfil con el cliente del invocante (passes RLS porque es admin)
  const supabase = createServerClient()
  const { error: errProfile } = await supabase.rpc('fn_crear_perfil_usuario', {
    p_user_id: data.user.id,
    p_nombre: nombre,
    p_rol: rol,
  })
  if (errProfile) {
    await admin.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ error: errProfile.message }, { status: 400 })
  }

  await registrarAudit({
    actor_id: profile.id,
    accion: 'usuario_creado',
    recurso_tipo: 'usuario',
    recurso_id: data.user.id,
    detalle: { email, rol, nombre },
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
    user_agent: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true, id: data.user.id })
}

export async function DELETE(req: Request) {
  const profile = await getProfile()
  if (!profile || profile.rol !== 'administrativo') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await req.json().catch(() => ({ id: '' }))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
  }
  if (id === profile.id) {
    return NextResponse.json({ error: 'No podés borrarte a vos mismo' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // La fila en `usuarios` se borra en cascada por ON DELETE CASCADE de auth.users.

  await registrarAudit({
    actor_id: profile.id,
    accion: 'usuario_borrado',
    recurso_tipo: 'usuario',
    recurso_id: id,
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip'),
    user_agent: req.headers.get('user-agent'),
  })

  return NextResponse.json({ ok: true })
}

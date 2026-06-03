'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validarPasswordFuerte } from '@/lib/auth/password'

type RegistroInput = {
  email: string
  password: string
  nombre: string
  telefono: string
  // Campo trampa para bots. Es un input "hidden" que solo un bot completaría
  // automáticamente; un humano no lo ve. Si llega con contenido, abortamos
  // sin mostrar error específico (devolvemos OK para no avisarle al bot que
  // lo detectamos).
  correo_secundario?: string
}

export async function registrar(input: RegistroInput): Promise<{ error: string } | void> {
  // Honeypot: si el bot llenó el campo trampa, fingimos éxito y nos vamos.
  if (input.correo_secundario && input.correo_secundario.trim().length > 0) {
    redirect('/confirmar-email?email=bot')
  }

  const email = input.email.trim().toLowerCase()
  const password = input.password
  const nombre = input.nombre.trim()
  const telefono = input.telefono.trim() || null

  if (!email || !password || !nombre) {
    return { error: 'Completá nombre, email y contraseña' }
  }
  const motivo = validarPasswordFuerte(password)
  if (motivo) return { error: motivo }

  const supabase = createClient()

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, telefono } },
  })
  if (signUpError) {
    return { error: signUpError.message || 'No se pudo crear la cuenta' }
  }
  if (!data.session) {
    // Supabase pide confirmación por email. Llevamos al usuario a una pantalla
    // que le explica que tiene que abrir el link recibido en su casilla.
    redirect(`/confirmar-email?email=${encodeURIComponent(email)}`)
  }

  const { error: profileError } = await supabase.rpc('fn_self_register_padre', {
    p_nombre: nombre,
    p_telefono: telefono,
  })
  if (profileError) {
    return { error: profileError.message || 'No se pudo crear el perfil' }
  }

  revalidatePath('/', 'layout')
  redirect('/familia/onboarding')
}

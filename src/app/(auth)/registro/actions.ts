'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type RegistroInput = {
  email: string
  password: string
  nombre: string
  telefono: string
}

export async function registrar(input: RegistroInput): Promise<{ error: string } | void> {
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const nombre = input.nombre.trim()
  const telefono = input.telefono.trim() || null

  if (!email || !password || !nombre) {
    return { error: 'Completá nombre, email y contraseña' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

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

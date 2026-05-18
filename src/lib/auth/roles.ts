import { redirect } from 'next/navigation'
import { getProfile } from './profile'
import type { Profile, Rol } from '@/lib/supabase/types'

/**
 * Garantiza que el usuario está logueado y tiene uno de los roles permitidos.
 * Redirige a /pedidos si el rol no coincide (en vez de mostrar error en pantalla).
 */
export async function requireRole(roles: Rol[]): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!roles.includes(profile.rol)) redirect('/pedidos')
  return profile
}

export function puedeEscribirPedidos(rol: Rol): boolean {
  return rol === 'operadora'
}

export function puedeEscribirAlumnos(rol: Rol): boolean {
  return rol === 'operadora'
}

export function puedeEscribirProductos(rol: Rol): boolean {
  return rol === 'operadora' || rol === 'administrativo'
}

export function puedeCargarCredito(rol: Rol): boolean {
  return rol === 'administrativo'
}

export function puedeEditarMenus(rol: Rol): boolean {
  return rol === 'administrativo'
}

export function puedeGestionarUsuarios(rol: Rol): boolean {
  return rol === 'administrativo'
}

export function puedeVerCaja(rol: Rol): boolean {
  return rol === 'administrativo'
}

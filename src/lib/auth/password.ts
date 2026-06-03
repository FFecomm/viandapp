export const PASSWORD_MIN = 8

/**
 * Validador único de fortaleza de contraseña para toda la app.
 * Devuelve un mensaje de error en español, o null si la contraseña pasa.
 *
 * Política: mínimo 8 caracteres, al menos una letra y al menos un número.
 * Es un piso razonable para una app no técnica sin caer en políticas
 * imposibles de cumplir desde un celular (símbolos obligatorios, etc).
 */
export function validarPasswordFuerte(p: string): string | null {
  if (p.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`
  if (!/[a-zA-Z]/.test(p)) return 'La contraseña debe incluir al menos una letra'
  if (!/[0-9]/.test(p)) return 'La contraseña debe incluir al menos un número'
  return null
}

export const PASSWORD_HINT = `Mínimo ${PASSWORD_MIN} caracteres, una letra y un número.`

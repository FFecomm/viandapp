import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const accessToken = process.env.MP_ACCESS_TOKEN

export function tieneMpConfigurado(): boolean {
  return Boolean(accessToken && accessToken.length > 0)
}

function client() {
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN no está configurado')
  return new MercadoPagoConfig({ accessToken })
}

export function preferenceClient() {
  return new Preference(client())
}

export function paymentClient() {
  return new Payment(client())
}

export const COMISION_POR_VIANDA = Number(process.env.COMISION_POR_VIANDA ?? 400)

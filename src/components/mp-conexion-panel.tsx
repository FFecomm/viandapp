import Link from 'next/link'
import { CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react'
import { obtenerConexionMpActiva, tieneMpOAuthConfigurado } from '@/lib/mercadopago'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SearchParams = { mp?: string; detalle?: string }

export async function MpConexionPanel({ searchParams }: { searchParams: SearchParams }) {
  const oauthConfigurado = tieneMpOAuthConfigurado()
  if (!oauthConfigurado) {
    return (
      <div className="rounded-xl border bg-orange-50 border-orange-200 p-4 text-sm space-y-1">
        <p className="font-medium flex items-center gap-2">
          <AlertCircle className="size-4" /> Mercado Pago no configurado
        </p>
        <p className="text-muted-foreground">
          Las claves <code>MP_CLIENT_ID</code> y <code>MP_CLIENT_SECRET</code> faltan en el servidor.
          Agregalas en las variables de entorno de Vercel y volvé.
        </p>
      </div>
    )
  }

  const conexion = await obtenerConexionMpActiva()

  return (
    <div className="rounded-xl border p-4 text-sm space-y-3">
      {searchParams.mp === 'ok' ? (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-800">
          ✅ Mercado Pago conectado correctamente.
        </div>
      ) : null}
      {searchParams.mp === 'error' ? (
        <div className="rounded-md bg-destructive/5 border border-destructive/30 p-3 text-destructive">
          ❌ No se pudo completar la conexión{searchParams.detalle ? `: ${searchParams.detalle}` : ''}.
        </div>
      ) : null}

      {conexion ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" /> Mercado Pago conectado
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cuenta MP: <span className="font-mono">{conexion.mp_user_id}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Token válido hasta: {new Date(conexion.expires_at).toLocaleDateString('es-AR')}
              </p>
            </div>
            <Link
              href="/api/mp/oauth/init"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9')}
            >
              Reconectar
            </Link>
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="font-medium">Mercado Pago todavía no está conectado</p>
            <p className="text-muted-foreground mt-1">
              Las familias no van a poder cargar saldo hasta que el colegio autorice su cuenta de Mercado Pago.
            </p>
          </div>
          <Link
            href="/api/mp/oauth/init"
            className={cn(buttonVariants(), 'h-10 w-full sm:w-auto')}
          >
            Conectar Mercado Pago <ExternalLink className="size-4" />
          </Link>
        </>
      )}
    </div>
  )
}

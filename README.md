# ViandApp

App de gestión de viandas escolares.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Auth + Postgres + Realtime)
- Tailwind CSS + shadcn/ui
- SheetJS (xlsx) para exportación
- PWA instalable
- Deploy en Vercel

## Setup local

```bash
# 1. Variables de entorno
cp .env.local.example .env.local
# Completar con los datos del proyecto de Supabase.

# 2. Dependencias
npm install

# 3. Aplicar migraciones SQL en Supabase
# Ver supabase/migrations/README.md

# 4. Dev server
npm run dev
```

Abrir http://localhost:3000.

## Estructura

```
src/
├── app/                          # rutas (App Router)
├── components/ui/                # primitives de shadcn
├── components/                   # componentes propios
└── lib/
    ├── supabase/                 # clientes browser/server/middleware
    ├── credito/                  # lógica FIFO de crédito (wrappers de RPC)
    └── utils.ts

supabase/migrations/              # SQL versionado

public/                           # manifest PWA, iconos, service worker
scripts/                          # utilidades (gen-icons, etc.)
```

## Roles

| Usuario | Permisos |
|---|---|
| Operadora | Pedidos, alumnos, crédito, productos, planilla |
| Encargada | Pedidos (lectura), planilla |
| Administrativo | Caja, crédito, productos, menús, usuarios |

El primer Administrativo se crea a mano en Supabase Auth. Desde la app, ese Administrativo da de alta a los otros 2 usuarios.

# Logo y favicon · ViandApp

Hoy hay un placeholder (letra "V" sobre el azul de marca). Cuando Croix te pase el logo definitivo, reemplazá estos archivos en `public/`.

## Archivos a reemplazar

| Archivo | Tamaño | Uso |
|---------|--------|-----|
| `public/icon.svg` | vectorial | favicon principal (lo usa Next.js) |
| `public/icon-192.png` | 192×192 | PWA icon estándar |
| `public/icon-512.png` | 512×512 | PWA splash + Android home screen |
| `public/icon-maskable-512.png` | 512×512 | PWA "maskable" — el logo debe quedar dentro del "safe zone" central (80% del tamaño) |
| `public/apple-icon.png` | 180×180 | iOS home screen |

## Cómo generar todos los tamaños

Si Croix te pasa el logo en un solo archivo (preferentemente SVG o PNG 1024×1024):

1. Subilo a [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Configurá:
   - **iOS:** background color `#1A3A6B` (navy de marca) o blanco
   - **Android Chrome:** color de tema `#378ADD`
   - **Windows tiles:** ignorar
   - **Safari pinned tab:** color `#378ADD`
3. Descargá el zip → pegá los archivos en `public/` reemplazando los actuales.

## Después del reemplazo

```bash
git add public/icon* public/apple-icon.png
git commit -m "feat: logo y favicon de Croix"
git push
```

Vercel auto-deploya en ~1 min. Los usuarios que ya tienen la app instalada como PWA pueden tener que reinstalarla para ver el ícono nuevo.

## Logo en pantallas internas

Hoy el nombre "ViandApp" aparece como texto en:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/registro/page.tsx`
- `src/app/(auth)/bienvenida/bienvenida.tsx`
- `src/app/(legal)/layout.tsx`
- `src/components/page-header.tsx`

Si querés mostrar el logo de Croix en lugar del texto:
1. Guardar el logo en `public/logo-croix.svg` (o png)
2. Reemplazar el `<h1>ViandApp</h1>` por `<Image src="/logo-croix.svg" alt="ViandApp" width={150} height={40} />`

Pedímelo cuando tengas el archivo y lo cambio.

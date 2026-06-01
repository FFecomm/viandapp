# Templates de email · ViandApp

Estos son los emails transaccionales que Supabase Auth envía. Por defecto vienen en inglés y con el branding de Supabase. Pegá cada uno en su lugar correspondiente.

## Dónde pegarlos

1. Andá a [supabase.com/dashboard](https://supabase.com/dashboard) → proyecto `qecpszqssdockwumybhc`
2. Menú lateral: **Authentication** → **Email Templates**
3. Para cada template de abajo: pegá el **Subject** y el **Message body**

Variables disponibles (las usa Supabase, no tocar):
- `{{ .ConfirmationURL }}` — link de confirmación
- `{{ .Email }}` — email del usuario
- `{{ .Token }}` — código de 6 dígitos (no lo usamos)

---

## 1. Confirm signup

**Subject:** `Confirmá tu cuenta de ViandApp`

**Message body (HTML):**

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1A1D21;">
  <div style="background: #1A3A6B; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">ViandApp</h1>
  </div>
  <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; line-height: 1.5;">¡Hola!</p>
    <p style="font-size: 16px; line-height: 1.5;">
      Gracias por registrarte en ViandApp. Para activar tu cuenta y empezar a pedir viandas, confirmá tu email haciendo clic en el botón:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: #378ADD; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Confirmar mi email
      </a>
    </div>
    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
      Si vos no creaste esta cuenta, ignorá este email.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      ViandApp · Gestión de viandas escolares
    </p>
  </div>
</div>
```

---

## 2. Reset password (Magic Link)

**Subject:** `Recuperá tu contraseña de ViandApp`

**Message body (HTML):**

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1A1D21;">
  <div style="background: #1A3A6B; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">ViandApp</h1>
  </div>
  <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; line-height: 1.5;">¡Hola!</p>
    <p style="font-size: 16px; line-height: 1.5;">
      Recibimos un pedido para recuperar tu contraseña. Hacé clic en el botón para crear una nueva:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: #378ADD; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Crear nueva contraseña
      </a>
    </div>
    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
      El link es válido por 1 hora. Si vos no pediste este cambio, ignorá este email — tu contraseña sigue siendo la misma.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      ViandApp · Gestión de viandas escolares
    </p>
  </div>
</div>
```

---

## 3. Magic Link (no se usa hoy, pero por las dudas)

**Subject:** `Tu link de acceso a ViandApp`

**Message body (HTML):**

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1A1D21;">
  <div style="background: #1A3A6B; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">ViandApp</h1>
  </div>
  <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; line-height: 1.5;">¡Hola!</p>
    <p style="font-size: 16px; line-height: 1.5;">
      Hacé clic abajo para entrar a tu cuenta:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: #378ADD; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Entrar a ViandApp
      </a>
    </div>
    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
      Si vos no pediste este link, ignorá este email.
    </p>
  </div>
</div>
```

---

## 4. Change email

**Subject:** `Confirmá tu nuevo email en ViandApp`

**Message body (HTML):**

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1A1D21;">
  <div style="background: #1A3A6B; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">ViandApp</h1>
  </div>
  <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; line-height: 1.5;">¡Hola!</p>
    <p style="font-size: 16px; line-height: 1.5;">
      Para confirmar el cambio de email en tu cuenta de ViandApp, hacé clic:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background: #378ADD; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Confirmar nuevo email
      </a>
    </div>
    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
      Si vos no pediste este cambio, ignorá este email y avisanos.
    </p>
  </div>
</div>
```

---

## También revisá

En **Authentication → URL Configuration**:
- **Site URL:** `https://viandapp.vercel.app`
- **Redirect URLs (allow list):** agregá las que usa la app:
  - `https://viandapp.vercel.app/**`
  - `http://localhost:3000/**` (para desarrollo)

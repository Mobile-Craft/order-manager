# 📧 Configuración de Correos de Invitación - Order Manager

## 🎨 Template Diseñado

He creado un hermoso template de correo que coincide con el diseño de tu app Order Manager:

### ✨ Características del Template:
- **Colores de tu app**: Azul primario (#00AEEF) y azul oscuro (#007FB3)
- **Diseño moderno**: Gradientes, sombras y tipografía Inter
- **Responsive**: Se ve perfecto en móvil y desktop
- **Información completa**: Incluye todos los datos de la invitación
- **Pasos claros**: Proceso visual paso a paso
- **Call-to-action**: Botón para abrir la app directamente

## ⚙️ Configuración Requerida en Supabase Dashboard

### 1. **URL Configuration** (Authentication > URL Configuration)

**Site URL:**
```
myapp://
```

**Redirect URLs:** (agregar una por línea)
```
myapp://auth/callback
myapp://invitation
http://localhost:3000/auth/callback
```

### 2. **Email Template** (Authentication > Email Templates > Magic Link)

**Subject:**
```
Invitación a {{.Data.business_name}} - Order Manager
```

**Body (HTML):**
- Copia el contenido completo de `supabase/email-templates/invitation-template.html`
- Pégalo en el campo "Body" del template

**Body (Text):** (opcional, para clientes sin HTML)
- Copia el contenido de `supabase/email-templates/invitation-template.txt`

### 3. **Email Provider** (Authentication > Settings > Email)

Asegúrate de que tienes configurado un proveedor de correo:
- **Por defecto**: Supabase usa su propio servicio (limitado)
- **Recomendado**: Configura SendGrid, Mailgun, o AWS SES para producción

## 🎯 Variables Disponibles en el Template

El template usa estas variables que se envían desde tu código:

- `{{.Email}}` - Email del invitado
- `{{.Data.business_name}}` - Nombre del negocio
- `{{.Data.role}}` - Rol asignado (Cajero, Cocina, etc.)
- `{{.Data.invited_by_name}}` - Nombre del administrador
- `{{.ConfirmationURL}}` - Link para abrir la app

## 🚀 Resultado Final

El correo incluirá:

1. **Header atractivo** con el logo de Order Manager
2. **Información de la invitación** en una tarjeta destacada
3. **Proceso paso a paso** con numeración visual
4. **Botón para abrir la app** si está instalada
5. **Información importante** en caja de advertencia
6. **Firma personalizada** del administrador que invita
7. **Footer profesional** con branding de Order Manager

## 🎨 Preview del Diseño

```
┌─────────────────────────────────────┐
│  📱 Order Manager                   │
│  🎉 ¡Has sido invitado!            │
│  Únete al equipo y comienza...     │
├─────────────────────────────────────┤
│                                     │
│  ¡Hola!                            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [NOMBRE NEGOCIO]        │   │
│  │       [CAJERO]              │   │
│  │  Invitado por [ADMIN]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  📱 Proceso de Registro             │
│  ┌─────────────────────────────┐   │
│  │ 1️⃣ Descarga Order Manager   │   │
│  │ 2️⃣ Crear Cuenta Nueva       │   │
│  │ 3️⃣ Configura tu Contraseña  │   │
│  │ 4️⃣ Verifica tu Email        │   │
│  │ 5️⃣ Completa tu Perfil       │   │
│  └─────────────────────────────┘   │
│                                     │
│    [🚀 Abrir Order Manager]        │
│                                     │
│  ⚠️ Información Importante          │
│  • Usa exactamente este email      │
│  • Expira en 7 días                │
│                                     │
├─────────────────────────────────────┤
│  Order Manager                      │
│  Sistema de gestión...              │
└─────────────────────────────────────┘
```

## ✅ Pasos para Activar

1. **Aplicar configuración en Supabase** (URLs y template)
2. **Probar enviando una invitación** desde tu app
3. **Verificar que el correo llegue** con el diseño correcto
4. **Probar el flujo completo** de registro

¡El sistema está listo para enviar correos hermosos y profesionales! 🎉

## Problema Identificado

El sistema actual de invitaciones no envía correos automáticamente porque:

1. **No hay creación de usuarios en Supabase Auth**: Solo se creaba una entrada en `business_invitations`
2. **Falta configuración SMTP**: Supabase necesita configuración de correo para enviar emails
3. **No hay integración con el flujo OTP**: Los usuarios invitados no pasaban por verificación de email

## Solución Implementada

### 1. Cambios en el Código

#### `UsersScreen.tsx` - Función `sendInvitation`
- Ahora crea un usuario real en Supabase Auth usando `supabase.auth.admin.createUser()`
- El usuario recibe automáticamente un email de confirmación con OTP
- Se incluye metadata de la invitación

#### `AuthContext.tsx` - Nuevas funciones
- `completeInvitedUserRegistration()`: Para que usuarios invitados completen su perfil
- `isInvitedUser()`: Detecta si el usuario es un invitado pendiente

#### `InvitedUserSetupScreen.tsx` - Nueva pantalla
- Permite a usuarios invitados completar su registro después de confirmar email
- Interfaz específica para el flujo de invitación

#### `AuthNavigator.tsx` - Flujo actualizado
- Detecta usuarios invitados y los dirige a la pantalla correcta
- Maneja el flujo completo de autenticación para invitados

### 2. Configuración Requerida en Supabase

#### A. Configurar SMTP (Obligatorio)

1. Ir a **Authentication > Settings > SMTP Settings** en el dashboard de Supabase
2. Configurar un proveedor SMTP. Opciones recomendadas:

**Opción 1: Gmail SMTP**
```
Host: smtp.gmail.com
Port: 587
Username: tu-email@gmail.com
Password: tu-app-password (no tu contraseña normal)
```

**Opción 2: SendGrid**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: tu-sendgrid-api-key
```

**Opción 3: Resend (Recomendado)**
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: tu-resend-api-key
```

#### B. Personalizar Email Templates

1. Ir a **Authentication > Settings > Email Templates**
2. Seleccionar "Confirm signup"
3. Reemplazar con esta plantilla:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu cuenta</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Bienvenido al equipo</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Has sido invitado a unirte a nuestro sistema</p>
        </div>
        
        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Tu código de verificación es:</p>
            <div style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 8px; margin: 10px 0;">{{ .Token }}</div>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Este código expira en 24 horas</p>
        </div>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 6px; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Próximos pasos:</h3>
            <ol style="margin: 0; color: #065f46; padding-left: 20px;">
                <li>Usa este código para verificar tu email en la aplicación</li>
                <li>Inicia sesión con tu email y la contraseña temporal que te proporcionaron</li>
                <li>Completa tu perfil con tu nombre completo</li>
            </ol>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
            Si no solicitaste esta cuenta, puedes ignorar este email.
        </p>
    </div>
</body>
</html>
```

#### C. Configurar Rate Limiting (Opcional pero recomendado)

1. Ir a **Authentication > Settings > Rate Limiting**
2. Configurar límites:
   - Max emails por hora: 100
   - Max emails por día: 1000

### 3. Flujo de Usuario Completo

#### Para el Administrador:
1. Va a "Usuarios" > "Invitar Usuario"
2. Ingresa email y selecciona rol
3. Sistema crea usuario en Supabase Auth con contraseña temporal
4. Usuario recibe email automático con código OTP
5. Administrador recibe la contraseña temporal para compartir

#### Para el Usuario Invitado:
1. Recibe email con código OTP
2. Abre la app e inicia sesión con email y contraseña temporal
3. Sistema detecta que necesita verificar email
4. Ingresa código OTP recibido por email
5. Sistema lo dirige a completar su perfil
6. Ingresa su nombre completo
7. Queda registrado y puede usar el sistema

### 4. Migraciones de Base de Datos

Las siguientes migraciones se han creado:

1. **`20251014030000_invitation_improvements.sql`**
   - Agrega campo `auth_user_id` a `business_invitations`
   - Función para auto-crear perfiles cuando se confirma email
   - Trigger automático para procesar invitaciones

2. **`20251014035000_email_configuration.sql`**
   - Documentación de configuración de emails
   - Funciones de validación y verificación

### 5. Verificación del Sistema

#### Verificar que SMTP está configurado:
1. Ir a Supabase Dashboard > Authentication > Settings
2. Confirmar que SMTP está configurado y funcionando

#### Probar el flujo:
1. Crear una invitación desde la app
2. Verificar que se recibe el email
3. Confirmar que el código OTP funciona
4. Verificar que el usuario puede completar su perfil

### 6. Posibles Problemas y Soluciones

#### Error: "Admin API is not enabled"
- **Solución**: Verificar que tienes la clave de servicio correcta y permisos de admin

#### No se reciben emails
- **Solución**: Verificar configuración SMTP en Supabase Dashboard

#### Error al crear usuario: "User already exists"
- **Solución**: El sistema ahora maneja este caso y sugiere usar recuperación de contraseña

#### Emails van a spam
- **Solución**: Configurar SPF, DKIM y DMARC records para tu dominio

### 7. Monitoreo

Para monitorear el sistema:
1. Revisar logs en Supabase Dashboard > Database > Logs
2. Verificar métricas de emails en Authentication > Logs
3. Monitorear errores en la consola de la aplicación

### 8. Consideraciones de Seguridad

- Las contraseñas temporales se generan de forma segura
- Los tokens OTP expiran en 24 horas
- Solo administradores pueden enviar invitaciones
- Se valida que no existan usuarios duplicados

## Resumen

Con estos cambios, el sistema ahora:
✅ Crea usuarios reales en Supabase Auth
✅ Envía emails automáticamente con códigos OTP
✅ Maneja el flujo completo de verificación
✅ Permite a usuarios invitados completar su registro
✅ Integra con el sistema de autenticación existente

La configuración más importante es el SMTP en Supabase Dashboard - sin esto, no se enviarán emails.
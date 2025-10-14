# Configuración del Sistema de Emails para Invitaciones

Este documento explica cómo configurar el sistema de emails automáticos para las invitaciones de usuarios.

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
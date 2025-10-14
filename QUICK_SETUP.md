# 🚀 Guía Rápida: Configuración de Emails para Invitaciones

## ❌ Problema Identificado
El sistema NO enviaba correos automáticamente al crear usuarios porque:
- Solo se creaba una entrada en la base de datos (no un usuario real)
- Falta configuración SMTP en Supabase
- No había integración con el sistema OTP

## ✅ Solución Implementada

### 1. Cambios de Código (Ya implementados)
- ✅ `UsersScreen.tsx`: Ahora crea usuarios reales con `supabase.auth.admin.createUser()`
- ✅ `AuthContext.tsx`: Nuevas funciones para usuarios invitados
- ✅ `InvitedUserSetupScreen.tsx`: Pantalla para completar registro
- ✅ `AuthNavigator.tsx`: Flujo actualizado para invitados
- ✅ Migraciones de base de datos actualizadas

### 2. 🔧 Configuración Requerida en Supabase (MANUAL)

#### A. Configurar SMTP (OBLIGATORIO)
1. Ir a **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**
2. Elegir un proveedor (recomendado: **Resend** o **SendGrid**)

**Ejemplo con Resend:**
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [tu-api-key-de-resend]
Sender: tu-app@tudominio.com
```

#### B. Personalizar Email Template
1. Ir a **Authentication** → **Settings** → **Email Templates**
2. Seleccionar **"Confirm signup"**
3. Reemplazar con la plantilla del archivo `EMAIL_SETUP.md`

## 🎯 Nuevo Flujo de Usuario

### Administrador:
1. Va a "Usuarios" → "Invitar Usuario"
2. Ingresa email y rol
3. **Automáticamente** se crea usuario y se envía email con OTP
4. Recibe contraseña temporal para compartir

### Usuario Invitado:
1. **Recibe email automático** con código OTP ✨
2. Inicia sesión con email + contraseña temporal
3. Verifica email con código OTP
4. Completa su perfil
5. ¡Listo para usar el sistema!

## ⚡ Pasos Inmediatos

1. **Aplicar migraciones** en Supabase:
   ```bash
   # Si usas CLI de Supabase
   supabase db push
   ```

2. **Configurar SMTP** en Dashboard de Supabase (obligatorio)

3. **Personalizar email template** (recomendado)

4. **Probar el flujo**:
   - Crear una invitación
   - Verificar que llega el email
   - Confirmar que el OTP funciona

## 🔍 Verificar que Funciona

### ✅ Checklist:
- [ ] SMTP configurado en Supabase Dashboard
- [ ] Email template personalizado
- [ ] Migraciones aplicadas
- [ ] Prueba exitosa de invitación
- [ ] Usuario recibe email con OTP
- [ ] Flujo de verificación funciona
- [ ] Usuario puede completar registro

## 🚨 Problemas Comunes

**No llegan emails:**
- Verificar configuración SMTP
- Revisar que el email no esté en spam
- Comprobar límites de rate limiting

**Error "Admin API not enabled":**
- Verificar que usas la clave de servicio correcta
- Asegurar permisos de administrador

## 📝 Archivos Creados/Modificados

- ✅ `screens/UsersScreen.tsx` - Función sendInvitation actualizada
- ✅ `context/AuthContext.tsx` - Funciones para usuarios invitados
- ✅ `screens/auth/InvitedUserSetupScreen.tsx` - Nueva pantalla
- ✅ `components/AuthNavigator.tsx` - Flujo actualizado
- ✅ `supabase/migrations/20251014030000_invitation_improvements.sql`
- ✅ `supabase/migrations/20251014035000_email_configuration.sql`
- ✅ `EMAIL_SETUP.md` - Documentación completa

## 🎉 Resultado

Con estos cambios, **el sistema ahora envía emails automáticamente** con códigos OTP cuando se crean invitaciones, integrándose perfectamente con el flujo de autenticación existente.

**Lo más importante:** Configurar SMTP en Supabase Dashboard para que funcionen los emails.
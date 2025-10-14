/*
  # Configuración de Email Templates para Supabase

  Esta migración incluye las configuraciones necesarias para los emails automáticos.
  
  IMPORTANTE: Estas configuraciones deben aplicarse manualmente en el dashboard de Supabase:
  
  1. Ir a Authentication > Settings > Email Templates
  2. Configurar las siguientes plantillas:
  
  ## Confirm signup (Confirmación de registro)
  Subject: Confirma tu cuenta en {{.SiteName}}
  
  Body:
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

  ## SMTP Settings
  Para que los emails funcionen, también debes configurar SMTP en:
  Authentication > Settings > SMTP Settings
  
  Opciones recomendadas:
  - Gmail SMTP
  - SendGrid
  - Amazon SES
  - Resend
  
  ## Variables de entorno necesarias:
  - SMTP_HOST
  - SMTP_PORT  
  - SMTP_USER
  - SMTP_PASS
  - SMTP_SENDER_NAME
  
  ## Rate Limiting
  Se recomienda configurar rate limiting para emails:
  - Max emails por hora: 100
  - Max emails por día: 1000
*/

-- Esta función ayuda a verificar la configuración de email
CREATE OR REPLACE FUNCTION check_email_configuration()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'status', 'info',
    'message', 'Para completar la configuración de emails, sigue las instrucciones en la migración 20251014035000_email_configuration.sql',
    'steps', json_build_array(
      '1. Configurar SMTP en Supabase Dashboard',
      '2. Personalizar Email Templates',
      '3. Configurar Rate Limiting',
      '4. Probar envío de emails'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Función para probar que un email es válido antes de crear invitación
CREATE OR REPLACE FUNCTION validate_email_for_invitation(email_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validación básica de formato de email
  IF email_param !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que no existe ya un usuario con ese email
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = email_param
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que no hay invitación pendiente
  IF EXISTS (
    SELECT 1 FROM business_invitations 
    WHERE email = email_param 
    AND NOT accepted 
    AND expires_at > now()
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
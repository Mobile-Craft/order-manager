-- Crear trigger para enviar correos de invitación usando Supabase nativo
-- Este trigger usará el sistema de notificaciones integrado de Supabase

-- Función que envía notificación para que Supabase procese el correo
CREATE OR REPLACE FUNCTION send_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  business_name text;
  admin_name text;
  invitation_data jsonb;
BEGIN
  -- Obtener información del negocio y administrador
  SELECT b.name INTO business_name
  FROM businesses b 
  WHERE b.id = NEW.business_id;
  
  SELECT up.full_name INTO admin_name
  FROM user_profiles up
  WHERE up.user_id = NEW.invited_by;
  
  -- Crear el payload con toda la información necesaria
  invitation_data := jsonb_build_object(
    'type', 'business_invitation',
    'invitation_id', NEW.id,
    'email', NEW.email,
    'role', NEW.role,
    'business_name', COALESCE(business_name, 'tu negocio'),
    'admin_name', COALESCE(admin_name, 'el administrador'),
    'business_id', NEW.business_id,
    'expires_at', NEW.expires_at,
    'created_at', NEW.created_at
  );
  
  -- Usar NOTIFY para enviar la notificación
  -- Esto permite que el sistema externo procese el correo
  PERFORM pg_notify('invitation_email', invitation_data::text);
  
  -- También insertar en una tabla de logs para tracking
  INSERT INTO email_queue (
    type,
    recipient_email,
    data,
    status,
    created_at
  ) VALUES (
    'business_invitation',
    NEW.email,
    invitation_data,
    'pending',
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear tabla para queue de correos
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  recipient_email text NOT NULL,
  data jsonb NOT NULL,
  status text DEFAULT 'pending', -- pending, sent, failed
  attempts integer DEFAULT 0,
  last_error text,
  created_at timestamp with time zone DEFAULT NOW(),
  sent_at timestamp with time zone,
  UNIQUE(type, recipient_email, created_at)
);

-- Habilitar RLS en email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Política para que admins puedan ver los correos de su negocio
CREATE POLICY "Admins can view email queue" ON email_queue
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'Admin'
      AND up.business_id = (data->>'business_id')::uuid
    )
  );

-- Crear el trigger que se ejecuta después de insertar una invitación
DROP TRIGGER IF EXISTS trigger_send_invitation_notification ON business_invitations;
CREATE TRIGGER trigger_send_invitation_notification
  AFTER INSERT ON business_invitations
  FOR EACH ROW
  EXECUTE FUNCTION send_invitation_notification();
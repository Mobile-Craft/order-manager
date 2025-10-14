/*
  # Sistema de Invitaciones por Email

  1. Funciones
    - Función para generar contraseñas temporales
    - Función para enviar invitaciones
    - Función para aceptar invitaciones

  2. Actualizaciones
    - Agregar campos para contraseña temporal
    - Políticas de seguridad actualizadas
*/

-- Función para generar contraseña temporal
CREATE OR REPLACE FUNCTION generate_temp_password()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Actualizar tabla de invitaciones
ALTER TABLE business_invitations 
ADD COLUMN IF NOT EXISTS temp_password TEXT,
ADD COLUMN IF NOT EXISTS invitation_token TEXT DEFAULT gen_random_uuid()::text;

-- Función para procesar invitación
CREATE OR REPLACE FUNCTION process_business_invitation(
  invitation_token_param TEXT,
  user_email TEXT
)
RETURNS JSON AS $$
DECLARE
  invitation_record business_invitations;
  business_record businesses;
  result JSON;
BEGIN
  -- Buscar invitación válida
  SELECT * INTO invitation_record
  FROM business_invitations
  WHERE invitation_token = invitation_token_param
    AND email = user_email
    AND NOT accepted
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invitación no válida o expirada');
  END IF;

  -- Obtener información del negocio
  SELECT * INTO business_record
  FROM businesses
  WHERE id = invitation_record.business_id;

  -- Marcar invitación como aceptada
  UPDATE business_invitations
  SET accepted = true
  WHERE id = invitation_record.id;

  -- Crear perfil de usuario
  INSERT INTO user_profiles (user_id, business_id, full_name, role)
  VALUES (
    auth.uid(),
    invitation_record.business_id,
    COALESCE((auth.jwt() ->> 'user_metadata')::json ->> 'full_name', user_email),
    invitation_record.role
  );

  RETURN json_build_object(
    'success', true,
    'business_name', business_record.name,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para que los usuarios puedan ver sus propias invitaciones
CREATE POLICY "Users can view their own invitations" ON business_invitations
  FOR SELECT TO authenticated
  USING (email = auth.jwt() ->> 'email');
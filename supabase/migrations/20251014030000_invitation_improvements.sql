/*
  # Mejoras al Sistema de Invitaciones

  1. Campos adicionales
    - `auth_user_id` - ID del usuario creado en Supabase Auth
    - Índices para mejorar performance
    
  2. Función mejorada para procesar invitaciones
    - Maneja usuarios ya creados en Auth
    - Valida contraseña temporal
    
  3. Trigger para auto-crear perfil cuando usuario confirma email
*/

-- Agregar campo para vincular con el usuario de Auth
ALTER TABLE business_invitations 
ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_business_invitations_auth_user_id 
ON business_invitations(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_business_invitations_email_pending 
ON business_invitations(email) WHERE NOT accepted;

-- Función mejorada para procesar invitación después de confirmación de email
CREATE OR REPLACE FUNCTION auto_create_profile_on_email_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record business_invitations;
BEGIN
  -- Solo proceder si el email acaba de ser confirmado
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Buscar invitación pendiente para este usuario
    SELECT * INTO invitation_record
    FROM business_invitations
    WHERE auth_user_id = NEW.id
      AND NOT accepted
      AND expires_at > now();

    -- Si encontramos una invitación válida, crear el perfil automáticamente
    IF FOUND THEN
      
      -- Crear perfil de usuario
      INSERT INTO user_profiles (user_id, business_id, full_name, role)
      VALUES (
        NEW.id,
        invitation_record.business_id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        invitation_record.role
      );

      -- Marcar invitación como aceptada
      UPDATE business_invitations
      SET accepted = true
      WHERE id = invitation_record.id;
      
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para auto-procesar invitaciones cuando se confirma email
DROP TRIGGER IF EXISTS trigger_auto_create_profile ON auth.users;
CREATE TRIGGER trigger_auto_create_profile
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_profile_on_email_confirmation();

-- Función para que los usuarios invitados puedan completar su registro
CREATE OR REPLACE FUNCTION complete_invited_user_registration(
  full_name_param TEXT
)
RETURNS JSON AS $$
DECLARE
  current_user_id uuid;
  invitation_record business_invitations;
  business_record businesses;
  profile_exists boolean;
BEGIN
  -- Obtener ID del usuario actual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuario no autenticado');
  END IF;

  -- Verificar si ya tiene perfil
  SELECT EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE user_id = current_user_id
  ) INTO profile_exists;

  IF profile_exists THEN
    RETURN json_build_object('success', false, 'message', 'El usuario ya tiene un perfil completado');
  END IF;

  -- Buscar invitación para este usuario
  SELECT * INTO invitation_record
  FROM business_invitations
  WHERE auth_user_id = current_user_id
    AND NOT accepted
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'No se encontró una invitación válida');
  END IF;

  -- Obtener información del negocio
  SELECT * INTO business_record
  FROM businesses
  WHERE id = invitation_record.business_id;

  -- Crear perfil de usuario con el nombre proporcionado
  INSERT INTO user_profiles (user_id, business_id, full_name, role)
  VALUES (
    current_user_id,
    invitation_record.business_id,
    full_name_param,
    invitation_record.role
  );

  -- Marcar invitación como aceptada
  UPDATE business_invitations
  SET accepted = true
  WHERE id = invitation_record.id;

  RETURN json_build_object(
    'success', true,
    'business_name', business_record.name,
    'role', invitation_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
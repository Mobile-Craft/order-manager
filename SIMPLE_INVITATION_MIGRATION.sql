/*
  # Sistema de Invitaciones Simplificado - Sin Contraseñas Temporales
  
  Flujo simplificado:
  1. Admin invita usuario por email
  2. Usuario recibe invitación
  3. Usuario se registra normalmente con su propia contraseña
  4. Sistema detecta automáticamente la invitación por email
  5. Usuario completa su perfil y se une al negocio
*/

-- Paso 1: Eliminar políticas que dependen de las funciones
DROP POLICY IF EXISTS "admin can insert members in their business" ON user_profiles;
DROP POLICY IF EXISTS "admin can update members in their business" ON user_profiles;
DROP POLICY IF EXISTS "members can see profiles in their business" ON user_profiles;
DROP POLICY IF EXISTS "members can select their business" ON businesses;

-- Paso 2: Eliminar funciones existentes que causan conflicto
DROP FUNCTION IF EXISTS fn_is_owner_of_business(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS fn_my_business_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS generate_temp_password() CASCADE;

-- Paso 3: Recrear las funciones con los nombres correctos
CREATE OR REPLACE FUNCTION fn_is_owner_of_business(business_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE business_id = business_uuid 
    AND user_id = user_uuid 
    AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener los IDs de negocios del usuario actual
CREATE OR REPLACE FUNCTION fn_my_business_ids(user_uuid uuid)
RETURNS TABLE(business_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT up.business_id
  FROM user_profiles up
  WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 4: Recrear las políticas de user_profiles con las funciones correctas
CREATE POLICY "admin can insert members in their business"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (fn_is_owner_of_business(business_id, auth.uid()));

CREATE POLICY "admin can update members in their business"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (fn_is_owner_of_business(business_id, auth.uid()))
  WITH CHECK (fn_is_owner_of_business(business_id, auth.uid()));

CREATE POLICY "members can see profiles in their business"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (business_id IN (SELECT fn_my_business_ids(auth.uid())));

-- Recrear política de businesses
CREATE POLICY "members can select their business"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    (owner_id = auth.uid()) OR 
    (id IN (SELECT fn_my_business_ids(auth.uid())))
  );

-- Paso 5: Crear tabla business_invitations simplificada (SIN campos de contraseña)
CREATE TABLE IF NOT EXISTS business_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('Cajero', 'Cocina')),
  invited_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'), -- 30 días para registrarse
  auth_user_id uuid, -- Se llena cuando el usuario se registra
  
  -- Constraints
  UNIQUE(business_id, email) -- No permitir invitaciones duplicadas
);

-- Si la tabla ya existe, eliminar campos de contraseña temporal
DO $$ 
BEGIN
  -- Eliminar campo temp_password si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'business_invitations' 
             AND column_name = 'temp_password') THEN
    ALTER TABLE business_invitations DROP COLUMN temp_password;
  END IF;
  
  -- Eliminar campo invitation_token si existe (no lo necesitamos)
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'business_invitations' 
             AND column_name = 'invitation_token') THEN
    ALTER TABLE business_invitations DROP COLUMN invitation_token;
  END IF;
  
  -- Agregar campo auth_user_id si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' 
                 AND column_name = 'auth_user_id') THEN
    ALTER TABLE business_invitations ADD COLUMN auth_user_id uuid;
  END IF;
  
  -- Agregar constraint único si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'business_invitations' 
                 AND constraint_name = 'business_invitations_business_id_email_key') THEN
    ALTER TABLE business_invitations ADD CONSTRAINT business_invitations_business_id_email_key UNIQUE(business_id, email);
  END IF;
END $$;

-- Habilitar RLS en business_invitations
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;

-- Eliminar y recrear políticas de business_invitations
DROP POLICY IF EXISTS "Admins can manage invitations for their business" ON business_invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON business_invitations;

-- Recrear políticas de business_invitations
CREATE POLICY "Admins can manage invitations for their business"
  ON business_invitations
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT user_profiles.business_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'Admin'
    )
  );

CREATE POLICY "Users can view their own invitations" ON business_invitations
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid() OR 
    email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Users can update their own invitations" ON business_invitations
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Paso 6: Función para procesar invitación cuando usuario se registra
CREATE OR REPLACE FUNCTION process_user_invitation_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record business_invitations;
BEGIN
  -- Solo proceder si el email acaba de ser confirmado
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Buscar invitación pendiente para este email
    SELECT * INTO invitation_record
    FROM business_invitations
    WHERE email = NEW.email
      AND NOT accepted
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    -- Si encontramos una invitación válida, vincular el usuario
    IF FOUND THEN
      
      -- Actualizar invitación con el ID del usuario
      UPDATE business_invitations
      SET auth_user_id = NEW.id
      WHERE id = invitation_record.id;
      
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para auto-procesar invitaciones cuando se confirma email
DROP TRIGGER IF EXISTS trigger_process_invitation_on_signup ON auth.users;
CREATE TRIGGER trigger_process_invitation_on_signup
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION process_user_invitation_on_signup();

-- Paso 7: Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_business_invitations_auth_user_id 
ON business_invitations(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_business_invitations_email_pending 
ON business_invitations(email) WHERE NOT accepted;

CREATE INDEX IF NOT EXISTS idx_business_invitations_business_pending 
ON business_invitations(business_id) WHERE NOT accepted;

CREATE INDEX IF NOT EXISTS idx_business_invitations_email_expires
ON business_invitations(email, expires_at) WHERE NOT accepted;

-- Paso 8: Función auxiliar para validar emails
CREATE OR REPLACE FUNCTION is_valid_invitation_email(email_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validación básica de formato de email
  IF email_param !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
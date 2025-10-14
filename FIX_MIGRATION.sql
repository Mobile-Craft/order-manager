/*
  # Fix Migration - Resolver conflictos con CASCADE
  
  Esta migración maneja los conflictos eliminando primero las dependencias,
  luego las funciones, y recreando todo correctamente.
*/

-- Paso 1: Eliminar políticas que dependen de las funciones
DROP POLICY IF EXISTS "admin can insert members in their business" ON user_profiles;
DROP POLICY IF EXISTS "admin can update members in their business" ON user_profiles;
DROP POLICY IF EXISTS "members can see profiles in their business" ON user_profiles;
DROP POLICY IF EXISTS "members can select their business" ON businesses;

-- Paso 2: Eliminar funciones existentes que causan conflicto
DROP FUNCTION IF EXISTS fn_is_owner_of_business(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS fn_my_business_ids(uuid) CASCADE;

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

-- Paso 5: Asegurar que la tabla business_invitations existe con todos los campos
CREATE TABLE IF NOT EXISTS business_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('Cajero', 'Cocina')),
  invited_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  temp_password TEXT,
  invitation_token TEXT DEFAULT gen_random_uuid()::text,
  auth_user_id uuid
);

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
  TO public
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

-- Paso 6: Función para generar contraseñas temporales
CREATE OR REPLACE FUNCTION generate_temp_password()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Paso 7: Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_business_invitations_auth_user_id 
ON business_invitations(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_business_invitations_email_pending 
ON business_invitations(email) WHERE NOT accepted;

CREATE INDEX IF NOT EXISTS idx_business_invitations_business_pending 
ON business_invitations(business_id) WHERE NOT accepted;

-- Paso 8: Agregar campos faltantes si no existen
DO $$ 
BEGIN
  -- Agregar campo auth_user_id si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' 
                 AND column_name = 'auth_user_id') THEN
    ALTER TABLE business_invitations ADD COLUMN auth_user_id uuid;
  END IF;
  
  -- Agregar campo temp_password si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' 
                 AND column_name = 'temp_password') THEN
    ALTER TABLE business_invitations ADD COLUMN temp_password TEXT;
  END IF;
  
  -- Agregar campo invitation_token si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' 
                 AND column_name = 'invitation_token') THEN
    ALTER TABLE business_invitations ADD COLUMN invitation_token TEXT DEFAULT gen_random_uuid()::text;
  END IF;
END $$;
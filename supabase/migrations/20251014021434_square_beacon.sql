/*
  # Sistema de Invitaciones de Usuarios

  1. Nueva tabla para invitaciones
    - `business_invitations` - Invitaciones pendientes por email
    - Campos: email, rol, estado, expiración
    
  2. Seguridad
    - RLS habilitado para todas las tablas
    - Políticas para que solo admins puedan invitar
    - Políticas para que usuarios vean solo su negocio
    
  3. Funciones auxiliares
    - Verificar si usuario es admin de un negocio
    - Obtener IDs de negocios del usuario actual
*/

-- Función para verificar si un usuario es admin de un negocio
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

-- Tabla de invitaciones de negocio
CREATE TABLE IF NOT EXISTS business_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('Cajero', 'Cocina')),
  invited_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Habilitar RLS
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden gestionar invitaciones de su negocio
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

-- Actualizar políticas de user_profiles para permitir que admins gestionen usuarios
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

-- Actualizar políticas de businesses
CREATE POLICY "members can select their business"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    (owner_id = auth.uid()) OR 
    (id IN (SELECT fn_my_business_ids(auth.uid())))
  );
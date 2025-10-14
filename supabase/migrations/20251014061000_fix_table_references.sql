-- Corregir referencias de tablas y permisos

-- Primero verificar que la tabla business_invitations existe
CREATE TABLE IF NOT EXISTS business_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Staff',
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days')
);

-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view business invitations" ON business_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can view own email invitations" ON business_invitations;

-- Recrear funciones con nombres correctos
DROP FUNCTION IF EXISTS fn_is_business_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS user_belongs_to_business(uuid) CASCADE;

-- Función para verificar si un usuario es admin de un negocio
CREATE OR REPLACE FUNCTION fn_is_business_owner(
  business_uuid uuid, 
  user_uuid uuid
)
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

-- Función para verificar si el usuario actual pertenece a un negocio
CREATE OR REPLACE FUNCTION user_belongs_to_business(business_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE business_id = business_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas más permisivas para testing
-- Permitir que usuarios autenticados lean invitaciones por email
CREATE POLICY "Users can view invitations by email" ON business_invitations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
      user_belongs_to_business(business_id)
    )
  );

-- Permitir que admins creen invitaciones
CREATE POLICY "Admins can create invitations" ON business_invitations
  FOR INSERT WITH CHECK (
    fn_is_business_owner(business_id, auth.uid())
  );

-- Permitir actualizar invitaciones propias o de negocio propio
CREATE POLICY "Update own or business invitations" ON business_invitations
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    user_belongs_to_business(business_id)
  );

-- Habilitar RLS
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;

-- Asegurar que no tengamos columnas problemáticas
ALTER TABLE business_invitations 
DROP COLUMN IF EXISTS temp_password,
DROP COLUMN IF EXISTS invitation_token,
DROP COLUMN IF EXISTS accepted;
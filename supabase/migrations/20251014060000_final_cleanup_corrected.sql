-- Limpieza final: eliminar todo lo relacionado con contraseñas temporales
DROP FUNCTION IF EXISTS fn_is_owner_of_business(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_business_ids() CASCADE;
DROP FUNCTION IF EXISTS complete_invited_user_registration(text, text, text) CASCADE;

-- Recrear función de verificación de propietario con nombres únicos
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

-- Eliminar columnas de contraseña temporal de business_invitations si existen
ALTER TABLE business_invitations 
DROP COLUMN IF EXISTS temp_password,
DROP COLUMN IF EXISTS invitation_token;

-- Asegurar que business_invitations tenga las columnas correctas
DO $$
BEGIN
  -- Agregar columnas si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'email') THEN
    ALTER TABLE business_invitations ADD COLUMN email text NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'business_id') THEN
    ALTER TABLE business_invitations ADD COLUMN business_id uuid REFERENCES business(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'role') THEN
    ALTER TABLE business_invitations ADD COLUMN role text NOT NULL DEFAULT 'Staff';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'status') THEN
    ALTER TABLE business_invitations ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'invited_by') THEN
    ALTER TABLE business_invitations ADD COLUMN invited_by uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'created_at') THEN
    ALTER TABLE business_invitations ADD COLUMN created_at timestamp with time zone DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'expires_at') THEN
    ALTER TABLE business_invitations ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '7 days');
  END IF;
END$$;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view invitations for their businesses" ON business_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can view business invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can view own email invitations" ON business_invitations;

-- Política para que usuarios vean invitaciones de sus negocios
CREATE POLICY "Users can view business invitations" ON business_invitations
  FOR SELECT USING (
    user_belongs_to_business(business_id)
  );

-- Política para que admins puedan crear invitaciones
CREATE POLICY "Admins can create invitations" ON business_invitations
  FOR INSERT WITH CHECK (
    fn_is_business_owner(business_id, auth.uid())
  );

-- Política para que usuarios puedan ver invitaciones dirigidas a su email
CREATE POLICY "Users can view own email invitations" ON business_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Habilitar RLS
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;
-- Arreglar completamente las políticas RLS para business_invitations

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view invitations by email" ON business_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON business_invitations;
DROP POLICY IF EXISTS "Update own or business invitations" ON business_invitations;

-- Crear políticas más específicas y funcionales

-- 1. Política para que usuarios autenticados puedan leer invitaciones dirigidas a su email
CREATE POLICY "Users can read their own email invitations" ON business_invitations
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 2. Política para que usuarios puedan leer invitaciones de negocios donde participan
CREATE POLICY "Business members can read business invitations" ON business_invitations
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    business_id IN (
      SELECT business_id 
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Política para que admins puedan crear invitaciones para su negocio
CREATE POLICY "Business admins can create invitations" ON business_invitations
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND business_id = business_invitations.business_id 
      AND role = 'Admin'
    )
  );

-- 4. Política para actualizar estado de invitaciones (para marcar como completadas)
CREATE POLICY "Users can update invitation status" ON business_invitations
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND (
      -- El usuario invitado puede actualizar su propia invitación
      email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
      -- O un admin del negocio puede actualizarla
      EXISTS (
        SELECT 1 
        FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND business_id = business_invitations.business_id 
        AND role = 'Admin'
      )
    )
  );

-- Asegurar que RLS esté habilitado
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;

-- Verificar que la tabla tenga la estructura correcta
ALTER TABLE business_invitations 
DROP COLUMN IF EXISTS temp_password,
DROP COLUMN IF EXISTS invitation_token,
DROP COLUMN IF EXISTS accepted;

-- Asegurar que todas las columnas necesarias existan
DO $$
BEGIN
  -- Verificar y agregar columnas si no existen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'id') THEN
    ALTER TABLE business_invitations ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'email') THEN
    ALTER TABLE business_invitations ADD COLUMN email text NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_invitations' AND column_name = 'business_id') THEN
    ALTER TABLE business_invitations ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE CASCADE;
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
-- Política temporal muy permisiva para debug
-- SOLO PARA DESARROLLO - REMOVER EN PRODUCCIÓN

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can read their own email invitations" ON business_invitations;
DROP POLICY IF EXISTS "Business members can read business invitations" ON business_invitations;
DROP POLICY IF EXISTS "Business admins can create invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can update invitation status" ON business_invitations;

-- Política temporal muy permisiva para DEBUG
CREATE POLICY "Debug - Allow all reads for authenticated users" ON business_invitations
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Debug - Allow all inserts for authenticated users" ON business_invitations
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Debug - Allow all updates for authenticated users" ON business_invitations
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Asegurar que RLS esté habilitado
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;
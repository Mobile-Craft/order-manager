-- Eliminar todas las políticas RLS problemáticas y crear unas simples

-- Eliminar todas las políticas existentes de business_invitations
DROP POLICY IF EXISTS "Debug - Allow all reads for authenticated users" ON business_invitations;
DROP POLICY IF EXISTS "Debug - Allow all inserts for authenticated users" ON business_invitations;
DROP POLICY IF EXISTS "Debug - Allow all updates for authenticated users" ON business_invitations;
DROP POLICY IF EXISTS "Users can view invitations by email" ON business_invitations;
DROP POLICY IF EXISTS "Business members can read business invitations" ON business_invitations;
DROP POLICY IF EXISTS "Business admins can create invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can update invitation status" ON business_invitations;
DROP POLICY IF EXISTS "Users can read their own email invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can view business invitations" ON business_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON business_invitations;
DROP POLICY IF EXISTS "Users can view own email invitations" ON business_invitations;
DROP POLICY IF EXISTS "Update own or business invitations" ON business_invitations;

-- Crear políticas muy simples sin operadores JSON problemáticos
CREATE POLICY "Allow authenticated users to select invitations" ON business_invitations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert invitations" ON business_invitations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update invitations" ON business_invitations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete invitations" ON business_invitations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Asegurar que RLS esté habilitado
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;
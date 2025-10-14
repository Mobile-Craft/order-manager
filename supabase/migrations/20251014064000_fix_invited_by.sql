-- Hacer el campo invited_by opcional para evitar problemas de foreign key

-- Modificar la columna para que sea nullable
ALTER TABLE business_invitations 
ALTER COLUMN invited_by DROP NOT NULL;

-- También podemos agregar un trigger para llenar automáticamente el invited_by
-- con el usuario actual cuando se inserta una invitación
CREATE OR REPLACE FUNCTION set_invited_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Si invited_by no se especifica, usar el usuario actual
  IF NEW.invited_by IS NULL THEN
    NEW.invited_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_set_invited_by ON business_invitations;
CREATE TRIGGER trigger_set_invited_by
  BEFORE INSERT ON business_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invited_by();
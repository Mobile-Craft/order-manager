-- Eliminar la foreign key constraint problemática de invited_by

-- Primero, eliminar la constraint foreign key
ALTER TABLE business_invitations 
DROP CONSTRAINT IF EXISTS business_invitations_invited_by_fkey;

-- Mantener la columna pero sin la constraint
-- Esto permite que invited_by sea cualquier UUID sin verificar que exista en otra tabla

-- El trigger seguirá funcionando para llenar el campo automáticamente
-- pero no habrá restricciones de foreign key que causen errores
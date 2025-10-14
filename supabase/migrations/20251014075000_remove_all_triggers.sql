-- Eliminar todos los triggers y funciones problemáticas que causan el error JSON

-- Eliminar el trigger
DROP TRIGGER IF EXISTS trigger_send_invitation_notification ON business_invitations;

-- Eliminar la función
DROP FUNCTION IF EXISTS send_invitation_notification();

-- Eliminar la tabla email_queue que tiene políticas RLS problemáticas
DROP TABLE IF EXISTS email_queue;

-- Asegurar que no hay otros triggers en business_invitations
DROP TRIGGER IF EXISTS update_business_invitations_updated_at ON business_invitations;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Mensaje de confirmación
SELECT 'Triggers y funciones problemáticas eliminadas' as status;
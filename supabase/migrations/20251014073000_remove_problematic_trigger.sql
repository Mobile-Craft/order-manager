-- Eliminar completamente el trigger problemático y simplificar
-- El error viene del trigger que referencia tablas que pueden no existir

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_send_invitation_notification ON business_invitations;
DROP FUNCTION IF EXISTS send_invitation_notification() CASCADE;
DROP FUNCTION IF EXISTS send_invitation_notification_simple() CASCADE;

-- Eliminar tabla email_queue si existe
DROP TABLE IF EXISTS email_queue CASCADE;

-- El sistema funcionará sin triggers por ahora
-- El envío de correo se hace directamente desde la aplicación usando signInWithOtp

-- Función simple para logging (opcional)
CREATE OR REPLACE FUNCTION log_invitation_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo hacer log, sin envío de correo automático
  RAISE NOTICE 'Nueva invitación creada: % para %', NEW.id, NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger simple para logging
CREATE TRIGGER trigger_log_invitation
  AFTER INSERT ON business_invitations
  FOR EACH ROW
  EXECUTE FUNCTION log_invitation_created();
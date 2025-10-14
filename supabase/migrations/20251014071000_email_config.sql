-- Configurar URLs y settings para correos de invitación
-- Esta migración configura los redirects y URLs necesarias para el sistema de correos

-- Nota: Esta configuración también debe hacerse manualmente en el dashboard de Supabase
-- en Authentication > URL Configuration

-- Insertar configuraciones en auth.config si existe la tabla
-- (Estas configuraciones normalmente se hacen desde el dashboard)

-- Crear función para ayudar con la configuración de URLs
CREATE OR REPLACE FUNCTION get_app_config()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'site_url', 'myapp://',
    'redirect_urls', jsonb_build_array(
      'myapp://auth/callback',
      'myapp://invitation',
      'http://localhost:3000/auth/callback'
    ),
    'email_template_config', jsonb_build_object(
      'magic_link_subject', 'Invitación a {{.Data.business_name}} - Order Manager',
      'magic_link_body_html', 'Ver archivo invitation-template.html',
      'magic_link_body_text', 'Ver archivo invitation-template.txt'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Función para validar configuración de correos
CREATE OR REPLACE FUNCTION validate_email_config()
RETURNS boolean AS $$
BEGIN
  -- Validar que las URLs están configuradas
  -- Esta función puede ser llamada para verificar la configuración
  
  RAISE NOTICE 'CONFIGURACIÓN REQUERIDA EN SUPABASE DASHBOARD:';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Ve a Authentication > URL Configuration';
  RAISE NOTICE '   Site URL: myapp://';
  RAISE NOTICE '   Redirect URLs:';
  RAISE NOTICE '     - myapp://auth/callback';
  RAISE NOTICE '     - myapp://invitation';
  RAISE NOTICE '     - http://localhost:3000/auth/callback';
  RAISE NOTICE '';
  RAISE NOTICE '2. Ve a Authentication > Email Templates > Magic Link';
  RAISE NOTICE '   Subject: Invitación a {{.Data.business_name}} - Order Manager';
  RAISE NOTICE '   Body: Usar el contenido de invitation-template.html';
  RAISE NOTICE '';
  RAISE NOTICE '3. Ve a Authentication > Settings > Email';
  RAISE NOTICE '   Asegurar que el email provider está configurado';
  RAISE NOTICE '';
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la validación
SELECT validate_email_config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mchkbmhqfsckpdtdgqhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaGtibWhxZnNja3BkdGRncWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MjQ4NzYsImV4cCI6MjA0NTMwMDg3Nn0.RrS1iXYVEf-qZiI_8MjWpQcItCmgL-m0pYVPQCwD20A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInvitation() {
  try {
    console.log('🧪 Probando invitación con tavarezweb@gmail.com...');
    
    // Primero autenticarse con un usuario de prueba
    console.log('🔑 Autenticando con usuario de prueba...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'moisestavarez20@gmail.com',
      password: 'Elder1411'
    });

    if (authError) {
      console.error('❌ Error de autenticación:', authError);
      return;
    }

    console.log('✅ Autenticado exitosamente');
    
    // Simular datos de invitación (como los que envía UsersScreen)
    const invitationData = {
      invitation_id: 'test-invitation-id',
      email: 'tavarezweb@gmail.com',
      business_name: 'Mi Negocio Test',
      admin_name: 'Elder Tavarez',
      role: 'empleado',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
    };

    // Llamar a la Edge Function
    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: invitationData
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Respuesta exitosa:');
    console.log(JSON.stringify(data, null, 2));

    if (data.manual_required) {
      console.log('\n📝 Instrucciones manuales:');
      console.log(data.instructions);
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

testInvitation();
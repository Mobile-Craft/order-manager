import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 Enviando email REAL con signInWithOtp')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { invitation_id, email, role, business_name, admin_name, expires_at } = await req.json()
    
    console.log('📧 Procesando invitación para:', email)
    console.log('📧 Business:', business_name)
    console.log('📧 Role:', role)

    // Estrategia correcta: inviteUserByEmail (usa template de invitación)
    try {
      console.log('📧 Enviando invitación de usuario a:', email)
      
      // Usar inviteUserByEmail que SÍ usa el template "Invite user"
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          invitation_type: 'business_invitation',
          business_name: business_name,
          role: role,
          invited_by: admin_name,
          invitation_id: invitation_id,
          expires_at: expires_at,
          is_business_invitation: true
        },
        redirectTo: 'myapp://auth/callback'
      })

      if (inviteError) {
        console.warn('⚠️ Error enviando invitación:', inviteError.message)
        throw inviteError
      }

      console.log('✅ Invitación enviada exitosamente con inviteUserByEmail')
      console.log('📨 Invite data:', inviteData)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email de invitación enviado exitosamente a ' + email,
          service: 'supabase_invite_user',
          email_sent_to: email,
          method: 'inviteUserByEmail',
          note: 'Email enviado usando template de invitación',
          user_id: inviteData?.user?.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
        
    } catch (inviteError) {
      console.warn('⚠️ Error con inviteUserByEmail:', inviteError)
    }

    // Fallback manual si todo falla
    const expirationDate = new Date(expires_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        manual_required: true,
        message: 'Invitación creada - email automático no disponible',
        email_sent_to: email,
        service: 'manual',
        instructions: `🎉 INVITACIÓN A ${business_name.toUpperCase()}

${admin_name} te ha invitado como ${role}.

📱 PASOS PARA UNIRTE:
1. Descarga "Expo Go" desde App Store o Google Play
2. Abre Expo Go y busca "Order Manager"  
3. Toca "Crear Cuenta"
4. Usa este email: ${email}
5. Verifica tu email con el código OTP
6. Completa tu perfil

✨ El sistema detectará automáticamente tu invitación.
⏰ Expira: ${expirationDate}

¡Esperamos verte pronto! 🚀`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error general:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

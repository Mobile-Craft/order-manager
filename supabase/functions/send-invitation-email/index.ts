import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationRequest {
  invitation_id: string
  email: string
  role: string
  business_name: string
  admin_name: string
  expires_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase para usar el sistema de auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { invitation_id, email, role, business_name, admin_name, expires_at }: InvitationRequest = await req.json()

    // Formatear fecha de expiración
    const expirationDate = new Date(expires_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Usar Supabase Auth para enviar correo personalizado
    // Esto usará los templates configurados en Supabase
    const { error } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: {
          invitation_type: 'business_invitation',
          business_name: business_name,
          role: role,
          invited_by: admin_name,
          invitation_id: invitation_id,
          expires_at: expires_at,
          instructions: `Has sido invitado a unirte a ${business_name} como ${role}. Para completar tu registro:

1. Descarga la aplicación Order Manager
2. Crear cuenta con este email: ${email}
3. Verifica tu email con el código OTP
4. Completa tu perfil

Esta invitación expira el ${expirationDate}.

¡Esperamos verte pronto en el equipo!`
        }
      }
    })

    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully using Supabase Auth'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
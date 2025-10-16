import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // NO USAR supabase.auth.admin.generateLink porque crea usuarios automáticamente
    // En su lugar, verificar si hay servicio de email externo configurado
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      // Sin servicio de email configurado, retornar error para usar flujo manual
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured - use manual invitation flow',
          manual_instructions: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503 // Service Unavailable
        }
      )
    }

    // Crear email HTML para envío externo
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Invitación a ${business_name}</h2>
        <p>Hola,</p>
        <p><strong>${admin_name}</strong> te ha invitado a unirte a <strong>${business_name}</strong> como <strong>${role}</strong>.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📱 Instrucciones para unirte:</h3>
          <ol>
            <li>Descarga "Expo Go" desde App Store o Google Play</li>
            <li>Abre Expo Go y busca "Order Manager"</li>
            <li>Toca "Crear Cuenta"</li>
            <li>Usa este email: <strong>${email}</strong></li>
            <li>Verifica tu email con el código OTP</li>
            <li>Completa tu perfil</li>
          </ol>
        </div>
        
        <p>✨ El sistema detectará automáticamente tu invitación cuando uses este email para registrarte.</p>
        <p>⏰ Esta invitación expira el <strong>${expirationDate}</strong>.</p>
        <p>¡Esperamos verte pronto en el equipo! 🚀</p>
        
        <hr>
        <p><small>ID de invitación: ${invitation_id}</small></p>
      </div>
    `

    // Enviar email usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Order Manager <noreply@yourdomain.com>',
        to: [email],
        subject: `🎉 Invitación a ${business_name} - Rol: ${role}`,
        html: emailHtml,
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${emailResult.message || 'Unknown error'}`)
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
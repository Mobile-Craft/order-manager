import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationData {
  business_name?: string;
  role?: string;
  invited_by_name?: string;
  email?: string;
}

serve(async (req: Request) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const userAgent = req.headers.get('user-agent') || ''
    
    // Obtener parámetros de la URL
    const token = url.searchParams.get('token')
    const email = url.searchParams.get('email')
    const type = url.searchParams.get('type')
    
    console.log('Received params:', { token, email, type })
    
    // URLs de las tiendas para Expo Go
    const IOS_URL = 'https://apps.apple.com/do/app/expo-go/id982107779'
    const ANDROID_URL = 'https://play.google.com/store/apps/details?id=host.exp.exponent&pcampaignid=web_share'
    
    // Deep link para abrir tu app en Expo Go directamente
    const EXPO_DEEP_LINK = 'exp://10.0.0.98:8081' // Tu proyecto Order Manager en desarrollo
    
    // Detectar plataforma
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/.test(userAgent)
    const isMobile = isIOS || isAndroid
    
    // Datos por defecto de la invitación
    let invitationData: InvitationData = {
      business_name: 'Order Manager',
      role: 'Empleado',
      invited_by_name: 'Administrador',
      email: email || 'usuario@ejemplo.com'
    }
    
    // Si tenemos un email, intentar obtener datos reales de la invitación
    if (email) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        const { data: invitation, error } = await supabase
          .from('business_invitations')
          .select(`
            email,
            role,
            business_id,
            businesses!inner(name),
            user_profiles!business_invitations_invited_by_fkey(full_name)
          `)
          .eq('email', email)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (invitation && !error) {
          invitationData = {
            business_name: invitation.businesses?.name || 'Order Manager',
            role: invitation.role,
            invited_by_name: invitation.user_profiles?.full_name || 'Administrador',
            email: invitation.email
          }
          console.log('Found invitation data:', invitationData)
        } else {
          console.log('No invitation found or error:', error)
        }
      } catch (error) {
        console.log('Error fetching invitation data:', error)
      }
    }

    // HTML response con lógica inteligente
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a ${invitationData.business_name || 'Order Manager'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #00AEEF 0%, #007FB3 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: white;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            color: #1f2937;
        }
        
        .logo {
            font-size: 64px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
            font-size: 16px;
        }
        
        .invitation-info {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #00AEEF;
        }
        
        .business-name {
            font-size: 18px;
            font-weight: 600;
            color: #00AEEF;
            margin-bottom: 5px;
        }
        
        .role {
            background: #00AEEF;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        
        .status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            font-weight: 500;
        }
        
        .status.loading {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #3b82f6;
        }
        
        .status.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #10b981;
        }
        
        .status.redirect {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #f59e0b;
        }
        
        .btn {
            display: inline-block;
            background: #00AEEF;
            color: white;
            padding: 15px 30px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        
        .btn:hover {
            background: #0090CC;
            transform: translateY(-2px);
        }
        
        .progress {
            width: 100%;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            margin: 20px 0;
            overflow: hidden;
        }
        
        .progress-bar {
            height: 100%;
            background: #00AEEF;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .instructions {
            text-align: left;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .instructions ol {
            margin-left: 20px;
        }
        
        .instructions li {
            margin: 8px 0;
        }
        
        .email-highlight {
            background: #00AEEF;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📱</div>
        <h1>Order Manager</h1>
        <div class="subtitle">Accede via Expo Go</div>
        
        ${invitationData.business_name ? `
        <div class="invitation-info">
            <div class="business-name">${invitationData.business_name}</div>
            <div class="role">${invitationData.role || 'Empleado'}</div>
            <div style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                Invitado por: <strong>${invitationData.invited_by_name || 'Administrador'}</strong>
            </div>
        </div>
        ` : ''}
        
        <div id="status" class="status loading">
            🔄 Detectando dispositivo...
        </div>
        
        <div class="progress">
            <div id="progress-bar" class="progress-bar"></div>
        </div>
        
        <div id="buttons" style="display: none;">
            <button onclick="openApp()" class="btn">
                � Abrir en Expo Go
            </button>
            <button onclick="goToStore()" class="btn">
                � Descargar Expo Go
            </button>
        </div>
        
        ${invitationData.email ? `
        <div class="instructions">
            <strong>📋 Para acceder a Order Manager:</strong>
            <ol>
                <li><strong>Descarga Expo Go</strong> (si no lo tienes)</li>
                <li><strong>Abre Expo Go</strong> desde esta página</li>
                <li><strong>Busca "Order Manager"</strong> en tus proyectos recientes</li>
                <li><strong>Toca "Crear Cuenta"</strong> en la app</li>
                <li><strong>Usa este email:</strong> <span class="email-highlight">${invitationData.email}</span></li>
                <li><strong>El sistema detectará tu invitación automáticamente</strong></li>
            </ol>
        </div>
        ` : ''}
    </div>

    <script>
        const isIOS = ${isIOS};
        const isAndroid = ${isAndroid};
        const isMobile = ${isMobile};
        
        const IOS_URL = '${IOS_URL}';
        const ANDROID_URL = '${ANDROID_URL}';
        const EXPO_DEEP_LINK = '${EXPO_DEEP_LINK}';
        
        let progress = 0;
        const statusEl = document.getElementById('status');
        const progressBar = document.getElementById('progress-bar');
        const buttonsEl = document.getElementById('buttons');
        
        function updateProgress(percent, message) {
            progress = percent;
            progressBar.style.width = percent + '%';
            statusEl.innerHTML = message;
        }
        
        function openApp() {
            statusEl.className = 'status loading';
            updateProgress(50, '🚀 Abriendo Expo Go...');
            
            // Crear iframe invisible para intentar abrir Expo Go
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = EXPO_DEEP_LINK;
            document.body.appendChild(iframe);
            
            // Timer para detectar si Expo Go no se abrió
            const timeout = setTimeout(() => {
                document.body.removeChild(iframe);
                statusEl.className = 'status redirect';
                updateProgress(100, '📱 Redirigiendo a la tienda para descargar Expo Go...');
                setTimeout(goToStore, 1500);
            }, 3000);
            
            // Si Expo Go se abre, la página se pondrá en background
            window.addEventListener('blur', () => {
                clearTimeout(timeout);
                statusEl.className = 'status success';
                updateProgress(100, '✅ ¡Expo Go abierto! Buscando Order Manager...');
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            });
        }
        
        function goToStore() {
            const storeUrl = isIOS ? IOS_URL : ANDROID_URL;
            window.open(storeUrl, '_blank');
        }
        
        function autoFlow() {
            updateProgress(25, '📱 Dispositivo detectado...');
            
            setTimeout(() => {
                if (isMobile) {
                    updateProgress(50, '🔄 Configurando redirección...');
                    setTimeout(() => {
                        if (isIOS) {
                            updateProgress(75, '🍎 Dispositivo iOS detectado');
                        } else {
                            updateProgress(75, '🤖 Dispositivo Android detectado');
                        }
                        
                        setTimeout(() => {
                            updateProgress(100, '✅ Listo para continuar');
                            statusEl.className = 'status success';
                            buttonsEl.style.display = 'block';
                            
                            // Auto-intentar abrir la app después de 2 segundos
                            setTimeout(openApp, 2000);
                        }, 500);
                    }, 1000);
                } else {
                    updateProgress(100, '💻 Dispositivo de escritorio - Elige una opción');
                    statusEl.className = 'status redirect';
                    buttonsEl.style.display = 'block';
                }
            }, 1000);
        }
        
        // Iniciar el flujo automático
        autoFlow();
    </script>
</body>
</html>
    `

    return new Response(html, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html; charset=utf-8' 
      },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
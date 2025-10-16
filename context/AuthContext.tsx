// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/Auth';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  hasInvitation: boolean | null; // null = aún no verificado, true/false = verificado

  // Registro con email+password (envía OTP)
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;

  // Verificar OTP de signup (ACTUALIZA sesión)
  verifySignUpCode: (email: string, code: string) => Promise<void>;

  // Login normal (después del registro)
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Reset de contraseña - validando propiedad del email
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<void>;

  // Completar perfil/empresa (requiere sesión ya activa por OTP)
  completeRegistration: (fullName: string, businessName: string) => Promise<void>;

  // Completar registro de usuario invitado
  completeInvitedUserRegistration: (fullName: string) => Promise<void>;

  // Reenviar OTP de signup
  resendConfirmation: (email: string) => Promise<void>;

  // Verificar si el usuario es un invitado pendiente
  isInvitedUser: () => boolean;

  // Legacy
  login: (role: string, name: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInvitation, setHasInvitation] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setHasInvitation(null);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`*, businesses (*)`)
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.log('👤 No profile found for user, checking for invitations...');
        
        // Verificar si hay una invitación pendiente para este usuario
        const { data: invitation, error: invitationError } = await supabase
          .from('business_invitations')
          .select('email, status, expires_at, business_id, role')
          .eq('email', authUser.email?.toLowerCase())
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        console.log('🔍 Checking invitation in loadUserProfile:', { invitation, invitationError });

        if (invitation && invitation.length > 0 && !invitationError) {
          console.log('🎉 Found pending invitation, user needs to complete profile');
          setHasInvitation(true);
        } else {
          console.log('ℹ️ No pending invitation found, user needs to create business or be invited');
          setHasInvitation(false);
        }

        // Es normal que NO exista aún hasta completar empresa
        setUser({
          id: authUser.id,
          email: authUser.email!,
          profile: null as any,
          business: null as any,
        });
        setLoading(false);
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email!,
        profile: data,
        business: data?.businesses,
      });
      setHasInvitation(null); // Ya tiene perfil, resetear estado de invitación
    } catch (e) {
      console.error('Error in loadUserProfile:', e);
    } finally {
      setLoading(false);
    }
  };

  // Registro: crea user + manda OTP. Normalmente session === null (needsConfirmation = true)
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password, // ← pides password en el registro
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  };

  // VERIFICAR OTP DE SIGNUP: aquí se crea/activa la sesión
  const verifySignUpCode = async (email: string, code: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup', // ← IMPORTANTE para flujos email+password
    });
    if (error) throw error;
    // data.session ahora debe existir; onAuthStateChange disparará loadUserProfile()
  };

  // Login normal (ya con password)
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Reset de contraseña: Paso 1 - Solicitar reset por email
  const requestPasswordReset = async (email: string) => {
    // Primero verificamos que el email existe en nuestra base de datos
    const { data: existingUser, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', 
        supabase.from('auth.users').select('id').eq('email', email.toLowerCase())
      )
      .single();

    // Si no hay error en la consulta, significa que el usuario existe
    // Ahora enviamos el email de reset
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: undefined, // No usamos redirect, manejamos todo con OTP
    });
    
    if (error) {
      // Si el error es que el usuario no existe, damos un mensaje genérico por seguridad
      if (error.message.includes('User not found')) {
        throw new Error('Si este correo está registrado, recibirás un código de verificación.');
      }
      throw error;
    }
  };

  // Reset de contraseña: Paso 2 - Verificar código OTP
  const verifyPasswordResetCode = async (email: string, code: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token: code,
      type: 'recovery', // Tipo específico para recuperación de contraseña
    });
    
    if (error) throw error;
    // La sesión se establece automáticamente después de verificar el OTP
    return data;
  };

  // Reset de contraseña: Paso 3 - Actualizar contraseña
  const updatePassword = async (newPassword: string) => {
    // Validamos que la contraseña sea segura
    if (newPassword.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  };

  
const completeRegistration = async (fullName: string, businessName: string) => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('No authenticated user');

  // Crear negocio con el usuario actual como dueño
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert([{ 
      name: businessName,
      owner_id: authUser.id, // 👈 lo agregamos aquí
    }])
    .select()
    .single();

  if (businessError) throw businessError;

  // Crear perfil vinculado al negocio y usuario
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert([{
      user_id: authUser.id,
      business_id: business.id,
      full_name: fullName,
      role: 'Admin',
    }]);

  if (profileError) throw profileError;

  await loadUserProfile(authUser);
};


  // Completar registro de usuario invitado
  const completeInvitedUserRegistration = async (fullName: string) => {
    try {
      const currentUser = await supabase.auth.getUser();
      
      if (!currentUser.data.user?.email) {
        throw new Error('Usuario no autenticado');
      }

      const userEmail = currentUser.data.user.email.toLowerCase();
      console.log('🔍 Buscando invitación para:', userEmail);

      const { data: invitations, error: invitationError } = await supabase
        .from('business_invitations')
        .select('id, email, business_id, role, status, expires_at')
        .eq('email', userEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      console.log('📋 Resultado de búsqueda de invitación:', { invitations, invitationError });

      const invitation = invitations?.[0]; // Tomar la primera invitación válida

      if (invitationError || !invitation) {
        console.log('❌ Invitation error:', invitationError);
        console.log('🔍 Looking for email:', userEmail);
        
        // Intentar obtener todas las invitaciones para debug (sin filtros complicados)
        const { data: allInvitations, error: allError } = await supabase
          .from('business_invitations')
          .select('email, status, expires_at, created_at')
          .eq('email', userEmail);
        
        console.log('📊 All invitations for this email:', allInvitations);
        console.log('📊 All invitations error:', allError);
        
        // También verificar todas las invitaciones (primeros 5 para debug)
        const { data: sampleInvitations } = await supabase
          .from('business_invitations')
          .select('email, status, expires_at')
          .limit(5);
        
        console.log('📊 Sample invitations in database:', sampleInvitations);
        
        throw new Error('No se encontró una invitación válida para este usuario. Asegúrate de haber sido invitado por un administrador.');
      }

      // Crear perfil de usuario
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: currentUser.data.user.id,
          business_id: invitation.business_id,
          full_name: fullName.trim(),
          role: invitation.role,
        }]);

      if (profileError) throw profileError;

      // Marcar invitación como completada
      const { error: updateError } = await supabase
        .from('business_invitations')
        .update({ status: 'completed' })
        .eq('id', invitation.id);

      if (updateError) console.warn('Warning updating invitation:', updateError);

      // Recargar el perfil del usuario
      await loadUserProfile(currentUser.data.user);
      
    } catch (error: any) {
      console.error('Error in completeInvitedUserRegistration:', error);
      throw error;
    }
  };

  // Verificar si el usuario es un invitado pendiente
  const isInvitedUser = (): boolean => {
    // Ahora usamos el estado hasInvitation que se establece en loadUserProfile
    return Boolean(user?.id && !user?.profile && hasInvitation === true);
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup', // ← Reenvía OTP de SIGNUP
      email,
    });
    if (error) throw error;
  };

  // Legacy
  const login = () => console.warn('Legacy login method called');
  const logout = async () => { await signOut(); };
  const isAdmin = user?.profile?.role === 'Admin';

  return (
    <AuthContext.Provider value={{
      user, loading, hasInvitation,
      signUp,
      verifySignUpCode,
      signIn, signOut,
      requestPasswordReset,
      verifyPasswordResetCode,
      updatePassword,
      completeRegistration,
      completeInvitedUserRegistration,
      resendConfirmation,
      isInvitedUser,
      login, logout,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

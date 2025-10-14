// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/Auth';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;

  // Registro con email+password (envía OTP)
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;

  // Verificar OTP de signup (ACTUALIZA sesión)
  verifySignUpCode: (email: string, code: string) => Promise<void>;

  // Login normal (después del registro)
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Completar perfil/empresa (requiere sesión ya activa por OTP)
  completeRegistration: (fullName: string, businessName: string) => Promise<void>;

  // Reenviar OTP de signup
  resendConfirmation: (email: string) => Promise<void>;

  // Legacy
  login: (role: string, name: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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
      user, loading,
      signUp,
      verifySignUpCode,
      signIn, signOut,
      completeRegistration,
      resendConfirmation,
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

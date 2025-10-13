import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserProfile, Business } from '@/types/Auth';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeRegistration: (fullName: string, businessName: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  // Legacy methods for backward compatibility
  login: (role: string, name: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
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
        .select(`
          *,
          businesses (*)
        `)
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          profile: data,
          business: data.businesses,
        });
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return { needsConfirmation: !data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const completeRegistration = async (fullName: string, businessName: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No authenticated user');

    // Create business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert([{ name: businessName }])
      .select()
      .single();

    if (businessError) throw businessError;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: authUser.id,
        business_id: business.id,
        full_name: fullName,
        role: 'Admin'
      }]);

    if (profileError) throw profileError;

    // Reload user profile
    await loadUserProfile(authUser);
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;
  };

  // Legacy methods for backward compatibility
  const login = (role: string, name: string) => {
    // This is kept for backward compatibility but won't be used in the new flow
    console.warn('Legacy login method called');
  };

  const logout = async () => {
    await signOut();
  };

  const isAdmin = user?.profile?.role === 'Admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      completeRegistration,
      resendConfirmation,
      login,
      logout,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
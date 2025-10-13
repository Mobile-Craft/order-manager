import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test connection with better error handling
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id')
      .limit(1);
    
    if (error) {
      console.warn('Supabase connection test failed:', error.message);
      console.warn('This is expected if menu_items table does not exist yet');
    } else {
      console.log('Supabase connected successfully');
    }
  } catch (err) {
    console.warn('Supabase connection test error:', err);
    console.warn('This is expected during initial setup');
  }
};

// Run test connection without blocking app initialization
setTimeout(testConnection, 1000);
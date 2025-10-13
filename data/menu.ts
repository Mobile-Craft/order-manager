import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/types/Order';
import { useAuth } from '@/context/AuthContext';

export async function fetchMenu(businessId?: string): Promise<MenuItem[]> {
  if (!businessId) {
    console.warn('No business ID provided for menu fetch');
    return [];
  }

  console.log('Fetching menu from Supabase...');
  
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('business_id', businessId)
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching menu:', error);
    throw new Error(`Error fetching menu: ${error.message}`);
  }

  console.log('Menu data received:', data);
  return data as MenuItem[];
}
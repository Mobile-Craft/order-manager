import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/types/Order';

export async function fetchMenu(): Promise<MenuItem[]> {
  console.log('Fetching menu from Supabase...');
  
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching menu:', error);
    throw new Error(`Error fetching menu: ${error.message}`);
  }

  console.log('Menu data received:', data);
  return data as MenuItem[];
}
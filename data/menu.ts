import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/types/Order';

export async function fetchMenu(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching menu:', error);
    return [];
  }

  return data as MenuItem[];
}
// import { MenuItem } from '@/types/Order';

// export const MENU_ITEMS: MenuItem[] = [
//   // Burgers
//   { id: 'b1', name: 'Burger Clásica', price: 325, category: 'Burgers' },
//   { id: 'b2', name: 'Dulce Cabra', price: 525, category: 'Burgers' },
//   { id: 'b3', name: 'BBQ Burger', price: 450, category: 'Burgers' },
//   { id: 'b4', name: 'Doble Carne', price: 650, category: 'Burgers' },
//   { id: 'b5', name: 'Veggie Burger', price: 375, category: 'Burgers' },

//   // Papas
//   { id: 'p1', name: 'Papas Simples', price: 150, category: 'Papas' },
//   { id: 'p2', name: 'Papas con Cheddar', price: 200, category: 'Papas' },
//   { id: 'p3', name: 'Papas Supremas', price: 250, category: 'Papas' },

//   // Bebidas
//   { id: 'd1', name: 'Coca Cola', price: 80, category: 'Bebidas' },
//   { id: 'd2', name: 'Sprite', price: 80, category: 'Bebidas' },
//   { id: 'd3', name: 'Agua', price: 50, category: 'Bebidas' },
//   { id: 'd4', name: 'Jugo Natural', price: 120, category: 'Bebidas' },

//   // Extras
//   { id: 'e1', name: 'Queso Extra', price: 50, category: 'Extras' },
//   { id: 'e2', name: 'Bacon', price: 80, category: 'Extras' },
//   { id: 'e3', name: 'Aguacate', price: 60, category: 'Extras' },
// ];


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

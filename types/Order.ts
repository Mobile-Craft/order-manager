export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number; // sigue existiendo como ID interno
  order_code: string; // este es el nuevo campo visible tipo ORD-001
  customer_name: string;
  items: OrderItem[];
  total: number;
  status: 'Pendiente' | 'En proceso' | 'Terminada' | 'Entregada';
  payment_method: 'Efectivo' | 'Transferencia' | null;
  created_at: string;
  delivered_at?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Burgers' | 'Papas' | 'Bebidas' | 'Extras';
}

export type UserRole = 'Personal' | 'Cocina' | 'Admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface SalesData {
  totalOrders: number;
  totalRevenue: number;
  cashTotal: number;
  transferTotal: number;
  ordersToday: number;
  revenueToday: number;
}
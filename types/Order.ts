export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number; // sigue existiendo como ID interno
  business_id: string; // ID del negocio
  order_code: string; // este es el nuevo campo visible tipo ORD-001
  customer_name: string;
  items: OrderItem[];
  total: number;
  status: 'Pendiente' | 'En proceso' | 'Terminada' | 'Entregada';
  payment_method: 'Efectivo' | 'Transferencia' | null;
  created_at: string;
  delivered_at?: string;
  duration_minutes?: number;
}

export interface MenuItem {
  id: string;
  business_id: string; // ID del negocio
  name: string;
  price: number;
  category: string;
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
  averageDeliveryTime: number;
}
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Order, OrderItem, SalesData } from '@/types/Order';
import { supabase } from '@/lib/supabase';
import { Audio } from 'expo-av';
import { useAuth } from '@/context/AuthContext';

/** =========================
 *  Tipos y Helpers de Filtros
 *  ========================= */
export type DateFilter =
  | { type: 'week' }                                  // Semana actual (Lun-Dom)
  | { type: 'month'; year: number; month: number }    // month: 0-11
  | { type: 'range'; start: Date; end: Date }         // rango personalizado
  | { type: 'all' };                                  // todas (equivalente a sin filtro)

const atStartOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const atEndOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const getWeekRange = (reference = new Date()) => {
  // Semana iniciando LUNES
  const day = reference.getDay(); // 0=Dom
  const diffToMonday = (day + 6) % 7;
  const start = new Date(reference);
  start.setDate(reference.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: atStartOfDay(start), end: atEndOfDay(end) };
};

const getMonthRange = (year: number, monthIndex: number) => {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0); // último día del mes
  return { start: atStartOfDay(start), end: atEndOfDay(end) };
};

const parseOrderDate = (o: Order) => new Date(o.delivered_at || o.created_at);

const filterDeliveredBy = (orders: Order[], filter?: DateFilter): Order[] => {
  if (!filter || filter.type === 'all') return orders;

  if (filter.type === 'week') {
    const { start, end } = getWeekRange();
    return orders.filter(o => {
      const d = parseOrderDate(o);
      return d >= start && d <= end;
    });
  }

  if (filter.type === 'month') {
    const { start, end } = getMonthRange(filter.year, filter.month);
    return orders.filter(o => {
      const d = parseOrderDate(o);
      return d >= start && d <= end;
    });
  }

  if (filter.type === 'range') {
    const start = atStartOfDay(filter.start);
    const end = atEndOfDay(filter.end);
    return orders.filter(o => {
      const d = parseOrderDate(o);
      return d >= start && d <= end;
    });
  }

  return orders;
};

/** =========================
 *  Contexto de Órdenes
 *  ========================= */
interface OrderContextType {
  orders: Order[];
  deliveredOrders: Order[];
  addOrder: (customerName: string, items: OrderItem[]) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  completeOrder: (orderId: string, paymentMethod: 'Efectivo' | 'Transferencia') => Promise<void>;
  getSalesData: (filter?: DateFilter) => SalesData;  // ⬅️ ahora acepta filtro opcional
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

type OrderAction =
  | { type: 'SET_ORDERS'; payload: { activeOrders: Order[]; deliveredOrders: Order[] } }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'MOVE_TO_DELIVERED'; payload: { orderId: string; updatedOrder: Order } }
  | { type: 'SET_LOADING'; payload: boolean };

interface OrderState {
  activeOrders: Order[];
  deliveredOrders: Order[];
  isLoading: boolean;
}

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_ORDERS':
      return {
        ...state,
        activeOrders: action.payload.activeOrders,
        deliveredOrders: action.payload.deliveredOrders,
      };

    case 'ADD_ORDER':
      return {
        ...state,
        activeOrders: [action.payload, ...state.activeOrders],
      };

    case 'UPDATE_ORDER':
      return {
        ...state,
        activeOrders: state.activeOrders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
      };

    case 'MOVE_TO_DELIVERED':
      return {
        ...state,
        activeOrders: state.activeOrders.filter(order => order.id !== action.payload.orderId),
        deliveredOrders: [action.payload.updatedOrder, ...state.deliveredOrders],
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

let notificationSound: Audio.Sound | null = null;

async function loadNotificationSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/shop.mp3') // ajusta la ruta si es necesario
    );
    notificationSound = sound;
  } catch (error) {
    console.error('Error loading sound:', error);
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, {
    activeOrders: [],
    deliveredOrders: [],
    isLoading: true,
  });
  const { user } = useAuth();

  // Cargar órdenes iniciales
  useEffect(() => {
    loadNotificationSound();
    loadOrders();
  }, []);

  // Suscripción en tiempo real
  useEffect(() => {
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change received:', payload);
          playNotificationSound();
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  async function playNotificationSound() {
    try {
      if (notificationSound) {
        await notificationSound.replayAsync();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  const loadOrders = async () => {
    if (!user?.business?.id) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      console.log('Loading orders from Supabase...');

      // Órdenes activas (no entregadas)
      const { data: activeOrders, error: activeError } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'Entregada')
        .eq('business_id', user.business.id)
        .order('created_at', { ascending: true });

      if (activeError) {
        console.error('Error loading active orders:', activeError);
        throw activeError;
      }

      // Órdenes entregadas
      const { data: deliveredOrders, error: deliveredError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Entregada')
        .eq('business_id', user.business.id)
        .order('delivered_at', { ascending: false });

      if (deliveredError) {
        console.error('Error loading delivered orders:', deliveredError);
        throw deliveredError;
      }

      console.log('Orders loaded successfully:', {
        active: activeOrders?.length || 0,
        delivered: deliveredOrders?.length || 0
      });

      dispatch({
        type: 'SET_ORDERS',
        payload: {
          activeOrders: activeOrders || [],
          deliveredOrders: deliveredOrders || [],
        },
      });
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addOrder = async (customerName: string, items: OrderItem[]) => {
    if (!user?.business?.id) {
      throw new Error('No business context available');
    }

    try {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const newOrder: Omit<Order, 'id'> = {
        business_id: user.business.id,
        customer_name: customerName,
        items,
        total,
        status: 'Pendiente',
        payment_method: null,
        created_at: new Date().toISOString(),
        order_code: ''
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) throw error;

      // La suscripción en tiempo real actualizará el estado
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) throw error;

      // La suscripción en tiempo real actualizará el estado
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const completeOrder = async (orderId: string, paymentMethod: 'Efectivo' | 'Transferencia') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'Entregada',
          payment_method: paymentMethod,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      // La suscripción en tiempo real actualizará el estado
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  };

  /** =========================
   *  getSalesData con filtro
   *  ========================= */
  const getSalesData = (filter?: DateFilter): SalesData => {
    // Órdenes del período (si no hay filtro = todas, como antes)
    const periodOrders = filterDeliveredBy(state.deliveredOrders, filter);

    const totalOrders = periodOrders.length;
    const totalRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0);

    const cashTotal = periodOrders
      .filter(o => (o.payment_method || '').toLowerCase() === 'efectivo')
      .reduce((sum, o) => sum + o.total, 0);

    const transferTotal = periodOrders
      .filter(o => (o.payment_method || '').toLowerCase() === 'transferencia')
      .reduce((sum, o) => sum + o.total, 0);

    // "Hoy" se mantiene respecto al día actual, independiente del filtro (compatibilidad previa)
    const today = new Date().toDateString();
    const todayOrders = state.deliveredOrders.filter(
      o => o.delivered_at && new Date(o.delivered_at).toDateString() === today
    );
    const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Promedio de entrega (min) en el período
    const withDuration = periodOrders.filter(o => o.duration_minutes && o.duration_minutes > 0);
    const averageDeliveryTime = withDuration.length
      ? Math.round(
          withDuration.reduce((s, o) => s + (o.duration_minutes || 0), 0) / withDuration.length
        )
      : 0;

    return {
      totalOrders,
      totalRevenue,
      cashTotal,
      transferTotal,
      ordersToday: todayOrders.length,
      revenueToday,
      averageDeliveryTime,
    };
  };

  return (
    <OrderContext.Provider value={{
      orders: state.activeOrders,
      deliveredOrders: state.deliveredOrders,
      addOrder,
      updateOrderStatus,
      completeOrder,
      getSalesData,
      isLoading: state.isLoading,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Order, OrderItem, SalesData } from '@/types/Order';
import { supabase } from '@/lib/supabase';

interface OrderContextType {
  orders: Order[];
  deliveredOrders: Order[];
  addOrder: (customerName: string, items: OrderItem[]) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  completeOrder: (orderId: string, paymentMethod: 'Efectivo' | 'Transferencia') => Promise<void>;
  getSalesData: () => SalesData;
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

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, {
    activeOrders: [],
    deliveredOrders: [],
    isLoading: true,
  });

  // Cargar órdenes iniciales
  useEffect(() => {
    loadOrders();
  }, []);

  // Suscribirse a cambios en tiempo real
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
          loadOrders(); // Recargar todas las órdenes cuando hay cambios
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  const loadOrders = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Cargar órdenes activas (no entregadas)
      const { data: activeOrders, error: activeError } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'Entregada')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Cargar órdenes entregadas
      const { data: deliveredOrders, error: deliveredError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Entregada')
        .order('delivered_at', { ascending: false });

      if (deliveredError) throw deliveredError;

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
    try {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const newOrder: Omit<Order, 'id'> = {
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

      // La suscripción en tiempo real se encargará de actualizar el estado
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

      // La suscripción en tiempo real se encargará de actualizar el estado
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

      // La suscripción en tiempo real se encargará de actualizar el estado
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  };

  const getSalesData = (): SalesData => {
    const today = new Date().toDateString();
    const todayOrders = state.deliveredOrders.filter(order =>
      order.delivered_at && new Date(order.delivered_at).toDateString() === today
    );

    const cashTotal = state.deliveredOrders
      .filter(order => order.payment_method === 'Efectivo')
      .reduce((sum, order) => sum + order.total, 0);

    const transferTotal = state.deliveredOrders
      .filter(order => order.payment_method === 'Transferencia')
      .reduce((sum, order) => sum + order.total, 0);

    const revenueToday = todayOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      totalOrders: state.deliveredOrders.length,
      totalRevenue: cashTotal + transferTotal,
      cashTotal,
      transferTotal,
      ordersToday: todayOrders.length,
      revenueToday,
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
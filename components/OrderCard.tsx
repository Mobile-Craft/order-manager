import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '@/types/Order';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onStatusChange?: (orderId: string, newStatus: Order['status']) => void;
  onCompleteOrder?: (orderId: string, paymentMethod: 'Efectivo' | 'Transferencia') => void;
}

const STATUS_COLORS = {
  'Pendiente': '#FEF3C7',
  'En proceso': '#DBEAFE',
  'Terminada': '#D1FAE5',
  'Entregada': '#F3F4F6',
};

const STATUS_TEXT_COLORS = {
  'Pendiente': '#92400E',
  'En proceso': '#1E40AF',
  'Terminada': '#065F46',
  'Entregada': '#374151',
};

export function OrderCard({ order, showActions = true, onStatusChange, onCompleteOrder }: OrderCardProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'Pendiente': return 'En proceso';
      case 'En proceso': return 'Terminada';
      default: return null;
    }
  };

  const nextStatus = getNextStatus(order.status);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    if (onStatusChange) {
      try {
        await onStatusChange(orderId, newStatus);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  const handleCompleteOrder = async (orderId: string, paymentMethod: 'Efectivo' | 'Transferencia') => {
    if (onCompleteOrder) {
      try {
        await onCompleteOrder(orderId, paymentMethod);
      } catch (error) {
        console.error('Error completing order:', error);
      }
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: STATUS_COLORS[order.status] }]}>
      <View style={styles.header}>
        <Text style={styles.orderId}>{order.order_code}</Text>
        <Text style={styles.time}>{formatTime(order.created_at)}</Text>
      </View>

      <Text style={styles.customerName}>{order.customer_name}</Text>

      <View style={styles.itemsList}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemText}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={styles.itemPrice}>RD${item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>Total: RD${order.total}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_TEXT_COLORS[order.status] }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      {order.payment_method && (
        <Text style={styles.paymentMethod}>Pago: {order.payment_method}</Text>
      )}

      {showActions && (
        <View style={styles.actions}>
          {nextStatus && onStatusChange && (
            <TouchableOpacity
              style={[styles.actionButton, styles.nextButton]}
              onPress={() => handleStatusChange(order.id, nextStatus)}
            >
              <Text style={styles.actionButtonText}>Marcar como {nextStatus}</Text>
            </TouchableOpacity>
          )}

          {order.status === 'Terminada' && onCompleteOrder && (
            <View style={styles.completeActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleCompleteOrder(order.id, 'Efectivo')}
              >
                <Text style={styles.actionButtonText}>Entregada - Efectivo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleCompleteOrder(order.id, 'Transferencia')}
              >
                <Text style={styles.actionButtonText}>Entregada - Transferencia</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  itemsList: {
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 8,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  completeActions: {
    marginTop: 8,
  },
});
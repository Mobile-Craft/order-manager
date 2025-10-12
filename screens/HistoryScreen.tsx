import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { History, Menu, Calendar, DollarSign } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { theme } from '@/lib/theme';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { deliveredOrders, isLoading } = useOrders();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Menu size={24} color="#DC2626" />
          </TouchableOpacity>
          <Text style={styles.title}>Acceso Denegado</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>
            Solo los administradores pueden ver el historial
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes || minutes <= 0) return 'N/A';

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Agrupar órdenes por fecha
  const ordersByDate = deliveredOrders.reduce((acc, order) => {
    const date = formatDate(order.delivered_at || order.created_at);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(order);
    return acc;
  }, {} as Record<string, typeof deliveredOrders>);

  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={24} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <History size={28} color={theme.colors.primaryDark} />
          <Text style={styles.title}>Historial</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Calendar size={20} color="#059669" />
          <Text style={styles.statText}>
            {deliveredOrders.length} órdenes entregadas
          </Text>
        </View>
        <View style={styles.statItem}>
          <DollarSign size={20} color="#059669" />
          <Text style={styles.statText}>RD${totalRevenue} total</Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Cargando historial..." />
      ) : (
        <ScrollView style={styles.ordersList}>
          {deliveredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <History size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                No hay órdenes en el historial
              </Text>
              <Text style={styles.emptySubtitle}>
                Las órdenes entregadas aparecerán aquí
              </Text>
            </View>
          ) : (
            Object.entries(ordersByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, orders]) => (
                <View key={date} style={styles.dateSection}>
                  <Text style={styles.dateTitle}>{date}</Text>
                  {orders
                    .sort(
                      (a, b) =>
                        new Date(b.delivered_at || b.created_at).getTime() -
                        new Date(a.delivered_at || a.created_at).getTime()
                    )
                    .map((order) => (
                      <View key={order.id} style={styles.historyOrderCard}>
                        <View style={styles.orderHeader}>
                          <Text style={styles.orderId}>{order.order_code}</Text>
                          <Text style={styles.orderTime}>
                            {formatTime(order.delivered_at || order.created_at)}
                          </Text>
                        </View>

                        <Text style={styles.customerName}>
                          {order.customer_name}
                        </Text>

                        <View style={styles.itemsList}>
                          {order.items.map((item, index) => (
                            <View key={index} style={styles.item}>
                              <Text style={styles.itemText}>
                                {item.quantity}x {item.name}
                              </Text>
                              <Text style={styles.itemPrice}>
                                RD${item.price * item.quantity}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.orderFooter}>
                          <Text style={styles.total}>
                            Total: RD${order.total}
                          </Text>
                          <View style={styles.paymentBadge}>
                            <Text style={styles.paymentText}>
                              {order.payment_method}
                            </Text>
                          </View>
                        </View>

                        {(order.duration_minutes ?? 0) > 0 && (
                          <View style={styles.durationContainer}>
                            <Text style={styles.durationLabel}>
                              Tiempo de entrega:
                            </Text>
                            <Text style={styles.durationValue}>
                              {formatDuration(order?.duration_minutes ?? 0)}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  placeholder: {
    width: 40,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#059669',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
  },
  ordersList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  dateSection: {
    marginTop: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyOrderCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderTime: {
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  paymentBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  durationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  durationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { ChefHat, Menu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useOrders } from '@/context/OrderContext';
import { OrderCard } from '@/components/OrderCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { theme } from '@/lib/theme';
import { useAssets } from 'expo-asset';
import { Image } from 'react-native';


export default function KitchenScreen() {
  const [assets, error] = useAssets([
    require('@/assets/images/pendingIcon.png'),
    require('@/assets/images/inProcessIcon.png'),
    require('@/assets/images/doneIcon.png'),
  ]);
  const navigation = useNavigation();
  const { orders, updateOrderStatus, isLoading } = useOrders();

  // Solo mostrar órdenes que no están entregadas
  const activeOrders = orders.filter(order => order.status !== 'Entregada');

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
          <ChefHat size={28} color={theme.colors.primaryDark} />
          <Text style={styles.title}>Vista Cocina</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {activeOrders.length} órdenes activas
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Cargando órdenes de cocina..." />
      ) : (
        <ScrollView style={styles.ordersList}>
          {activeOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <ChefHat size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No hay órdenes pendientes</Text>
              <Text style={styles.emptySubtitle}>
                Las nuevas órdenes aparecerán aquí automáticamente
              </Text>
            </View>
          ) : (
            <>
              {/* Órdenes Pendientes */}
              {activeOrders.filter(order => order.status === 'Pendiente').length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    {assets && assets[0] && (
                      <Image
                        source={{ uri: assets[0].uri }}
                        style={styles.sectionIcon}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={styles.sectionTitleText}>
                      Pendientes ({activeOrders.filter(order => order.status === 'Pendiente').length})
                    </Text>
                  </View>

                  {activeOrders
                    .filter(order => order.status === 'Pendiente')
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={updateOrderStatus}
                        showActions={true}
                      />
                    ))}
                </View>
              )}

              {/* Órdenes En Proceso */}
              {activeOrders.filter(order => order.status === 'En proceso').length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    {assets && assets[1] && (
                      <Image
                        source={{ uri: assets[1].uri }}
                        style={styles.sectionIcon}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={styles.sectionTitleText}>En Proceso ({activeOrders.filter(order => order.status === 'En proceso').length})</Text>
                  </View>

                  {activeOrders
                    .filter(order => order.status === 'En proceso')
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={updateOrderStatus}
                        showActions={true}
                      />
                    ))}
                </View>
              )}

              {/* Órdenes Terminadas */}
              {activeOrders.filter(order => order.status === 'Terminada').length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    {assets && assets[2] && (
                      <Image
                        source={{ uri: assets[2].uri }}
                        style={styles.sectionIcon}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={styles.sectionTitleText}>Terminadas - Listas para entrega ({activeOrders.filter(order => order.status === 'Terminada').length})</Text>
                  </View>

                  {activeOrders
                    .filter(order => order.status === 'Terminada')
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        showActions={false}
                      />
                    ))}
                </View>
              )}
            </>
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
  statsContainer: {
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
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
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },

  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },

  sectionIcon: {
    width: 24,
    height: 24,
  },

});
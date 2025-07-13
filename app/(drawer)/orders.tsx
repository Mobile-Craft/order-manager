import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Plus, Minus, ShoppingCart, Menu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useOrders } from '@/context/OrderContext';
import { OrderCard } from '@/components/OrderCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MenuItem, OrderItem } from '@/types/Order';
import { fetchMenu } from '@/data/menu';
import { theme } from '@/lib/theme';

export default function OrdersScreen() {
  const navigation = useNavigation();
  const { orders, addOrder, updateOrderStatus, completeOrder, isLoading } = useOrders();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchMenu().then(setMenuItems);
  }, []);


  const addToOrder = (menuItem: typeof menuItems[0]) => {
    const existingItem = selectedItems.find(item => item.id === menuItem.id);

    if (existingItem) {
      setSelectedItems(prev =>
        prev.map(item =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(prev => [...prev, {
        id: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
      }]);
    }
  };

  const removeFromOrder = (itemId: string) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(item => item.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prev.filter(item => item.id !== itemId);
      }
    });
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del cliente');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos un producto');
      return;
    }

    addOrder(customerName.trim(), selectedItems)
      .then(() => {
        setCustomerName('');
        setSelectedItems([]);
        setShowCreateModal(false);
        Alert.alert('Éxito', 'Orden creada correctamente');
      })
      .catch((error) => {
        Alert.alert('Error', 'No se pudo crear la orden');
        console.error('Error creating order:', error);
      });
  };

  const categorizedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={24} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Pedidos Actuales</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Cargando órdenes..." />
      ) : (
        <ScrollView style={styles.ordersList}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay órdenes activas</Text>
              <Text style={styles.emptySubtext}>Las nuevas órdenes aparecerán aquí</Text>
            </View>
          ) : (
            orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateOrderStatus}
                onCompleteOrder={completeOrder}
                showActions={true}
              />
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Orden</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCreateModal(false);
                setCustomerName('');
                setSelectedItems([]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.customerInput}
            placeholderTextColor={'#D1D5DB'}
            placeholder="Nombre del cliente"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <ScrollView style={styles.menuContainer}>
            {Object.entries(categorizedItems).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map(item => {
                  const selectedItem = selectedItems.find(selected => selected.id === item.id);
                  const quantity = selectedItem?.quantity || 0;

                  return (
                    <View key={item.id} style={styles.menuItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>RD${item.price}</Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => removeFromOrder(item.id)}
                          disabled={quantity === 0}
                        >
                          <Minus size={16} color={quantity > 0 ? '#DC2626' : '#9CA3AF'} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => addToOrder(item)}
                        >
                          <Plus size={16} color={theme.colors.primaryDark} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.orderSummary}>
            <View style={styles.summaryHeader}>
              <ShoppingCart size={20} color="#DC2626" />
              <Text style={styles.summaryTitle}>Resumen del Pedido</Text>
            </View>

            {selectedItems.length > 0 ? (
              <>
                {selectedItems.map(item => (
                  <View key={item.id} style={styles.summaryItem}>
                    <Text style={styles.summaryItemText}>
                      {item.quantity}x {item.name}
                    </Text>
                    <Text style={styles.summaryItemPrice}>RD${item.price * item.quantity}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalText}>Total: RD${getTotalPrice()}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.emptyCartText}>No hay productos seleccionados</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.createOrderButton, { opacity: selectedItems.length > 0 && customerName.trim() ? 1 : 0.5 }]}
            onPress={handleCreateOrder}
            disabled={selectedItems.length === 0 || !customerName.trim()}
          >
            <Text style={styles.createOrderButtonText}>Crear Orden</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: theme.colors.primaryDark,
    padding: 12,
    borderRadius: 8,
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  customerInput: {
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
  },
  menuContainer: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  orderSummary: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemText: {
    fontSize: 14,
    color: '#4B5563',
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'right',
  },
  emptyCartText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  createOrderButton: {
    margin: 16,
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 16,
    borderRadius: 8,
  },
  createOrderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
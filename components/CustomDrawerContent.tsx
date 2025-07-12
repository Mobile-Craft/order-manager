import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { ShoppingCart, History, DollarSign, User, LogOut, ChefHat } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    {
      name: 'Pedidos Actuales',
      icon: ShoppingCart,
      route: 'orders',
      adminOnly: false,
    },
    {
      name: 'Vista Cocina',
      icon: ChefHat,
      route: 'kitchen',
      adminOnly: false,
    },
    {
      name: 'Historial',
      icon: History,
      route: 'history',
      adminOnly: true,
    },
    {
      name: 'Ventas',
      icon: DollarSign,
      route: 'sales',
      adminOnly: true,
    },
  ];

  const handleNavigation = (routeName: string) => {
    props.navigation.navigate(routeName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🍔</Text>
          </View>
          <Text style={styles.title}>Crushed Burger</Text>
          <Text style={styles.subtitle}>Sistema de Pedidos</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userIcon}>
            <User size={24} color="#DC2626" />
          </View>
          <View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            
            return (
              <TouchableOpacity
                key={item.route}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <item.icon size={24} color="#374151" />
                <Text style={styles.menuItemText}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FEE2E2',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
    marginLeft: 8,
  },
});
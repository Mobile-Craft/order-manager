import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {
  ShoppingCart,
  History,
  DollarSign,
  User,
  LogOut,
  ChefHat,
  Package,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';
import { useAssets } from 'expo-asset';
import { Image } from 'react-native';

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout, isAdmin } = useAuth();
  const currentRoute = props.state?.routes?.[props.state.index]?.name;
  const [assets, error] = useAssets([require('@/assets/images/logo2.jpg')]);

  const menuItems = [
    {
      name: 'Pedidos Actuales',
      icon: ShoppingCart,
      route: 'orders',
      adminOnly: false, // Accesible para Admin
      kitchenOnly: false,
    },
    {
      name: 'Vista Cocina',
      icon: ChefHat,
      route: 'kitchen',
      adminOnly: false, // Accesible para ambos
      kitchenOnly: false,
    },
    {
      name: 'Historial',
      icon: History,
      route: 'history',
      adminOnly: true,
      kitchenOnly: false,
    },
    {
      name: 'Ventas',
      icon: DollarSign,
      route: 'sales',
      adminOnly: true,
      kitchenOnly: false,
    },
    {
      name: 'Productos',
      icon: Package,
      route: 'products',
      adminOnly: true,
      kitchenOnly: false,
    },
  ];

  const handleNavigation = (routeName: string) => {
    props.navigation.navigate(routeName);
  };

  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          {assets && assets[0] && (
            <Image
              source={{ uri: assets[0].uri }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderColor: 'white',
                borderWidth: 1,
              }}
              resizeMode="contain"
            />
          )}
          <Text style={styles.title}>Order Manager</Text>
          <Text style={styles.subtitle}>Sistema de Pedidos</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userIcon}>
            <User size={24} color={theme.colors.primaryDark} />
          </View>
          <View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => {
            // Si es solo para admin y el usuario no es admin, no mostrar
            if (item.adminOnly && !isAdmin) return null;

            // Si el usuario es de cocina, solo mostrar la vista de cocina
            if (user?.role === 'Cocina' && item.route !== 'kitchen')
              return null;

            const isActive = currentRoute === item.route;

            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
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
          <LogOut size={20} color={theme.colors.primaryDark} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </>
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
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    borderRadius: 20,
  },
  logoText: {
    fontSize: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
    color: theme.colors.background,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.background,
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
    backgroundColor: '#DBEAFE',
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
  activeMenuItem: {
    backgroundColor: theme.colors.primary + '30', 
    shadowOpacity: 0.15,
  },
  activeMenuItemText: {
    color: theme.colors.background,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primaryDark,
    marginLeft: 8,
  },
});

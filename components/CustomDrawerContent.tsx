// components/CustomDrawerContent.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
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
import type { AppRole } from '@/types/Auth';

type MenuItem = {
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  route: string;
  allowedRoles: AppRole[]; // quién puede ver este ítem
};

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const currentRoute = props.state?.routes?.[props.state.index]?.name;
  const [assets] = useAssets([require('@/assets/images/logo2.jpg')]);

  const role: AppRole | undefined = user?.profile?.role as AppRole | undefined;
  const fullName = user?.profile?.full_name ?? user?.email ?? 'Usuario';
  const roleLabel = role ?? '—';

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        name: 'Pedidos Actuales',
        icon: ShoppingCart,
        route: 'orders',
        allowedRoles: ['Admin', 'Cajero'],
      },
      {
        name: 'Vista Cocina',
        icon: ChefHat,
        route: 'kitchen',
        allowedRoles: ['Admin', 'Cocina'],
      },
      {
        name: 'Historial',
        icon: History,
        route: 'history',
        allowedRoles: ['Admin'],
      },
      {
        name: 'Ventas',
        icon: DollarSign,
        route: 'sales',
        allowedRoles: ['Admin'],
      },
      {
        name: 'Productos',
        icon: Package,
        route: 'products',
        allowedRoles: ['Admin'],
      },
    ],
    []
  );

  const handleNavigation = (routeName: string) => {
    props.navigation.navigate(routeName as never);
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');

  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          {assets && assets[0] ? (
            <Image
              source={{ uri: assets[0].uri }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={styles.logoFallbackText}>OM</Text>
            </View>
          )}
          <Text style={styles.title}>{user?.business.name}</Text>
          <Text style={styles.subtitle}>Sistema de Pedidos</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userIcon}>
            <Text style={styles.userInitials}>{initials(fullName)}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userRole}>{roleLabel}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems
            .filter((item) => (role ? item.allowedRoles.includes(role) : false))
            .map((item) => {
              const isActive = currentRoute === item.route;
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={() => handleNavigation(item.route)}
                >
                  <Icon size={22} color={isActive ? theme.colors.primaryDark : '#374151'} />
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.activeMenuItemText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <SafeAreaView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={20} color={theme.colors.primaryDark} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },

  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    borderRadius: 20,
    margin: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: 'white',
    borderWidth: 1,
  },
  logoFallback: {
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
    fontSize: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 6,
    color: theme.colors.background,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.background,
    opacity: 0.9,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 12,
  },
  userIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#DBEAFE',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
    fontSize: 16,
  },
  userName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  userRole: { fontSize: 14, color: '#6B7280' },

  menuContainer: { marginTop: 20, paddingHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    gap: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  activeMenuItem: {
    backgroundColor: theme.colors.primary + '26', // ~15% transparencia
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  activeMenuItemText: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
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
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
});

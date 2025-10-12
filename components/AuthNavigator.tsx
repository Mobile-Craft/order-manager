import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '@/context/AuthContext';
import LoginScreen from '@/app/login';
import OrdersScreen from '@/screens/OrdersScreen';
import KitchenScreen from '@/screens/KitchenScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SalesScreen from '@/screens/SalesScreen';
import ProductsScreen from '@/screens/ProductsScreen';
import { CustomDrawerContent } from '@/components/CustomDrawerContent';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Stack para usuarios de cocina (solo vista de cocina)
function KitchenStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="KitchenMain" component={KitchenScreen} />
    </Stack.Navigator>
  );
}

// Drawer completo para administradores
function AdminDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="orders"
        component={OrdersScreen}
        options={{
          drawerLabel: 'Pedidos Actuales',
          title: 'Pedidos Actuales',
        }}
      />
      <Drawer.Screen
        name="kitchen"
        component={KitchenScreen}
        options={{
          drawerLabel: 'Vista Cocina',
          title: 'Vista Cocina',
        }}
      />
      <Drawer.Screen
        name="history"
        component={HistoryScreen}
        options={{
          drawerLabel: 'Historial',
          title: 'Historial',
        }}
      />
      <Drawer.Screen
        name="sales"
        component={SalesScreen}
        options={{
          drawerLabel: 'Ventas',
          title: 'Ventas',
        }}
      />
      <Drawer.Screen
        name="products"
        component={ProductsScreen}
        options={{
          drawerLabel: 'Productos',
          title: 'Productos',
        }}
      />
    </Drawer.Navigator>
  );
}

// Stack principal que maneja autenticación
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export function AuthNavigator() {
  const { user } = useAuth();

  if (!user) {
    // Usuario no autenticado - mostrar login
    return <AuthStack />;
  } else if (user.role === 'Admin') {
    // Usuario Admin - mostrar drawer completo
    return <AdminDrawer />;
  } else if (user.role === 'Cocina') {
    // Usuario Cocina - solo vista de cocina
    return <KitchenStack />;
  } else {
    // Fallback - mostrar login si el rol no es reconocido
    return <AuthStack />;
  }
}
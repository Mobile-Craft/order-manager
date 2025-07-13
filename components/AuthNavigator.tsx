import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '@/context/AuthContext';
import LoginScreen from '@/app/login';
import OrdersScreen from '@/screens/OrdersScreen';
import KitchenScreen from '@/screens/KitchenScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SalesScreen from '@/screens/SalesScreen';
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

  return (
    <NavigationContainer>
      {!user ? (
        // Usuario no autenticado - mostrar login
        <AuthStack />
      ) : user.role === 'Admin' ? (
        // Usuario Admin - mostrar drawer completo
        <AdminDrawer />
      ) : user.role === 'Cocina' ? (
        // Usuario Cocina - solo vista de cocina
        <KitchenStack />
      ) : (
        // Fallback - mostrar login si el rol no es reconocido
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
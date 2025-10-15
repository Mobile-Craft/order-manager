import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '@/context/AuthContext';
import SignInScreen from '@/screens/auth/SignInScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import EmailConfirmationScreen from '@/screens/auth/EmailConfirmationScreen';
import ProfileSetupScreen from '@/screens/auth/ProfileSetupScreen';
import InvitedUserSetupScreen from '@/screens/auth/InvitedUserSetupScreen';
import OrdersScreen from '@/screens/OrdersScreen';
import KitchenScreen from '@/screens/KitchenScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SalesScreen from '@/screens/SalesScreen';
import ProductsScreen from '@/screens/ProductsScreen';
import UsersScreen from '@/screens/UsersScreen';
import { CustomDrawerContent } from '@/components/CustomDrawerContent';
import { LoadingSpinner } from '@/components/LoadingSpinner';

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

// Drawer completo para administradores y cajeros
function MainDrawer() {
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
      <Drawer.Screen
        name="users"
        component={UsersScreen}
        options={{
          drawerLabel: 'Usuarios',
          title: 'Usuarios',
        }}
      />
    </Drawer.Navigator>
  );
}

// Stack de autenticación
function AuthStack() {
  const [currentScreen, setCurrentScreen] = useState<'signin' | 'signup' | 'confirmation' | 'profile'>('signin');
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToSignIn = () => setCurrentScreen('signin');
  const navigateToConfirmation = (email: string) => {
    setConfirmationEmail(email);
    setCurrentScreen('confirmation');
  };
  const navigateToProfile = () => setCurrentScreen('profile');

  switch (currentScreen) {
    case 'signup':
      return (
        <SignUpScreen 
          onNavigateToLogin={navigateToSignIn}
          onNavigateToConfirmation={navigateToConfirmation}
        />
      );
    case 'confirmation':
      return (
        <EmailConfirmationScreen 
          email={confirmationEmail}
          onNavigateToProfile={navigateToProfile}
          onNavigateBack={navigateToSignUp}
        />
      );
    case 'profile':
      return <ProfileSetupScreen />;
    default:
      return (
        <SignInScreen 
          onNavigateToSignUp={navigateToSignUp}
        />
      );
  }
}

export function AuthNavigator() {
  const { user, loading, isInvitedUser, hasInvitation } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Cargando..." />;
  }

  if (!user) {
    // Usuario no autenticado - mostrar flujo de autenticación
    return <AuthStack />;
  }

  // Usuario autenticado pero es un invitado sin perfil completo
  if (isInvitedUser()) {
    return <InvitedUserSetupScreen />;
  }

  // Usuario autenticado - verificar si tiene perfil completo
  if (!user.profile || !user.business) {
    return <ProfileSetupScreen />;
  }

  // Usuario con perfil completo - mostrar aplicación según rol
  if (user.profile.role === 'Cocina') {
    // Usuario Cocina - solo vista de cocina
    return <KitchenStack />;
  } else {
    // Usuario Admin o Cajero - drawer completo
    return <MainDrawer />;
  }
}
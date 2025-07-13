import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { OrderProvider } from '@/context/OrderContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthNavigator } from '@/components/AuthNavigator';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <OrderProvider>
        <AuthNavigator />
        <StatusBar style="dark" />
      </OrderProvider>
    </AuthProvider>
  );
}
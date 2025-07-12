import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { OrderProvider } from '@/context/OrderContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <OrderProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </OrderProvider>
    </AuthProvider>
  );
}
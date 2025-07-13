import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect href="/login" />;
  }
  
  // Si es usuario de cocina, redirigir directamente a la vista de cocina
  if (user.role === 'Cocina') {
    return <Redirect href="/(drawer)/kitchen" />;
  }
  
  // Si es admin, redirigir a órdenes
  return <Redirect href="/(drawer)/orders" />;
}
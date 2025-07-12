import { Drawer } from 'expo-router/drawer';
import { CustomDrawerContent } from '@/components/CustomDrawerContent';

export default function DrawerLayout() {
  return (
    <Drawer
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
        options={{
          drawerLabel: 'Pedidos Actuales',
          title: 'Pedidos Actuales',
        }}
      />
      <Drawer.Screen
        name="kitchen"
        options={{
          drawerLabel: 'Vista Cocina',
          title: 'Vista Cocina',
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          drawerLabel: 'Historial',
          title: 'Historial',
        }}
      />
      <Drawer.Screen
        name="sales"
        options={{
          drawerLabel: 'Ventas',
          title: 'Ventas',
        }}
      />
    </Drawer>
  );
}
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { DollarSign, Menu, TrendingUp, CreditCard, Banknote, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';

export default function SalesScreen() {
  const navigation = useNavigation();
  const { getSalesData } = useOrders();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Menu size={24} color="#DC2626" />
          </TouchableOpacity>
          <Text style={styles.title}>Acceso Denegado</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>Solo los administradores pueden ver las ventas</Text>
        </View>
      </SafeAreaView>
    );
  }

  const salesData = getSalesData();

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = '#DC2626',
    backgroundColor = '#FEE2E2' 
  }: {
    icon: any;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
    backgroundColor?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor }]}>
      <View style={styles.statHeader}>
        <Icon size={24} color={color} />
        <Text style={[styles.statTitle, { color }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color }]}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={24} color="#DC2626" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <DollarSign size={28} color="#DC2626" />
          <Text style={styles.title}>Ventas</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resumen General</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon={TrendingUp}
              title="Total Órdenes"
              value={salesData.totalOrders.toString()}
              subtitle="órdenes entregadas"
              color="#059669"
              backgroundColor="#ECFDF5"
            />
            
            <StatCard
              icon={DollarSign}
              title="Ingresos Totales"
              value={`RD$${salesData.totalRevenue}`}
              subtitle="total acumulado"
              color="#DC2626"
              backgroundColor="#FEE2E2"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Por Método de Pago</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon={Banknote}
              title="Efectivo"
              value={`RD$${salesData.cashTotal}`}
              subtitle={`${Math.round((salesData.cashTotal / salesData.totalRevenue) * 100) || 0}% del total`}
              color="#F59E0B"
              backgroundColor="#FEF3C7"
            />
            
            <StatCard
              icon={CreditCard}
              title="Transferencia"
              value={`RD$${salesData.transferTotal}`}
              subtitle={`${Math.round((salesData.transferTotal / salesData.totalRevenue) * 100) || 0}% del total`}
              color="#3B82F6"
              backgroundColor="#DBEAFE"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Hoy</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon={Calendar}
              title="Órdenes Hoy"
              value={salesData.ordersToday.toString()}
              subtitle="órdenes del día"
              color="#8B5CF6"
              backgroundColor="#F3E8FF"
            />
            
            <StatCard
              icon={TrendingUp}
              title="Ingresos Hoy"
              value={`RD$${salesData.revenueToday}`}
              subtitle="ventas del día"
              color="#10B981"
              backgroundColor="#D1FAE5"
            />
          </View>
        </View>

        {salesData.totalOrders > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Estadísticas</Text>
            
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Promedio por orden:</Text>
                <Text style={styles.analyticsValue}>
                  RD${Math.round(salesData.totalRevenue / salesData.totalOrders)}
                </Text>
              </View>
              
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Método más usado:</Text>
                <Text style={styles.analyticsValue}>
                  {salesData.cashTotal > salesData.transferTotal ? 'Efectivo' : 'Transferencia'}
                </Text>
              </View>
              
              {salesData.ordersToday > 0 && (
                <View style={styles.analyticsRow}>
                  <Text style={styles.analyticsLabel}>Promedio hoy:</Text>
                  <Text style={styles.analyticsValue}>
                    RD${Math.round(salesData.revenueToday / salesData.ordersToday)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  placeholder: {
    width: 40,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  analyticsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  analyticsLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
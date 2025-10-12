import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import {
  DollarSign,
  Menu,
  TrendingUp,
  CreditCard,
  Banknote,
  Calendar,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useOrders, DateFilter } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useAssets } from 'expo-asset';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '@/lib/theme';

export default function SalesScreen() {
  const [assets] = useAssets([
    require('@/assets/images/financialIcon.png'),
    require('@/assets/images/creditCardIcon.png'),
    require('@/assets/images/calendarIcon.png'),
    require('@/assets/images/statistics.png'),
  ]);

  const navigation = useNavigation();
  const { getSalesData } = useOrders();
  const { isAdmin } = useAuth();

  // -----------------------------
  // Estado de filtros
  // -----------------------------
  type FilterUI = 'week' | 'month' | 'range';
  const now = new Date();

  const [filterType, setFilterType] = React.useState<FilterUI>('week');
  const [activeRangeField, setActiveRangeField] = React.useState<
    'start' | 'end'
  >('start');

  // Mes/Año para filtro mensual
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    now.getMonth()
  ); // 0-11
  const [selectedYear, setSelectedYear] = React.useState<number>(
    now.getFullYear()
  );

  // Rango personalizado (efectivo/aplicado)
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);

  // Modal de rango
  const [rangeModalVisible, setRangeModalVisible] = React.useState(false);
  // Selección temporal dentro del modal (no impacta hasta que se presione Aplicar)
  const [tempStart, setTempStart] = React.useState<Date>(
    startDate || new Date()
  );
  const [tempEnd, setTempEnd] = React.useState<Date>(endDate || new Date());

  const openRangeModal = () => {
    setTempStart(startDate || new Date());
    setTempEnd(endDate || new Date());
    setRangeModalVisible(true);
  };

  const closeRangeModal = () => setRangeModalVisible(false);

  const applyRange = () => {
    // Normaliza si el usuario eligió al revés
    let s = tempStart;
    let e = tempEnd;
    if (s > e) {
      const aux = s;
      s = e;
      e = aux;
    }
    setStartDate(s);
    setEndDate(e);
    setRangeModalVisible(false);
  };

  const formatShort = (d?: Date | null) =>
    d
      ? d.toLocaleDateString('es-DO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

  // Builder de filtro para getSalesData
  const buildFilter = React.useCallback((): DateFilter | undefined => {
    if (filterType === 'week') return { type: 'week' };
    if (filterType === 'month')
      return { type: 'month', year: selectedYear, month: selectedMonth };
    if (filterType === 'range') {
      if (startDate && endDate)
        return { type: 'range', start: startDate, end: endDate };
      return { type: 'all' }; // si no hay ambas fechas, no filtrar
    }
    return { type: 'all' };
  }, [filterType, selectedYear, selectedMonth, startDate, endDate]);

  // Datos calculados desde el servicio con el filtro activo
  const salesData = getSalesData(buildFilter());

  // Util formateo moneda
  const currency = (n: number) =>
    new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      maximumFractionDigits: 0,
    }).format(n || 0);

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
          <Text style={styles.accessDeniedText}>
            Solo los administradores pueden ver las ventas
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = '#DC2626',
    backgroundColor = '#FEE2E2',
  }: {
    icon: any;
    title: string;
    value: string | number;
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
      {subtitle && (
        <Text style={[styles.statSubtitle, { color }]}>{subtitle}</Text>
      )}
    </View>
  );

  const RangeSummary = () => (
    <Text style={styles.rangeSummary}>
      {startDate && endDate
        ? `${formatShort(startDate)}  →  ${formatShort(endDate)}`
        : 'Sin seleccionar'}
    </Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={24} color={theme.colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <DollarSign size={28} color={theme.colors.primaryDark} />
          <Text style={styles.title}>Ventas</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersBar}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'week' && styles.filterChipActive,
          ]}
          onPress={() => setFilterType('week')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'week' && styles.filterChipTextActive,
            ]}
          >
            Semana
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'month' && styles.filterChipActive,
          ]}
          onPress={() => setFilterType('month')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'month' && styles.filterChipTextActive,
            ]}
          >
            Mes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'range' && styles.filterChipActive,
          ]}
          onPress={() => setFilterType('range')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'range' && styles.filterChipTextActive,
            ]}
          >
            Rango
          </Text>
        </TouchableOpacity>
      </View>

      {/* Controles por tipo */}
      {filterType === 'month' && (
        <View style={styles.monthRow}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => {
              const m = selectedMonth - 1;
              if (m < 0) {
                setSelectedMonth(11);
                setSelectedYear((y) => y - 1);
              } else {
                setSelectedMonth(m);
              }
            }}
          >
            <Text style={styles.monthButtonText}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.monthLabel}>
            {new Date(selectedYear, selectedMonth).toLocaleString('es-DO', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => {
              const m = selectedMonth + 1;
              if (m > 11) {
                setSelectedMonth(0);
                setSelectedYear((y) => y + 1);
              } else {
                setSelectedMonth(m);
              }
            }}
          >
            <Text style={styles.monthButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
      )}

      {filterType === 'range' && (
        <View style={styles.rangeControlBar}>
          <View style={styles.rangePreview}>
            <Calendar size={18} color="#374151" />
            <RangeSummary />
          </View>
          <TouchableOpacity
            style={styles.rangeOpenBtn}
            onPress={openRangeModal}
          >
            <Text style={styles.rangeOpenText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL DE RANGO */}
      <Modal
        visible={rangeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeRangeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeRangeModal}>
          {/* Bloque para cerrar tocando fuera */}
        </Pressable>

        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Selecciona el rango</Text>

          {/* Tabs: Desde / Hasta */}
          <View style={styles.modalHeaderRow}>
            <TouchableOpacity
              style={[
                styles.tabChip,
                activeRangeField === 'start' && styles.tabChipActive,
              ]}
              onPress={() => setActiveRangeField('start')}
            >
              <Text
                style={[
                  styles.tabTitle,
                  activeRangeField === 'start' && styles.tabTitleActive,
                ]}
              >
                Desde
              </Text>
              <Text
                style={[
                  styles.tabDate,
                  activeRangeField === 'start' && styles.tabDateActive,
                ]}
              >
                {formatShort(tempStart)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabChip,
                activeRangeField === 'end' && styles.tabChipActive,
              ]}
              onPress={() => setActiveRangeField('end')}
            >
              <Text
                style={[
                  styles.tabTitle,
                  activeRangeField === 'end' && styles.tabTitleActive,
                ]}
              >
                Hasta
              </Text>
              <Text
                style={[
                  styles.tabDate,
                  activeRangeField === 'end' && styles.tabDateActive,
                ]}
              >
                {formatShort(tempEnd)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Un SOLO picker, según la pestaña activa */}
          <View style={styles.singlePickerBox}>
            <DateTimePicker
              value={activeRangeField === 'start' ? tempStart : tempEnd}
              mode="date"
              display="spinner"
              onChange={(e, d) => {
                if (!d) return;
                if (activeRangeField === 'start') {
                  // no permitir que "Desde" supere a "Hasta"
                  if (d > tempEnd) setTempEnd(d);
                  setTempStart(d);
                } else {
                  // no permitir que "Hasta" sea menor que "Desde"
                  if (d < tempStart) setTempStart(d);
                  setTempEnd(d);
                }
              }}
              minimumDate={activeRangeField === 'end' ? tempStart : undefined}
              maximumDate={activeRangeField === 'start' ? tempEnd : undefined}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={closeRangeModal}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalApply} onPress={applyRange}>
              <Text style={styles.modalApplyText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content}>
        {/* Resumen */}
        <View className="section" style={styles.section}>
          <View style={styles.statSubTitleContainer}>
            {assets && assets[0] && (
              <Image
                source={{ uri: assets[0].uri }}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            )}
            <Text style={styles.sectionTitle}>Resumen General</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon={TrendingUp}
              title="Total Órdenes"
              value={salesData.totalOrders.toString()}
              subtitle="órdenes en el período"
              color="#059669"
              backgroundColor="#ECFDF5"
            />
            <StatCard
              icon={DollarSign}
              title="Ingresos Totales"
              value={currency(salesData.totalRevenue)}
              subtitle="total del período"
              color="#DC2626"
              backgroundColor="#FEE2E2"
            />
          </View>
        </View>

        {/* Por método */}
        <View style={styles.section}>
          <View style={styles.statSubTitleContainer}>
            {assets && assets[1] && (
              <Image
                source={{ uri: assets[1].uri }}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            )}
            <Text style={styles.sectionTitle}>Por Método de Pago</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon={Banknote}
              title="Efectivo"
              value={currency(salesData.cashTotal)}
              subtitle={`${Math.round(
                (salesData.cashTotal / (salesData.totalRevenue || 1)) * 100
              )}% del total`}
              color="#F59E0B"
              backgroundColor="#FEF3C7"
            />

            <StatCard
              icon={CreditCard}
              title="Transferencia"
              value={currency(salesData.transferTotal)}
              subtitle={`${Math.round(
                (salesData.transferTotal / (salesData.totalRevenue || 1)) * 100
              )}% del total`}
              color="#3B82F6"
              backgroundColor="#DBEAFE"
            />
          </View>
        </View>

        {/* Hoy (se mantiene respecto al día actual) */}
        <View style={styles.section}>
          <View style={styles.statSubTitleContainer}>
            {assets && assets[2] && (
              <Image
                source={{ uri: assets[2].uri }}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            )}
            <Text style={styles.sectionTitle}>Hoy</Text>
          </View>
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
              value={currency(salesData.revenueToday)}
              subtitle="ventas del día"
              color="#10B981"
              backgroundColor="#D1FAE5"
            />
          </View>
        </View>

        {/* Estadísticas adicionales */}
        {salesData.totalOrders > 0 && (
          <View style={styles.section}>
            <View style={styles.statSubTitleContainer}>
              {assets && assets[3] && (
                <Image
                  source={{ uri: assets[3].uri }}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.sectionTitle}>Estadísticas</Text>
            </View>

            <View style={styles.analyticsCard}>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Promedio por orden:</Text>
                <Text style={styles.analyticsValue}>
                  {currency(
                    Math.round(
                      salesData.totalRevenue / (salesData.totalOrders || 1)
                    )
                  )}
                </Text>
              </View>

              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Método más usado:</Text>
                <Text style={styles.analyticsValue}>
                  {salesData.cashTotal > salesData.transferTotal
                    ? 'Efectivo'
                    : 'Transferencia'}
                </Text>
              </View>

              {salesData.ordersToday > 0 && (
                <View style={styles.analyticsRow}>
                  <Text style={styles.analyticsLabel}>Promedio hoy:</Text>
                  <Text style={styles.analyticsValue}>
                    {currency(
                      Math.round(
                        salesData.revenueToday / (salesData.ordersToday || 1)
                      )
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tiempo de entrega */}
        {salesData.averageDeliveryTime > 0 && (
          <View style={styles.section}>
            <View style={styles.statSubTitleContainer}>
              {assets && assets[3] && (
                <Image
                  source={{ uri: assets[3].uri }}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.sectionTitle}>Tiempo de Entrega</Text>
            </View>

            <View style={styles.analyticsCard}>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Promedio de entrega:</Text>
                <Text style={styles.analyticsValue}>
                  {Math.floor(salesData.averageDeliveryTime / 60) > 0
                    ? `${Math.floor(salesData.averageDeliveryTime / 60)}h ${
                        salesData.averageDeliveryTime % 60
                      }m`
                    : `${salesData.averageDeliveryTime}m`}
                </Text>
              </View>
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
    color: theme.colors.primaryDark,
  },
  placeholder: {
    width: 50,
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

  // ---- Filtros ----
  filtersBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: (theme.colors.primary as string) + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: '#374151',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: theme.colors.primaryDark,
  },

  // ---- Mes ----
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'capitalize',
  },

  // ---- Rango (barra) ----
  rangeControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  rangePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rangeSummary: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  rangeOpenBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rangeOpenText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  // ---- Modal ----
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalPickersRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalPickerCol: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
  },
  modalPickerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  modalApply: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.background,
  },

  // ---- Secciones y cards ----
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
    backgroundColor: 'white',
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
  statSubTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 18,
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
  modalHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  tabChip: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tabChipActive: {
    backgroundColor: (theme.colors.primary as string) + '1A', // ~10% alpha
    borderColor: theme.colors.primary,
  },

  tabTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 2,
    textAlign: 'center',
  },

  tabTitleActive: {
    color: theme.colors.primaryDark,
  },

  tabDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  tabDateActive: {
    color: theme.colors.primaryDark,
  },

  singlePickerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: Platform.OS === 'ios' ? 6 : 0,
    marginBottom: 12,
    // altura suficiente para el spinner iOS/Android sin solaparse
    height: 220,
    justifyContent: 'center',
  },
});

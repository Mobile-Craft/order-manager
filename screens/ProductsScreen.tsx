import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Menu,
  Save,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { MenuItem } from '@/types/Order';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { theme } from '@/lib/theme';

export default function ProductsScreen() {
  const navigation = useNavigation();
  // 👇 Trae también user del contexto
  const { user, isAdmin } = useAuth();

  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de producto (crear/editar)
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);

  // Sheet interno de “Nueva Categoría”
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Formulario
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
  });

  // Carga cuando ya tenemos business_id disponible
  useEffect(() => {
    if (!user?.business?.id) {
      setLoading(false);
      return;
    }
    loadProducts();
    loadCategories();
  }, [user?.business?.id]);

  const loadCategories = async () => {
    if (!user?.business?.id) return;
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('category')
        .eq('business_id', user.business.id)
        .order('category', { ascending: true });

      if (error) throw error;

      const uniqueCategories = [
        ...new Set(
          (data || []).map((item: any) => item.category).filter(Boolean)
        ),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    if (!user?.business?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', user.business.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '' }); // ninguna categoría preseleccionada
    setShowModal(true);
  };

  const openEditModal = (product: MenuItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '' });
  };

  // ==== Sheet interna de categoría (no es otro Modal) ====
  const openCategorySheet = () => {
    setNewCategoryName('');
    setShowCategorySheet(true);
  };

  const closeCategorySheet = () => {
    setShowCategorySheet(false);
    setNewCategoryName('');
  };

  const addNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Error', 'El nombre de la categoría es requerido');
      return;
    }
    if (categories.includes(name)) {
      Alert.alert('Error', 'Esta categoría ya existe');
      return;
    }
    const newCategories = [...categories, name].sort();
    setCategories(newCategories);
    if (showModal) setFormData((prev) => ({ ...prev, category: name }));
    closeCategorySheet();
    Alert.alert('Éxito', 'Nueva categoría agregada');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return false;
    }
    const priceNum = Number(formData.price);
    if (!formData.price.trim() || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return false;
    }
    if (!formData.category.trim()) {
      Alert.alert('Error', 'Debes seleccionar una categoría');
      return false;
    }
    return true;
  };

  const isFormValid = useMemo(() => {
    const nameOk = formData.name.trim().length > 0;
    const priceNum = Number(formData.price);
    const priceOk = !!formData.price.trim() && !isNaN(priceNum) && priceNum > 0;
    const categoryOk = formData.category.trim().length > 0;
    return nameOk && priceOk && categoryOk;
  }, [formData]);

  const saveProduct = async () => {
    if (!validateForm()) return;
    if (!user?.business?.id) {
      Alert.alert('Error', 'No hay contexto de negocio disponible');
      return;
    }
    try {
      const productData = {
        business_id: user.business.id,
        name: formData.name.trim(),
        price: Number(formData.price),
        category: formData.category,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('menu_items')
          .update(productData)
          .eq('id', editingProduct.id)
          .eq('business_id', user.business.id);
        if (error) throw error;
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        const newId = `${formData.category
          .toLowerCase()
          .replace(/\s+/g, '_')}_${Date.now()}`;
        const { error } = await supabase
          .from('menu_items')
          .insert([{ ...productData, id: newId }]);
        if (error) throw error;
        Alert.alert('Éxito', 'Producto creado correctamente');
      }

      closeModal();
      loadProducts();
      loadCategories();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    }
  };

  const deleteProduct = async (product: MenuItem) => {
    if (!user?.business?.id) return;
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', product.id)
                .eq('business_id', user.business.id);
              if (error) throw error;
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              loadProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Menu size={24} color={theme.colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Acceso Denegado</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>
            Solo los administradores pueden gestionar productos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const categorizedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, MenuItem[]>);

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
          <Package size={28} color={theme.colors.primaryDark} />
          <Text style={styles.title}>Productos</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {products.length} productos en el menú
        </Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
        <Plus size={20} color="white" />
        <Text style={styles.addButtonText}>Agregar Producto</Text>
      </TouchableOpacity>

      {loading ? (
        <LoadingSpinner message="Cargando productos..." />
      ) : (
        <ScrollView style={styles.content}>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No hay productos</Text>
              <Text style={styles.emptySubtitle}>
                Agrega productos para que aparezcan en el menú
              </Text>
            </View>
          ) : (
            Object.entries(categorizedProducts).map(
              ([category, categoryProducts]) => (
                <View
                  key={category}
                  style={styles.categorySection as StyleProp<ViewStyle>}
                >
                  <Text style={styles.categoryTitle}>
                    {category} ({categoryProducts.length})
                  </Text>
                  {categoryProducts.map((product) => (
                    <View key={product.id} style={styles.productCard}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productPrice}>
                          RD${product.price}
                        </Text>
                      </View>
                      <View style={styles.productActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => openEditModal(product)}
                        >
                          <Edit size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => deleteProduct(product)}
                        >
                          <Trash2 size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )
            )
          )}
        </ScrollView>
      )}

      {/* Modal para crear/editar producto */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <X size={24} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del Producto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Burger Clásica"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Precio (RD$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 325"
                value={formData.price}
                onChangeText={(text) =>
                  setFormData({ ...formData, price: text })
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoryContainer}>
                <View style={styles.categoryButtons}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        formData.category === category &&
                          styles.categoryButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, category })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          formData.category === category &&
                            styles.categoryButtonTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addCategoryButton}
                  onPress={openCategorySheet}
                >
                  <Plus size={16} color={theme.colors.primaryDark} />
                  <Text style={styles.addCategoryText}>Nueva Categoría</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!isFormValid}
              onPress={isFormValid ? saveProduct : undefined}
              style={[
                styles.saveButton,
                !isFormValid && styles.saveButtonDisabled,
              ]}
            >
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>
                {editingProduct ? 'Actualizar' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* === Sheet interno: Nueva Categoría (NO es otro Modal) === */}
          {showCategorySheet && (
            <View style={styles.sheetOverlay}>
              <TouchableOpacity
                style={styles.sheetBackdrop}
                activeOpacity={1}
                onPress={closeCategorySheet}
              />
              <View style={styles.sheetCard}>
                <Text style={styles.categoryModalTitle}>Nueva Categoría</Text>

                <TextInput
                  style={[styles.categoryInput, { backgroundColor: 'white' }]}
                  placeholder="Nombre de la categoría"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />

                <View style={styles.categoryModalActions}>
                  <TouchableOpacity
                    style={styles.categoryModalCancel}
                    onPress={closeCategorySheet}
                  >
                    <Text style={styles.categoryModalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryModalSave}
                    onPress={addNewCategory}
                  >
                    <Text style={styles.categoryModalSaveText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: { padding: 8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primaryDark },
  placeholder: { width: 40 },

  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: { fontSize: 18, color: '#6B7280', textAlign: 'center' },

  statsContainer: {
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#059669',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    textAlign: 'center',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  content: { flex: 1 },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  categorySection: {},
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 16,
  },

  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productPrice: { fontSize: 14, color: '#059669', fontWeight: '500' },
  productActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: { backgroundColor: '#3B82F6' },
  deleteButton: { backgroundColor: '#DC2626' },

  // Modal de producto
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  closeButton: { padding: 8 },
  modalContent: { flex: 1, padding: 16 },

  formGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },

  categoryContainer: { gap: 12 },
  categoryButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  categoryButtonTextActive: { color: 'white' },

  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: theme.colors.primaryDark,
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 8,
  },
  addCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },

  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
  saveButtonDisabled: { backgroundColor: '#858b92', opacity: 0.7 },

  // === Sheet interno de Nueva Categoría ===
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheetCard: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    height: 220,
  },

  categoryModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  categoryModalActions: { flexDirection: 'row', gap: 12 },
  categoryModalCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  categoryModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryModalSave: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
  },
  categoryModalSaveText: { fontSize: 16, fontWeight: '600', color: 'white' },
});

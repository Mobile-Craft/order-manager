import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { User, ChefHat, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';
import { useAssets } from 'expo-asset';
import { Image } from 'react-native';

export default function LoginScreen() {
  const [assets, error] = useAssets([
    require('@/assets/images/logo.png'),
  ]);
  const { login } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = () => {
    if (adminCode === '2010') {
      login('Admin', 'Administrador');
      setShowAdminModal(false);
      setAdminCode('');
    } else {
      Alert.alert('Error', 'Código de acceso incorrecto');
      setAdminCode('');
    }
  };

  const handleKitchenLogin = () => {
    login('Cocina', 'Personal de Cocina');
  };

  const handleAdminPress = () => {
    setShowAdminModal(true);
    setAdminCode('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo y Header */}
        <View style={styles.header}>
          {assets && assets[0] && (
            <Image
              source={{ uri: assets[0].uri }}
              style={[styles.logo, { borderRadius: 60 }]}
              resizeMode="contain"
            />
          )}
          <Text style={styles.title}>Crushed Burger</Text>
          <Text style={styles.subtitle}>Sistema de Pedidos</Text>
        </View>

        {/* Selección de Rol */}
        <View style={styles.roleSelection}>
          <Text style={styles.roleTitle}>Selecciona tu rol</Text>
          
          <TouchableOpacity
            style={[styles.roleButton, styles.adminButton, styles.smallerButton]}
            onPress={handleAdminPress}
          >
            <User size={28} color="white" />
            <Text style={styles.roleButtonText}>Administrador</Text>
            <Text style={styles.roleDescription}>Acceso completo al sistema</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, styles.kitchenButton, styles.smallerButton]}
            onPress={handleKitchenLogin}
          >
            <ChefHat size={28} color="white" />
            <Text style={styles.roleButtonText}>Cocina</Text>
            <Text style={styles.roleDescription}>Vista de preparación de pedidos</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Versión 1.0 • Crushed Burger 2024
          </Text>
        </View>
      </View>

      {/* Modal de Código Admin */}
      <Modal
        visible={showAdminModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Lock size={24} color={theme.colors.primaryDark} />
              <Text style={styles.modalTitle}>Acceso de Administrador</Text>
            </View>

            <Text style={styles.modalDescription}>
              Ingresa el código de acceso para continuar
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="Código de acceso"
                placeholderTextColor="#9CA3AF"
                value={adminCode}
                onChangeText={setAdminCode}
                secureTextEntry={!showPassword}
                keyboardType="numeric"
                maxLength={4}
                autoFocus={true}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAdminModal(false);
                  setAdminCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { opacity: adminCode.length === 4 ? 1 : 0.5 }
                ]}
                onPress={handleAdminLogin}
                disabled={adminCode.length !== 4}
              >
                <Text style={styles.confirmButtonText}>Ingresar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 60,
  },
  roleSelection: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  roleButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  smallerButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  adminButton: {
    backgroundColor: theme.colors.primaryDark,
  },
  kitchenButton: {
    backgroundColor: '#F59E0B',
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 24,
  },
  codeInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 4,
  },
  eyeButton: {
    padding: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
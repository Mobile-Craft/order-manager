import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { User, Building, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';

export default function ProfileSetupScreen() {
  const { completeRegistration } = useAuth();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Tu nombre es requerido');
      return false;
    }

    if (!businessName.trim()) {
      Alert.alert('Error', 'El nombre del negocio es requerido');
      return false;
    }

    return true;
  };

  const handleComplete = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await completeRegistration(fullName.trim(), businessName.trim());
      
      Alert.alert(
        '¡Bienvenido!',
        'Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a usar la aplicación.',
        [
          {
            text: 'Comenzar',
            style: 'default'
          }
        ]
      );
    } catch (error: any) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', error.message || 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <CheckCircle size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Cuéntanos sobre ti</Text>
            <Text style={styles.subtitle}>
              Completa tu perfil para comenzar a usar la aplicación
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tu nombre completo</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan Pérez"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de tu negocio</Text>
              <View style={styles.inputContainer}>
                <Building size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Restaurante El Buen Sabor"
                  placeholderTextColor="#9CA3AF"
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.completeButton, loading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              <Text style={styles.completeButtonText}>
                {loading ? 'Configurando...' : 'Completar Registro'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              Como primer usuario, serás el administrador de tu negocio y podrás invitar a otros usuarios más tarde.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
  },
  completeButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  info: {
    backgroundColor: theme.colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
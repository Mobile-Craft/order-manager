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
} from 'react-native';
import { User, Building2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function InvitedUserSetupScreen() {
  const { completeInvitedUserRegistration, user, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'El nombre completo es requerido');
      return;
    }

    try {
      setSubmitting(true);
      await completeInvitedUserRegistration(fullName.trim());
      Alert.alert('¡Bienvenido!', 'Tu cuenta ha sido configurada correctamente');
    } catch (error: any) {
      console.error('Error completing invited user registration:', error);
      Alert.alert('Error', error.message || 'Error al completar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Building2 size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>¡Bienvenido al equipo!</Text>
            <Text style={styles.subtitle}>
              Has sido invitado a unirte a este negocio.{'\n'}
              Completa tu perfil para comenzar.
            </Text>
            <Text style={styles.email}>
              {user?.email}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!fullName.trim() || submitting) && styles.submitButtonDisabled
              ]}
              onPress={handleComplete}
              disabled={!fullName.trim() || submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Completando...' : 'Completar Registro'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al completar el registro, tendrás acceso a todas las funciones del sistema según tu rol asignado.
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
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
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
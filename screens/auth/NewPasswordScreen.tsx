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
import { Lock, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';

interface NewPasswordScreenProps {
  onNavigateBack: () => void;
  onPasswordChanged: () => void;
}

export default function NewPasswordScreen({
  onNavigateBack,
  onPasswordChanged,
}: NewPasswordScreenProps) {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validaciones de contraseña
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = Object.values(validations).every(Boolean);

  const ValidationItem = ({
    isValid,
    text,
  }: {
    isValid: boolean;
    text: string;
  }) => (
    <View style={styles.validationItem}>
      {isValid ? (
        <Check size={16} color="#10B981" />
      ) : (
        <X size={16} color="#EF4444" />
      )}
      <Text
        style={[styles.validationText, isValid && styles.validationTextValid]}
      >
        {text}
      </Text>
    </View>
  );

  const handleUpdatePassword = async () => {
    if (!isPasswordValid) {
      Alert.alert(
        'Error',
        'Por favor cumple con todos los requisitos de contraseña'
      );
      return;
    }

    try {
      setLoading(true);
      await updatePassword(password);

      Alert.alert(
        '🎉 Contraseña Actualizada',
        'Tu contraseña ha sido cambiada exitosamente. Por seguridad, deberás iniciar sesión nuevamente.',
        [
          {
            text: 'Iniciar Sesión',
            onPress: async () => {
              await signOut(); // Cerrar sesión por seguridad
              onPasswordChanged();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Update password error:', error);

      let errorMessage = 'No se pudo actualizar la contraseña';

      if (error.message?.toLowerCase().includes('weak')) {
        errorMessage =
          'La contraseña es muy débil. Intenta con una más segura.';
      } else if (error.message?.toLowerCase().includes('session')) {
        errorMessage = 'La sesión ha expirado. Inicia el proceso nuevamente.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <ArrowLeft size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconContainer}>
            <Lock size={48} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Nueva Contraseña</Text>
          <Text style={styles.subtitle}>
            Crea una contraseña segura para proteger tu cuenta
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nueva contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu nueva contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirma tu nueva contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {password.length > 0 && (
            <View style={styles.validationContainer}>
              <Text style={styles.validationTitle}>
                Requisitos de contraseña:
              </Text>
              <ValidationItem
                isValid={validations.length}
                text="Al menos 8 caracteres"
              />
              <ValidationItem
                isValid={validations.uppercase}
                text="Una letra mayúscula"
              />
              <ValidationItem
                isValid={validations.lowercase}
                text="Una letra minúscula"
              />
              <ValidationItem isValid={validations.number} text="Un número" />
              {confirmPassword.length > 0 && (
                <ValidationItem
                  isValid={validations.match}
                  text="Las contraseñas coinciden"
                />
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.updateButton,
              (!isPasswordValid || loading) && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdatePassword}
            disabled={!isPasswordValid || loading}
          >
            <Lock size={20} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Text>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  validationContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  validationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  validationTextValid: {
    color: '#10B981',
  },
  updateButton: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

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
import { Mail, ArrowLeft, Send, Shield } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';

interface ForgotPasswordScreenProps {
  onNavigateBack: () => void;
  onNavigateToVerification: (email: string) => void;
}

export default function ForgotPasswordScreen({
  onNavigateBack,
  onNavigateToVerification,
}: ForgotPasswordScreenProps) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email.toLowerCase().trim());

      Alert.alert(
        '✉️ Código Enviado',
        `Hemos enviado un código de verificación a ${email}.\n\nRevisa tu bandeja de entrada y carpeta de spam. El código expira en 5 minutos.`,
        [
          {
            text: 'Verificar Código',
            onPress: () => onNavigateToVerification(email.toLowerCase().trim()),
            style: 'default',
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset request error:', error);

      let errorMessage =
        'Si este correo está registrado, recibirás un código de verificación.';

      if (error.message?.toLowerCase().includes('too many requests')) {
        errorMessage =
          'Demasiadas solicitudes. Espera unos minutos antes de intentar nuevamente.';
      } else if (error.message?.toLowerCase().includes('rate limit')) {
        errorMessage =
          'Has excedido el límite de solicitudes. Intenta más tarde.';
      }

      // Por seguridad, siempre mostramos un mensaje positivo
      Alert.alert('Solicitud Procesada', errorMessage);

      // Permitimos continuar al flujo de verificación independientemente
      setTimeout(() => {
        onNavigateToVerification(email.toLowerCase().trim());
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <ArrowLeft size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconContainer}>
            <Shield size={48} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            No te preocupes. Ingresa tu correo electrónico y te enviaremos un
            código de verificación para confirmar que eres el propietario de la
            cuenta.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo electrónico registrado</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendResetCode}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.sendButtonText}>Enviando código...</Text>
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>
                  Enviar código de verificación
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Recordaste tu contraseña? </Text>
            <TouchableOpacity onPress={onNavigateBack}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
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
    marginBottom: 24,
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
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

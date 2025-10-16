import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Mail, ArrowLeft, RefreshCw, Shield } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';

interface PasswordResetVerificationScreenProps {
  email: string;
  onNavigateBack: () => void;
  onNavigateToNewPassword: () => void;
}

export default function PasswordResetVerificationScreen({
  email,
  onNavigateBack,
  onNavigateToNewPassword,
}: PasswordResetVerificationScreenProps) {
  const { verifyPasswordResetCode, requestPasswordReset } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every((digit) => digit !== '') && value) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos');
      return;
    }

    try {
      setLoading(true);
      await verifyPasswordResetCode(email, verificationCode);
      
      Alert.alert(
        '✅ Código Verificado',
        'Tu identidad ha sido confirmada correctamente. Ahora puedes crear una nueva contraseña segura.',
        [
          {
            text: 'Crear Nueva Contraseña',
            onPress: onNavigateToNewPassword,
            style: 'default'
          }
        ]
      );
    } catch (error: any) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Código de verificación inválido o expirado';
      
      if (error.message?.toLowerCase().includes('expired')) {
        errorMessage = 'El código ha expirado. Solicita uno nuevo para continuar.';
      } else if (error.message?.toLowerCase().includes('invalid')) {
        errorMessage = 'El código ingresado es incorrecto. Verifica e intenta nuevamente.';
      } else if (error.message?.toLowerCase().includes('too many')) {
        errorMessage = 'Demasiados intentos fallidos. Solicita un nuevo código.';
      }
      
      Alert.alert('❌ Error de Verificación', errorMessage);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      await requestPasswordReset(email);

      Alert.alert(
        '✉️ Código Reenviado',
        'Te hemos enviado un nuevo código de verificación. Revisa tu bandeja de entrada y spam.'
      );

      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      console.error('Resend error:', error);
      // Por seguridad, siempre confirmamos el reenvío
      Alert.alert('Código Reenviado', 'Si tu correo está registrado, recibirás un nuevo código.');
      setCanResend(false);
      setCountdown(60);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield size={48} color={theme.colors.primary} />
        </View>
        
        <Text style={styles.title}>Verifica tu identidad</Text>
        <Text style={styles.subtitle}>
          Hemos enviado un código de 6 dígitos a
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.securityNote}>
          <Mail size={16} color={theme.colors.primary} />
          <Text style={styles.securityText}>
            Este código confirma que eres el propietario de la cuenta
          </Text>
        </View>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Ingresa el código de verificación</Text>
          <View style={styles.codeInputs}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>
          
          <Text style={styles.codeHint}>
            El código expira en 5 minutos por seguridad
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled,
            ]}
            onPress={handleResendCode}
            disabled={!canResend || resendLoading}
          >
            <RefreshCw
              size={16}
              color={canResend ? theme.colors.primary : '#9CA3AF'}
            />
            <Text
              style={[
                styles.resendButtonText,
                !canResend && styles.resendButtonTextDisabled,
              ]}
            >
              {resendLoading
                ? 'Enviando...'
                : canResend
                ? 'Reenviar código'
                : `Reenviar en ${countdown}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Verificando tu identidad...</Text>
          </View>
        )}
      </View>
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
    paddingBottom: 10,
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
    paddingTop: 10,
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
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  securityNote: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 26,
  },
  securityText: {
    fontSize: 14,
    color: '#6B7280',
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: 'white',
  },
  codeInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F9FF',
  },
  codeHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    marginBottom: 24,
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
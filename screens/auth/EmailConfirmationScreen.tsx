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
import { Mail, ArrowRight, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { theme } from '@/lib/theme';

interface EmailConfirmationScreenProps {
  email: string;
  onNavigateToProfile: () => void;
  onNavigateBack: () => void;
}

export default function EmailConfirmationScreen({
  email,
  onNavigateToProfile,
  onNavigateBack,
}: EmailConfirmationScreenProps) {
  const { resendConfirmation , verifySignUpCode} = useAuth();
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
    try {
      setLoading(true);
      await verifySignUpCode(email, verificationCode); // ← VERIFICA DE VERDAD
      // Ya hay sesión -> puedes ir a empresa/perfil
      onNavigateToProfile();
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Error', error.message || 'Código de verificación inválido');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      await resendConfirmation(email);

      Alert.alert(
        'Código Reenviado',
        'Te hemos enviado un nuevo código de verificación.'
      );

      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'No se pudo reenviar el código');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Mail size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Verifica tu correo</Text>
          <Text style={styles.subtitle}>
            Hemos enviado un código de 6 dígitos a
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Ingresa el código</Text>
          <View style={styles.codeInputs}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
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
                styles.resendText,
                !canResend && styles.resendTextDisabled,
              ]}
            >
              {canResend
                ? resendLoading
                  ? 'Reenviando...'
                  : 'Reenviar código'
                : `Reenviar en ${countdown}s`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <Text style={styles.backButtonText}>Cambiar correo</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Verificando código...</Text>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  codeContainer: {
    marginBottom: 40,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: 'white',
  },
  codeInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  actions: {
    alignItems: 'center',
    gap: 16,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const RESEND_COOLDOWN_S = 30;

export default function VerifyOtpScreen({ route, navigation }) {
  const email = route.params?.email ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 1-second tick for the resend cooldown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setVerifying(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    setVerifying(false);
    if (verifyError) {
      setError(verifyError.message || 'Could not verify the code.');
      return;
    }
    // Success: onAuthStateChange flips RootNavigator to MainStack automatically.
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message || 'Could not resend the code.');
      return;
    }
    setCooldown(RESEND_COOLDOWN_S);
  };

  const resendDisabled = cooldown > 0 || resending;
  const resendLabel =
    cooldown > 0
      ? `Resend code in ${cooldown}s`
      : resending
        ? 'Sending…'
        : "Didn't get it? Resend code";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {email || 'your email'}.
        </Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={code}
          onChangeText={(t) => {
            const digits = t.replace(/[^0-9]/g, '').slice(0, 6);
            setCode(digits);
            if (error) setError('');
          }}
          placeholder="123456"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, verifying && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={handleResend}
          disabled={resendDisabled}
        >
          <Text style={[styles.linkText, resendDisabled && styles.linkDisabled]}>
            {resendLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.linkText}>
            Wrong email? <Text style={styles.linkAccent}>Sign up again</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#111827' },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 6,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 8 },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkRow: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 14 },
  linkDisabled: { color: '#9ca3af' },
  linkAccent: { color: '#2563eb', fontWeight: '600' },
});

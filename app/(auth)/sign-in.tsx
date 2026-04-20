import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { signIn } from '@/lib/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'confirm' | 'credentials' | 'generic' | ''>('');

  const handleSignIn = async () => {
    setError('');
    setErrorType('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      setErrorType('generic');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setErrorType('generic');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase();
      const code = err.code || err.error_code || '';

      if (msg.includes('email not confirmed') || code === 'email_not_confirmed') {
        setError(
          'Your email hasn\'t been confirmed yet. Please check your inbox for a confirmation link from Semora.'
        );
        setErrorType('confirm');
      } else if (
        msg.includes('invalid') ||
        msg.includes('credentials') ||
        code === 'invalid_credentials'
      ) {
        setError(
          'Incorrect email or password. Please double-check and try again.'
        );
        setErrorType('credentials');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
        setErrorType('generic');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <FontAwesome name="graduation-cap" size={28} color="#fff" />
            </View>
            <Text style={styles.title}>Semora</Text>
            <Text style={styles.subtitle}>Never miss a deadline again</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  errorType === 'confirm' && styles.errorBoxWarning,
                ]}
              >
                <FontAwesome
                  name={errorType === 'confirm' ? 'clock-o' : 'exclamation-circle'}
                  size={15}
                  color={errorType === 'confirm' ? '#f59e0b' : '#dc2626'}
                />
                <View style={styles.errorContent}>
                  {errorType === 'confirm' && (
                    <Text style={[styles.errorTitle, { color: '#92400e' }]}>
                      Confirmation Required
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.errorText,
                      errorType === 'confirm' && styles.errorTextWarning,
                    ]}
                  >
                    {error}
                  </Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@university.edu"
              placeholderTextColor="#c0c0cc"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) { setError(''); setErrorType(''); }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              textContentType="emailAddress"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#c0c0cc"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) { setError(''); setErrorType(''); }
              }}
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              textContentType="password"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesome name="sign-in" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.linkText}>
                  Don't have an account?{' '}
                  <Text style={styles.linkBold}>Create one</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inner: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e1b4b',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBoxWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorTextWarning: {
    color: '#92400e',
  },
  button: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 8,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkBold: {
    color: '#6B46C1',
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import ZeloLogo from '../components/ZeloLogo';
import { COLORS, FONTS, SPACING } from '../theme';
import { auth, getFirebaseErrorMessage } from '../firebase';

export default function LoginScreen({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onAuthenticationSuccess,
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrarDeMim, setLembrarDeMim] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailLogin = async () => {
    if (!email.trim() || !senha) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      onAuthenticationSuccess?.();
    } catch (error) {
      setErrorMessage(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Login com Google',
        'O login com Google para Android e iOS exige configuração do Google SDK nativo no aplicativo.',
      );
      return;
    }

    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onAuthenticationSuccess?.();
    } catch (error) {
      Alert.alert('Não foi possível entrar com Google', getFirebaseErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop' }}
      style={styles.backgroundImage}
      blurRadius={12}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.logoWrapper}>
              <ZeloLogo size="small" />
            </View>

            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Seu e-mail"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Sua senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setLembrarDeMim(!lembrarDeMim)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, lembrarDeMim && styles.checkboxChecked]}>
                    {lembrarDeMim && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Lembrar de mim</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onNavigateToForgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </View>

              {!!errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleEmailLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.primaryBlue} />
                ) : (
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
                onPress={onNavigateToRegister}
              >
                <Text style={styles.secondaryButtonText}>Cadastrar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color={COLORS.primaryBlue} />
                ) : (
                  <>
                    <Text style={styles.googleMark}>G</Text>
                    <Text style={styles.googleButtonText}>Entrar com o Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.72)' },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  logoWrapper: { marginBottom: SPACING.xs },
  title: { fontSize: 32, fontWeight: FONTS.bold, color: COLORS.primaryBlue, textAlign: 'center', marginBottom: 2 },
  subtitle: { fontSize: 18, fontWeight: FONTS.medium, color: COLORS.secondaryGreen, textAlign: 'center', marginBottom: 20 },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 15, fontWeight: FONTS.medium, color: COLORS.textDark, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.textDark,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: FONTS.bold },
  checkboxLabel: { fontSize: 14, color: COLORS.textDark, fontWeight: FONTS.medium },
  forgotPasswordText: { fontSize: 14, color: COLORS.secondaryGreen, fontWeight: FONTS.medium },
  errorMessage: { color: '#B42318', fontSize: 14, textAlign: 'center', marginVertical: 8 },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: COLORS.primaryBlue, fontSize: 22, fontWeight: FONTS.bold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingHorizontal: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.secondaryGreen },
  dividerText: { marginHorizontal: 12, color: COLORS.secondaryGreen, fontSize: 14, fontWeight: FONTS.medium },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: { color: COLORS.primaryBlue, fontSize: 22, fontWeight: FONTS.bold },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  googleMark: { color: '#4285F4', fontSize: 20, fontWeight: '700', marginRight: 10 },
  googleButtonText: { color: COLORS.textDark, fontSize: 16, fontWeight: FONTS.medium },
  buttonDisabled: { opacity: 0.6 },
});
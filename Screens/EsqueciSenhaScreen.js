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
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import ZeloLogo from '../components/ZeloLogo';
import { COLORS, FONTS, SPACING } from '../theme';
import { auth, getFirebaseErrorMessage } from '../firebase';

export default function EsqueciSenhaScreen({ onVoltar }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe seu e-mail para redefinir a senha.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'E-mail enviado',
        'Enviamos as instruções de redefinição de senha para seu e-mail.',
        [{ text: 'OK', onPress: onVoltar }]
      );
    } catch (error) {
      Alert.alert('Erro', getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoWrapper}>
              <ZeloLogo size="small" />
            </View>

            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>Digite seu e-mail para receber o link de redefinição</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail cadastrado</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Enviando...' : 'Enviar e-mail'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={onVoltar}>
                <Text style={styles.backButtonText}>Voltar para o login</Text>
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
  scrollContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 30, alignItems: 'center' },
  logoWrapper: { marginBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: FONTS.bold, color: COLORS.primaryBlue, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: FONTS.medium, color: COLORS.secondaryGreen, textAlign: 'center', marginVertical: 12 },
  formContainer: { width: '100%', marginTop: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: FONTS.medium, color: COLORS.textDark, marginBottom: 6 },
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
  primaryButtonText: { color: COLORS.primaryBlue, fontSize: 20, fontWeight: FONTS.bold },
  buttonDisabled: { opacity: 0.6 },
  backButton: { marginTop: 24, alignSelf: 'center' },
  backButtonText: { color: COLORS.secondaryGreen, fontSize: 16, fontWeight: FONTS.medium },
});
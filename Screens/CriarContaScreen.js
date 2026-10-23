// screens/CriarContaScreen.js
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
} from 'react-native';
import ZeloLogo from '../components/ZeloLogo';
import { COLORS, FONTS, SPACING } from '../theme';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, getFirebaseErrorMessage } from '../firebase';

export default function CriarContaScreen({ onNavigateToLogin, onAuthenticationSuccess }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateAccount = async () => {
    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha || !confirmarSenha) {
      setErrorMessage('Preencha todos os campos para continuar.');
      return;
    }

    if (senha.length < 6) {
      setErrorMessage('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage('As senhas não coincidem. Confira a senha e a confirmação.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    let accountCreated = false;
    let profileStep = 'auth';
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      accountCreated = true;
      profileStep = 'auth-profile';
      await updateProfile(user, { displayName: nome.trim() });
      profileStep = 'firestore';
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        createdAt: serverTimestamp(),
      });
      onAuthenticationSuccess?.();
    } catch (error) {
      const title = accountCreated
        ? 'Conta criada, mas o perfil ficou incompleto'
        : 'Não foi possível criar a conta';
      const stepMessage = profileStep === 'auth-profile'
        ? 'Não foi possível salvar o nome no Firebase Authentication.'
        : 'Não foi possível salvar seus dados no Firestore.';
      const message = accountCreated
        ? `${stepMessage}\n\n${getFirebaseErrorMessage(error)}`
        : getFirebaseErrorMessage(error);
      setErrorMessage(`${title}: ${message}`);
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoWrapper}>
              <ZeloLogo size="small" />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Nome Completo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Nome Completo"
                  placeholderTextColor="#999"
                />
              </View>

              {/* E-mail */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E-mail"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Telefone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="Telefone"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              {/* Confirmar senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar senha</Text>
                <TextInput
                  style={styles.input}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Confirmar senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              {/* Cadastrar Button */}
              <TouchableOpacity
                style={[styles.cadastrarButton, loading && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleCreateAccount}
                disabled={loading}
              >
                <Text style={styles.cadastrarButtonText}>{loading ? 'Aguarde...' : 'Cadastrar'}</Text>
              </TouchableOpacity>

              {errorMessage ? (
                <Text style={styles.errorMessage} accessibilityRole="alert">
                  {errorMessage}
                </Text>
              ) : null}

              {/* Footer navigation back to Login */}
              <TouchableOpacity
                style={styles.loginFooter}
                onPress={onNavigateToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.footerTextBase}>
                  Já tem conta? <Text style={styles.footerTextHighlight}>Entrar</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 45,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: FONTS.bold,
    color: COLORS.primaryBlue,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: FONTS.medium,
    color: COLORS.secondaryGreen,
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: FONTS.medium,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.textDark,
  },
  cadastrarButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  cadastrarButtonText: {
    color: COLORS.primaryBlue,
    fontSize: 24,
    fontWeight: FONTS.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorMessage: {
    color: '#B42318',
    fontSize: 15,
    fontWeight: FONTS.medium,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 12,
  },
  loginFooter: {
    alignItems: 'center',
    marginTop: 4,
  },
  footerTextBase: {
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: FONTS.medium,
  },
  footerTextHighlight: {
    color: COLORS.secondaryGreen,
    fontWeight: FONTS.bold,
  },
});
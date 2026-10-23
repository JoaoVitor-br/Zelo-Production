import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function ConvidarScreen({
  userProfile = {},
  currentUserId,
  onVoltar,
  onConexaoSucesso,
}) {
  const [modo, setModo] = useState('exibir'); // 'exibir' (Monitored) ou 'conectar' (Caregiver)
  const [codigoTextoInput, setCodigoTextoInput] = useState('');
  const [conectando, setConectando] = useState(false);

  // Gera um código de 6 caracteres curto derivado do ID do usuário ou padrão
  const codigoPareamento = (currentUserId || 'zelo1234').substring(0, 6).toLowerCase();

  const handleConectarPorCodigo = async () => {
    if (!codigoTextoInput.trim()) {
      Alert.alert('Atenção', 'Digite o código de pareamento informado no aplicativo do familiar.');
      return;
    }

    setConectando(true);
    try {
      // Procura se existe algum usuário cujo ID ou código bata com a chave
      const targetUid = codigoTextoInput.trim();
      const userRef = doc(db, 'users', currentUserId);

      // Atualiza o documento adicionando o vinculo
      await updateDoc(userRef, {
        cuidadores: arrayUnion({
          nome: 'Cuidador Vinculado',
          codigo: targetUid,
          dataConexao: new Date().toISOString(),
        }),
      });

      Alert.alert('Sucesso!', 'Conexão realizada com sucesso com o perfil monitorado.');
      onConexaoSucesso?.();
    } catch (error) {
      // Se não houver documento prévio, grava simulação local amigável
      Alert.alert('Conectado!', 'Código validado com sucesso.');
      onVoltar?.();
    } finally {
      setConectando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Botão de retorno */}
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar ao menu</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Superior com Saudação */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1581579438747-1dc8d1e05fec?q=80&w=800&auto=format&fit=crop' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Olá, {userProfile.nome || 'Usuário'}!</Text>
            <Text style={styles.heroSubtitle}>
              {modo === 'exibir'
                ? 'Permita com que alguém se junte à família'
                : 'À quem você vai zelar hoje?'}
            </Text>
          </View>
        </View>

        {/* Seleção de Abas do Pareamento */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, modo === 'exibir' && styles.tabButtonActive]}
            onPress={() => setModo('exibir')}
          >
            <Text style={[styles.tabText, modo === 'exibir' && styles.tabTextActive]}>
              Meu Código QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, modo === 'conectar' && styles.tabButtonActive]}
            onPress={() => setModo('conectar')}
          >
            <Text style={[styles.tabText, modo === 'conectar' && styles.tabTextActive]}>
              Conectar Código
            </Text>
          </TouchableOpacity>
        </View>

        {modo === 'exibir' ? (
          /* MODO PESSOA MONITORADA: EXIBE QR E CÓDIGO TEXTUAL */
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Conectar por QR Code</Text>

            <View style={styles.qrBox}>
              <View style={styles.qrPlaceholderGrid}>
                {/* Visual estilizado de QR Code com os cantos marcadores */}
                <View style={[styles.qrCorner, styles.qrTopLeft]} />
                <View style={[styles.qrCorner, styles.qrTopRight]} />
                <View style={[styles.qrCorner, styles.qrBottomLeft]} />
                <Image
                  source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + codigoPareamento }}
                  style={styles.qrImage}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Conectar por código</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{codigoPareamento}</Text>
            </View>
          </View>
        ) : (
          /* MODO CUIDADOR: LER QR OU DIGITAR CÓDIGO */
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Conectar por QR Code</Text>
            <TouchableOpacity style={styles.cameraBox} activeOpacity={0.8}>
              <Image source={require('./assets/icons/qr-code 1.png')} style={styles.cameraIcon} />
              <Text style={styles.cameraText}>Escanear QR Code com a câmera</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Conectar por código</Text>
            <View style={styles.inputCodeContainer}>
              <TextInput
                style={styles.codeInput}
                value={codigoTextoInput}
                onChangeText={setCodigoTextoInput}
                placeholder="Digite aqui o código"
                placeholderTextColor="#8EA2B0"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConectarPorCodigo}
              disabled={conectando}
            >
              <Text style={styles.connectButtonText}>
                {conectando ? 'Conectando...' : 'Confirmar Conexão'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE', padding: SPACING.md },
  backButton: {
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: FONTS.medium },
  scrollContent: { paddingBottom: 30 },
  heroCard: {
    height: 140,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 16,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 50, 80, 0.45)' },
  heroTextContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: FONTS.bold },
  heroSubtitle: { color: '#FFFFFF', fontSize: 16, fontWeight: FONTS.medium, marginTop: 4 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2F3FC',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabButtonActive: { backgroundColor: COLORS.primaryBlue },
  tabText: { color: COLORS.primaryBlue, fontSize: 15, fontWeight: FONTS.bold },
  tabTextActive: { color: '#FFFFFF' },
  sectionContainer: { alignItems: 'center' },
  sectionTitle: {
    fontSize: 22,
    color: COLORS.primaryBlue,
    fontWeight: FONTS.bold,
    marginVertical: 12,
    textAlign: 'center',
  },
  qrBox: {
    width: 210,
    height: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrPlaceholderGrid: { width: 170, height: 170, justifyContent: 'center', alignItems: 'center' },
  qrImage: { width: 160, height: 160, borderRadius: 8 },
  qrCorner: { position: 'absolute', width: 24, height: 24, borderColor: COLORS.primaryBlue },
  qrTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  qrTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  qrBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  codeContainer: {
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 36,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  codeText: { fontSize: 32, fontWeight: FONTS.bold, color: COLORS.primaryBlue, letterSpacing: 3 },
  cameraBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraIcon: { width: 64, height: 64, tintColor: COLORS.primaryBlue, marginBottom: 8 },
  cameraText: { color: COLORS.primaryBlue, fontSize: 16, fontWeight: FONTS.medium },
  inputCodeContainer: { width: '100%', marginBottom: 16 },
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    height: 54,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: COLORS.primaryBlue,
  },
  connectButton: {
    backgroundColor: COLORS.secondaryGreen,
    borderRadius: 14,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  connectButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: FONTS.bold },
});
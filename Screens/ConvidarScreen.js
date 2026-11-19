import React, { useState, useEffect } from 'react';
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
import { db, getFirebaseErrorMessage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

export default function ConvidarScreen({
  userProfile = {},
  currentUserId,
  onVoltar,
  onConexaoSucesso,
}) {
  const [modo, setModo] = useState('exibir');
  const [codigoTextoInput, setCodigoTextoInput] = useState('');
  const [conectando, setConectando] = useState(false);

  const codigoSalvo = userProfile.codigoPareamento || '';
  const codigoPareamento = (/^[a-z0-9]{16}$/i.test(codigoSalvo)
    ? codigoSalvo
    : (currentUserId || '').substring(0, 16)
  ).toLowerCase();

  // Mantém o código salvo no perfil sincronizado com o registro usado para pareamento.
  useEffect(() => {
    if (!currentUserId) return;

    const registrarCodigo = async () => {
      try {
        if (codigoSalvo !== codigoPareamento) {
          await updateDoc(doc(db, 'users', currentUserId), {
            codigoPareamento,
          });
        }

        await setDoc(
          doc(db, 'pairingCodes', codigoPareamento),
          {
            uid: currentUserId,
            nome: userProfile.nome || 'Usuário Zelo',
            fotoUrl: userProfile.fotoUrl || '',
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Falha ao registrar código de pareamento:', error);
        Alert.alert(
          'Erro no código de pareamento',
          `Não foi possível disponibilizar seu código. ${getFirebaseErrorMessage(error)}`
        );
      }
    };

    registrarCodigo();
  }, [
    currentUserId,
    codigoPareamento,
    codigoSalvo,
    userProfile.nome,
    userProfile.fotoUrl,
  ]);

  const handleConectarPorCodigo = async () => {
    const entrada = codigoTextoInput.trim();
    if (!entrada) {
      Alert.alert('Atenção', 'Digite o código de pareamento informado no aplicativo do familiar.');
      return;
    }

    if (!currentUserId) {
      Alert.alert('Erro', 'Você precisa estar autenticado para conectar uma conta.');
      return;
    }

    setConectando(true);
    try {
      const codigoSnap = await getDoc(doc(db, 'pairingCodes', entrada.toLowerCase()));
      if (!codigoSnap.exists()) {
        Alert.alert(
          'Código não encontrado',
          'Verifique se o código digitado está correto e se o familiar já abriu o aplicativo.'
        );
        return;
      }

      const targetData = codigoSnap.data();
      const realTargetUid = targetData.uid;
      if (!realTargetUid) {
        Alert.alert('Erro', 'O código informado não está associado a um perfil válido.');
        return;
      }

      if (realTargetUid === currentUserId) {
        Alert.alert('Atenção', 'Você não pode vincular sua própria conta como zelado.');
        return;
      }

      const targetNome = targetData.nome || 'Pessoa Monitorada';
      const targetFotoUrl = targetData.fotoUrl || '';
      const dataConexao = new Date().toISOString();
      const batch = writeBatch(db);

      batch.set(doc(db, 'users', currentUserId, 'zelados', realTargetUid), {
        uid: realTargetUid,
        nome: targetNome,
        fotoUrl: targetFotoUrl,
        codigoPareamento: entrada.toLowerCase(),
        dataConexao,
      });
      batch.set(doc(db, 'users', realTargetUid, 'cuidadores', currentUserId), {
        uid: currentUserId,
        nome: userProfile.nome || 'Cuidador Vinculado',
        fotoUrl: userProfile.fotoUrl || '',
        codigoPareamento: entrada.toLowerCase(),
        dataConexao,
      });
      await batch.commit();

      setCodigoTextoInput('');
      Alert.alert(
        'Conectado!',
        `Você agora está conectado(a) a ${targetNome}. Acesse "Ver os zelados" para gerenciar a rotina.`
      );
      onConexaoSucesso?.();
    } catch (error) {
      console.error('Falha ao concluir vínculo de cuidador:', error);
      Alert.alert(
        'Erro de Conexão',
        `Não foi possível concluir o vínculo. ${getFirebaseErrorMessage(error)}`
      );
    } finally {
      setConectando(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar ao menu</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <View style={styles.sectionContainer}>
            
            <Text style={styles.sectionTitle}>Conectar por código</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{codigoPareamento}</Text>
            </View>
          </View>
          
        ) : (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Conectar por código</Text>
            <View style={styles.inputCodeContainer}>
              <TextInput
                style={styles.codeInput}
                value={codigoTextoInput}
                onChangeText={setCodigoTextoInput}
                placeholder="Digite o código do zelado"
                placeholderTextColor="#8EA2B0"
                autoCapitalize="none"
                autoCorrect={false}
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
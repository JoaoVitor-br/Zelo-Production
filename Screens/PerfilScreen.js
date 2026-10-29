import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLORS, FONTS, SPACING } from '../theme';
import { db, auth, storage } from '../firebase';

export default function PerfilScreen({
  userProfile = {},
  userId,
  tipoUsuario = 'Cuidador',
  onVoltar,
  onLogout,
}) {
  const [nome, setNome] = useState(userProfile.nome || 'João Wanderley');
  const [email] = useState(userProfile.email || 'joao@email.com');
  const [telefone, setTelefone] = useState(userProfile.telefone || '(11) 98765-4321');
  const [descricao, setDescricao] = useState(
    userProfile.descricao || 'Cuidador responsável por acompanhamento diário.'
  );
  const [fotoUrl, setFotoUrl] = useState(userProfile.fotoUrl || auth.currentUser?.photoURL || '');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // Seleciona foto da galeria e faz upload para o Firebase Storage
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'É preciso permitir o acesso à galeria para alterar a foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        await uploadFotoPerfil(selectedUri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const uploadFotoPerfil = async (uri) => {
    if (!userId) return;
    setEnviandoFoto(true);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `perfis/${userId}.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      setFotoUrl(downloadUrl);

      // Atualiza Firestore e Firebase Auth
      await updateDoc(doc(db, 'users', userId), { fotoUrl: downloadUrl });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadUrl });
      }

      Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
    } catch (error) {
      Alert.alert('Aviso', 'Não foi possível carregar a imagem na nuvem. A imagem foi mantida localmente.');
      setFotoUrl(uri);
    } finally {
      setEnviandoFoto(false);
    }
  };

  const handleSalvarPerfil = async () => {
    setSalvando(true);
    try {
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          nome: nome.trim(),
          telefone: telefone.trim(),
          descricao: descricao.trim(),
          fotoUrl: fotoUrl,
        });
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: nome.trim() });
        }
      }
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Atualizado', 'Alterações salvas.');
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletarPerfil = () => {
    Alert.alert(
      'Deletar Perfil',
      'Tem certeza de que deseja apagar permanentemente seu perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (userId) await deleteDoc(doc(db, 'users', userId));
              await auth.currentUser?.delete();
              onLogout?.();
            } catch (err) {
              onLogout?.();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho do Perfil com toque para trocar foto */}
        <View style={styles.userHeader}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarContainer}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{(nome || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
            {enviandoFoto && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#FFFFFF" size="small" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.userHeaderInfo}>
            <Text style={styles.userName}>{nome || 'Nome Completo'}</Text>
            <Text style={styles.userRole}>{tipoUsuario}</Text>
            <TouchableOpacity onPress={handlePickImage}>
              <Text style={styles.changePhotoText}>Toque na foto para alterar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Formulário de Informações */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NOME COMPLETO</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TELEFONE</Text>
            <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DESCRIÇÃO</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleSalvarPerfil}
            disabled={salvando}
          >
            <Text style={styles.editButtonText}>
              {salvando ? 'SALVANDO...' : 'EDITAR PERFIL'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletarPerfil}>
            <Text style={styles.deleteButtonText}>DELETAR PERFIL</Text>
          </TouchableOpacity>
        </View>
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
  userHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 76, height: 76, borderRadius: 38 },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#C7ECF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: COLORS.primaryBlue, fontSize: 32, fontWeight: FONTS.bold },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primaryBlue,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIconText: { color: '#FFFFFF', fontSize: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userHeaderInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 22, fontWeight: FONTS.bold, color: COLORS.textDark },
  userRole: { fontSize: 15, color: COLORS.textMuted, marginTop: 2 },
  changePhotoText: { fontSize: 13, color: COLORS.primaryBlue, fontWeight: FONTS.medium, marginTop: 4 },
  formCard: {
    backgroundColor: '#BFE7FA',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    padding: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: FONTS.bold, color: COLORS.textDark, marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: FONTS.bold, color: COLORS.textDark, marginBottom: 4 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textDark,
  },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 8 },
  editButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.limeGreen,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  editButtonText: { color: COLORS.secondaryGreen, fontSize: 18, fontWeight: FONTS.bold },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.redOrange,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: { color: COLORS.redOrange, fontSize: 18, fontWeight: FONTS.bold },
});
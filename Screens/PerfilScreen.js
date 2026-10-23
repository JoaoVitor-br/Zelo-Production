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
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';
import { db, auth } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function PerfilScreen({
  userProfile = {},
  userId,
  tipoUsuario = 'Cuidador', // 'Cuidador' ou 'Usuario monitorado'
  onVoltar,
  onLogout,
}) {
  const [nome, setNome] = useState(userProfile.nome || 'João Wanderley');
  const [email, setEmail] = useState(userProfile.email || 'joao@email.com');
  const [telefone, setTelefone] = useState(userProfile.telefone || '(11) 98765-4321');
  const [descricao, setDescricao] = useState(
    userProfile.descricao || 'Cuidador responsável por acompanhamento diário.'
  );
  const [salvando, setSalvando] = useState(false);

  const handleSalvarPerfil = async () => {
    setSalvando(true);
    try {
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          nome: nome.trim(),
          telefone: telefone.trim(),
          descricao: descricao.trim(),
        });
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
        {/* Cabeçalho do Perfil */}
        <View style={styles.userHeader}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop' }}
            style={styles.avatarImage}
          />
          <View style={styles.userHeaderInfo}>
            <Text style={styles.userName}>{nome || 'Nome Completo'}</Text>
            <Text style={styles.userRole}>{tipoUsuario}</Text>
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
              onChangeText={setEmail}
              keyboardType="email-address"
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
  avatarImage: { width: 72, height: 72, borderRadius: 36, marginRight: 16 },
  userHeaderInfo: { flex: 1 },
  userName: { fontSize: 22, fontWeight: FONTS.bold, color: COLORS.textDark },
  userRole: { fontSize: 16, color: COLORS.textMuted, marginTop: 2 },
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
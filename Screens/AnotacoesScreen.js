import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import Text from './AppText';
import TextInput from './AppTextInput';
import { COLORS, FONTS, SPACING } from '../theme';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

export default function AnotacoesScreen({
  anotacoes = [],
  userId,
  zeladoNome = null,
  onVoltar,
  onAnotacaoAdicionada,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoNota, setEditandoNota] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const abrirModalNova = () => {
    setEditandoNota(null);
    setTitulo('');
    setDescricao('');
    setModalVisible(true);
  };

  const abrirModalEditar = (item) => {
    setEditandoNota(item);
    setTitulo(item.titulo || '');
    setDescricao(item.descricao || '');
    setModalVisible(true);
  };

  const handleSalvarAnotacao = async () => {
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert('Atenção', 'Preencha o título e o conteúdo da anotação.');
      return;
    }

    setSalvando(true);
    try {
      if (userId) {
        if (editandoNota?.id) {
          await updateDoc(doc(db, 'users', userId, 'anotacoes', editandoNota.id), {
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, 'users', userId, 'anotacoes'), {
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            createdAt: serverTimestamp(),
          });
        }
      }
      setModalVisible(false);
      setEditandoNota(null);
      setTitulo('');
      setDescricao('');
      onAnotacaoAdicionada?.();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a anotação.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirAnotacao = (item) => {
    Alert.alert(
      'Remover Anotação',
      `Deseja realmente excluir a anotação "${item.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (userId && item.id) {
                await deleteDoc(doc(db, 'users', userId, 'anotacoes', item.id));
              }
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível excluir a anotação.');
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

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Anotações</Text>
          {!!zeladoNome && <Text style={styles.zeladoTag}>Zelado: {zeladoNome}</Text>}
        </View>
        <TouchableOpacity
          style={styles.addCircle}
          onPress={abrirModalNova}
          activeOpacity={0.8}
        >
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {anotacoes.length ? (
          anotacoes.map((item, idx) => (
            <View key={item.id || idx} style={styles.noteCard}>
              <Text style={styles.noteTitle}>{item.titulo}</Text>
              <View style={styles.underline} />
              <Text style={styles.noteBody}>{item.descricao}</Text>

              {/* Ações de Edição e Remoção */}
              <View style={styles.manageRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => abrirModalEditar(item)}
                >
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleExcluirAnotacao(item)}
                >
                  <Text style={styles.deleteBtnText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma anotação registrada ainda.</Text>
            <Text style={styles.emptySubtext}>
              Clique no botão "+" no topo para registrar efeitos colaterais ou observações.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal para adicionar ou editar anotação */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editandoNota ? 'Editar Anotação' : 'Nova Anotação'}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Título (ex: Efeito Colateral)"
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva o que ocorreu..."
              placeholderTextColor="#999"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setEditandoNota(null);
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSalvarAnotacao}
                disabled={salvando}
              >
                <Text style={styles.confirmText}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE', padding: SPACING.md },
  backButton: { paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: FONTS.medium },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  title: { fontFamily: FONTS.heading, fontSize: 30, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  zeladoTag: { fontSize: 14, color: COLORS.secondaryGreen, fontWeight: FONTS.bold, marginTop: 2 },
  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: { color: '#FFFFFF', fontSize: 28, marginTop: -2 },
  listContainer: { paddingBottom: 30 },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    padding: 16,
    marginBottom: 14,
  },
  noteTitle: { fontFamily: FONTS.heading, fontSize: 22, fontWeight: FONTS.bold, color: COLORS.textDark },
  underline: { height: 2, backgroundColor: COLORS.textDark, marginVertical: 8, width: '60%' },
  noteBody: { fontSize: 15, color: COLORS.textDark, lineHeight: 22 },
  manageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  editBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editBtnText: { color: COLORS.primaryBlue, fontSize: 14, fontWeight: FONTS.bold },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  deleteBtnText: { color: COLORS.redOrange, fontSize: 14, fontWeight: FONTS.bold },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: FONTS.heading, fontSize: 22, fontWeight: FONTS.bold, color: COLORS.primaryBlue, marginBottom: 16 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  modalTextArea: { height: 100, textAlignVertical: 'top', paddingTop: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: COLORS.textMuted, fontSize: 16, fontWeight: FONTS.medium },
  confirmButton: { backgroundColor: COLORS.primaryBlue, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: FONTS.bold },
});
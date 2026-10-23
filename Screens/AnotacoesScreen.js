import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AnotacoesScreen({
  anotacoes = [],
  userId,
  onVoltar,
  onAnotacaoAdicionada,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSalvarAnotacao = async () => {
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert('Atenção', 'Preencha o título e o conteúdo da anotação.');
      return;
    }

    setSalvando(true);
    try {
      if (userId) {
        await addDoc(collection(db, 'users', userId, 'anotacoes'), {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          createdAt: serverTimestamp(),
        });
      }
      setModalVisible(false);
      setTitulo('');
      setDescricao('');
      onAnotacaoAdicionada?.();
    } catch (err) {
      setModalVisible(false);
      onAnotacaoAdicionada?.();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Anotações</Text>
        <TouchableOpacity
          style={styles.addCircle}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Text style={styles.backText}>← Voltar ao menu</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {anotacoes.length ? (
          anotacoes.map((item, idx) => (
            <View key={item.id || idx} style={styles.noteCard}>
              <Text style={styles.noteTitle}>{item.titulo}</Text>
              <View style={styles.underline} />
              <Text style={styles.noteBody}>{item.descricao}</Text>
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

      {/* Modal para adicionar anotação */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Anotação</Text>

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
                onPress={() => setModalVisible(false)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  title: { fontSize: 32, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: { color: '#FFFFFF', fontSize: 28, marginTop: -2 },
  backButton: { marginBottom: 16 },
  backText: { color: COLORS.primaryBlue, fontSize: 16, fontWeight: FONTS.medium },
  listContainer: { paddingBottom: 30 },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    padding: 16,
    marginBottom: 14,
  },
  noteTitle: { fontSize: 22, fontWeight: FONTS.bold, color: COLORS.textDark },
  underline: { height: 2, backgroundColor: COLORS.textDark, marginVertical: 8, width: '60%' },
  noteBody: { fontSize: 15, color: COLORS.textDark, lineHeight: 22 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: FONTS.bold, color: COLORS.primaryBlue, marginBottom: 16 },
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
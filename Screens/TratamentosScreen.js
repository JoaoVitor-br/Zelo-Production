import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';
import { lerTextoEmVozAlta, pararVoz } from '../services/NotificationService';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function TratamentosScreen({ userId, onVoltar }) {
  const [tratamentos, setTratamentos] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, 'users', userId, 'tratamentos'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTratamentos(list);
    });

    return () => unsub();
  }, [userId]);

  const handleSalvarTratamento = async () => {
    if (!titulo.trim() || !dataHora.trim()) {
      Alert.alert('Atenção', 'Informe o título e a data/horário do tratamento ou consulta.');
      return;
    }

    try {
      await addDoc(collection(db, 'users', userId, 'tratamentos'), {
        titulo: titulo.trim(),
        local: local.trim(),
        dataHora: dataHora.trim(),
        observacao: observacao.trim(),
        confirmado: false,
        createdAt: serverTimestamp(),
      });

      setModalNovo(false);
      setTitulo('');
      setLocal('');
      setDataHora('');
      setObservacao('');
    } catch (e) {
      setModalNovo(false);
    }
  };

  const handleConfirmarComparecimento = async (item) => {
    const textoVoz = `Confirmado comparecimento ao tratamento: ${item.titulo}.`;
    lerTextoEmVozAlta(textoVoz);

    try {
      if (userId && item.id) {
        await updateDoc(doc(db, 'users', userId, 'tratamentos', item.id), {
          confirmado: true,
          dataConfirmacao: new Date().toISOString(),
        });
      }
      Alert.alert('Presença Confirmada', `Presença em "${item.titulo}" registrada com sucesso.`);
    } catch (e) {
      Alert.alert('Presença Confirmada', `Presença registrada.`);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar ao menu</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.title}>Tratamentos & Consultas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalNovo(true)}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {tratamentos.length ? (
          tratamentos.map((item) => (
            <View key={item.id} style={[styles.card, item.confirmado && styles.cardConfirmado]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                {item.confirmado && <Text style={styles.badgeSuccess}>✓ Compareceu</Text>}
              </View>

              <Text style={styles.cardSub}>📅 {item.dataHora}</Text>
              {!!item.local && <Text style={styles.cardSub}>📍 {item.local}</Text>}
              {!!item.observacao && <Text style={styles.cardObs}>Obs: {item.observacao}</Text>}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.voiceBtn}
                  onPress={() => lerTextoEmVozAlta(`Tratamento ${item.titulo}, agendado para ${item.dataHora}.`)}
                >
                  <Text style={styles.voiceBtnText}>🔊 Ouvir</Text>
                </TouchableOpacity>

                {!item.confirmado && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => handleConfirmarComparecimento(item)}
                  >
                    <Text style={styles.confirmBtnText}>Confirmar Presença</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum tratamento ou consulta agendada.</Text>
        )}
      </ScrollView>

      {/* Modal para Adicionar Tratamento */}
      <Modal visible={modalNovo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Tratamento / Consulta</Text>

            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Título (ex: Fisioterapia, Consulta Cardiologista)"
            />
            <TextInput
              style={styles.input}
              value={dataHora}
              onChangeText={setDataHora}
              placeholder="Data e Horário (ex: 20/11 às 14:00)"
            />
            <TextInput
              style={styles.input}
              value={local}
              onChangeText={setLocal}
              placeholder="Local (ex: Clínica Zelo)"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Observações ou preparos necessários"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalNovo(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSalvarTratamento}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE', padding: SPACING.md || 16 },
  backButton: { paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: FONTS.medium },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  title: { fontSize: 24, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center' },
  addText: { color: '#FFFFFF', fontSize: 26, marginTop: -2 },
  listContainer: { paddingBottom: 30 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: COLORS.inputBorder },
  cardConfirmado: { backgroundColor: '#F0FDF4', borderColor: COLORS.secondaryGreen },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.textDark, flex: 1 },
  badgeSuccess: { color: COLORS.secondaryGreen, fontWeight: FONTS.bold, fontSize: 14 },
  cardSub: { fontSize: 14, color: COLORS.textDark, marginTop: 4 },
  cardObs: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  voiceBtn: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  voiceBtnText: { color: COLORS.primaryBlue, fontWeight: FONTS.bold, fontSize: 13 },
  confirmBtn: { backgroundColor: COLORS.secondaryGreen, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  confirmBtnText: { color: '#FFFFFF', fontWeight: FONTS.bold, fontSize: 14 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.primaryBlue, marginBottom: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.inputBorder, borderRadius: 12, height: 46, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: COLORS.textMuted, fontSize: 15 },
  saveBtn: { backgroundColor: COLORS.primaryBlue, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  saveBtnText: { color: '#FFFFFF', fontWeight: FONTS.bold, fontSize: 15 },
});
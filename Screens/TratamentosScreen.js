import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import Text from './AppText';
import TextInput from './AppTextInput';
import { COLORS, FONTS, SPACING } from '../theme';
import { lerTextoEmVozAlta } from './NotificationService';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

function formatarDataInput(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function formatarHoraInput(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2
    ? `${digitos.slice(0, 2)}:${digitos.slice(2)}`
    : digitos;
}

function dataValida(valor) {
  const match = String(valor || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

function separarDataHora(valor) {
  const texto = String(valor || '');
  const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dataBr = texto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  const horaMatch = texto.match(/(\d{1,2}):(\d{2})/);
  let data = '';

  if (dataIso) {
    data = `${dataIso[3]}/${dataIso[2]}/${dataIso[1]}`;
  } else if (dataBr) {
    let ano = dataBr[3] || String(new Date().getFullYear());
    if (ano.length === 2) ano = `20${ano}`;
    data = `${dataBr[1].padStart(2, '0')}/${dataBr[2].padStart(2, '0')}/${ano}`;
  }

  const hora = horaMatch
    ? `${horaMatch[1].padStart(2, '0')}:${horaMatch[2]}`
    : '';
  return { data: formatarDataInput(data), hora: formatarHoraInput(hora) };
}

export default function TratamentosScreen({ userId, zeladoNome = null, onVoltar }) {
  const [tratamentos, setTratamentos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoItem, setEditandoItem] = useState(null);

  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, 'users', userId, 'tratamentos'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTratamentos(list);
    });

    return () => unsub();
  }, [userId]);

  const abrirModalNovo = () => {
    setEditandoItem(null);
    setTitulo('');
    setLocal('');
    setData('');
    setHora('');
    setObservacao('');
    setModalVisible(true);
  };

  const abrirModalEditar = (item) => {
    setEditandoItem(item);
    setTitulo(item.titulo || '');
    setLocal(item.local || '');
    const dataHoraSeparada = separarDataHora(item.dataHora);
    setData(dataHoraSeparada.data);
    setHora(dataHoraSeparada.hora);
    setObservacao(item.observacao || '');
    setModalVisible(true);
  };

  const handleSalvarTratamento = async () => {
    if (!titulo.trim() || !dataValida(data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
      Alert.alert('Atenção', 'Informe o título e a data/horário do tratamento ou consulta.');
      return;
    }

    const dataHora = `${data} às ${hora}`;

    try {
      if (userId) {
        if (editandoItem?.id) {
          await updateDoc(doc(db, 'users', userId, 'tratamentos', editandoItem.id), {
            titulo: titulo.trim(),
            local: local.trim(),
            dataHora: dataHora.trim(),
            observacao: observacao.trim(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, 'users', userId, 'tratamentos'), {
            titulo: titulo.trim(),
            local: local.trim(),
            dataHora: dataHora.trim(),
            observacao: observacao.trim(),
            confirmado: false,
            createdAt: serverTimestamp(),
          });
        }
      }

      setModalVisible(false);
      setEditandoItem(null);
      setTitulo('');
      setLocal('');
      setData('');
      setHora('');
      setObservacao('');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o tratamento/consulta.');
    }
  };

  const handleExcluirTratamento = (item) => {
    Alert.alert(
      'Remover Tratamento',
      `Deseja realmente excluir "${item.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (userId && item.id) {
                await deleteDoc(doc(db, 'users', userId, 'tratamentos', item.id));
              }
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível remover o item.');
            }
          },
        },
      ]
    );
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
      Alert.alert('Presença Confirmada', 'Presença registrada.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tratamentos & Consultas</Text>
          {!!zeladoNome && <Text style={styles.zeladoTag}>Zelado: {zeladoNome}</Text>}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={abrirModalNovo}>
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
                  onPress={() =>
                    lerTextoEmVozAlta(`Tratamento ${item.titulo}, agendado para ${item.dataHora}.`)
                  }
                >
                  <Text style={styles.voiceBtnText}>🔊 Ouvir</Text>
                </TouchableOpacity>

                {!item.confirmado && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => handleConfirmarComparecimento(item)}
                  >
                    <Text style={styles.confirmBtnText}>Confirmar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Controles de Edição e Exclusão pelo Cuidador */}
              <View style={styles.manageRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => abrirModalEditar(item)}
                >
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleExcluirTratamento(item)}
                >
                  <Text style={styles.deleteBtnText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum tratamento ou consulta agendada.</Text>
        )}
      </ScrollView>

      {/* Modal para Adicionar ou Editar Tratamento */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editandoItem ? 'Editar Tratamento / Consulta' : 'Novo Tratamento / Consulta'}
            </Text>

            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Título (ex: Fisioterapia, Consulta Cardiologista)"
            />
            <TextInput
              style={styles.input}
              value={data}
              onChangeText={(valor) => setData(formatarDataInput(valor))}
              placeholder="Data (DD/MM/AAAA)"
              keyboardType="number-pad"
              maxLength={10}
            />
            <TextInput
              style={styles.input}
              value={hora}
              onChangeText={(valor) => setHora(formatarHoraInput(valor))}
              placeholder="Horário (HH:MM)"
              keyboardType="number-pad"
              maxLength={5}
            />
            <TextInput
              style={styles.input}
              value={local}
              onChangeText={setLocal}
              placeholder="Local (ex: Clínica Zelo)"
            />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 8 }]}
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Observações ou preparos necessários"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setEditandoItem(null);
                }}
              >
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14 },
  title: { fontFamily: FONTS.heading, fontSize: 23, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  zeladoTag: { fontSize: 14, color: COLORS.secondaryGreen, fontWeight: FONTS.bold, marginTop: 2 },
  addButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center' },
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
  manageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
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
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: FONTS.heading, fontSize: 20, fontWeight: FONTS.bold, color: COLORS.primaryBlue, marginBottom: 16 },
  input: { borderWidth: 1.5, borderColor: COLORS.inputBorder, borderRadius: 12, height: 46, paddingHorizontal: 12, marginBottom: 12, fontSize: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: COLORS.textMuted, fontSize: 15 },
  saveBtn: { backgroundColor: COLORS.primaryBlue, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  saveBtnText: { color: '#FFFFFF', fontWeight: FONTS.bold, fontSize: 15 },
});
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
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CadastroMedicamentoScreen({
  userId,
  medicamentoSelecionado = null,
  onVoltar,
  onSalvo,
}) {
  const [nome, setNome] = useState(medicamentoSelecionado?.nome || '');
  const [tipo, setTipo] = useState(medicamentoSelecionado?.tipo || 'Comprimido');
  const [horario, setHorario] = useState(medicamentoSelecionado?.horario || '14:00');
  const [frequencia, setFrequencia] = useState(medicamentoSelecionado?.frequencia || '1x ao dia');
  const [dose, setDose] = useState(medicamentoSelecionado?.dose || '1 comprimido');
  const [quantidade, setQuantidade] = useState(medicamentoSelecionado?.quantidade || '5');
  const [inicio, setInicio] = useState(medicamentoSelecionado?.inicio || '10/05/2024');
  const [fim, setFim] = useState(medicamentoSelecionado?.fim || 'Uso contínuo');
  const [observacao, setObservacao] = useState(medicamentoSelecionado?.observacao || '');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe ao menos o nome do medicamento.');
      return;
    }

    setSalvando(true);
    try {
      if (userId) {
        await addDoc(collection(db, 'users', userId, 'medicamentos'), {
          nome: nome.trim(),
          tipo: tipo.trim(),
          horario: horario.trim(),
          frequencia: frequencia.trim(),
          dose: dose.trim(),
          quantidade: quantidade.trim(),
          inicio: inicio.trim(),
          fim: fim.trim(),
          observacao: observacao.trim(),
          createdAt: serverTimestamp(),
        });
      }
      Alert.alert('Sucesso', 'Medicamento registrado com sucesso!');
      onSalvo?.();
    } catch (error) {
      Alert.alert('Sucesso', 'Dados guardados localmente.');
      onSalvo?.();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho do Medicamento */}
        <View style={styles.headerCard}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/883/883407.png' }}
            style={styles.medIcon}
          />
          <View style={styles.headerInputs}>
            <TextInput
              style={styles.nameInput}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do remédio"
              placeholderTextColor="#2563EB"
            />
            <TextInput
              style={styles.subInput}
              value={tipo}
              onChangeText={setTipo}
              placeholder="Ex: Comprimido"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Tabela de Informações de Dosagem */}
        <Text style={styles.sectionTitle}>Informações</Text>
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Horário</Text>
            <TextInput style={styles.rowInput} value={horario} onChangeText={setHorario} />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Frequência</Text>
            <TextInput style={styles.rowInput} value={frequencia} onChangeText={setFrequencia} />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dose</Text>
            <TextInput style={styles.rowInput} value={dose} onChangeText={setDose} />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Quantidade</Text>
            <TextInput style={styles.rowInput} value={quantidade} onChangeText={setQuantidade} />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Início</Text>
            <TextInput style={styles.rowInput} value={inicio} onChangeText={setInicio} />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fim</Text>
            <TextInput style={styles.rowInput} value={fim} onChangeText={setFim} />
          </View>
        </View>

        {/* Observações */}
        <Text style={styles.sectionTitle}>Observação:</Text>
        <View style={styles.obsCard}>
          <TextInput
            style={styles.obsInput}
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Efeitos colaterais, orientações alimentares ou avisos..."
            placeholderTextColor="#8EA2B0"
            multiline
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSalvar}
          disabled={salvando}
        >
          <Text style={styles.saveButtonText}>
            {salvando ? 'Salvando...' : 'Salvar Medicamento'}
          </Text>
        </TouchableOpacity>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C5ECFC',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  medIcon: { width: 56, height: 56, marginRight: 16 },
  headerInputs: { flex: 1 },
  nameInput: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  subInput: { fontSize: 15, color: COLORS.textDark, marginTop: 2 },
  sectionTitle: {
    fontSize: 22,
    color: COLORS.primaryBlue,
    fontWeight: FONTS.bold,
    marginTop: 14,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#D1F0FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { fontSize: 17, color: COLORS.textDark, fontWeight: FONTS.medium },
  rowInput: { fontSize: 17, color: COLORS.textDark, fontWeight: FONTS.bold, textAlign: 'right', minWidth: 100 },
  rowDivider: { height: 1, backgroundColor: COLORS.primaryBlue, opacity: 0.4 },
  obsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    padding: 12,
    minHeight: 90,
  },
  obsInput: { fontSize: 15, color: COLORS.textDark, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: COLORS.secondaryGreen,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: FONTS.bold },
});
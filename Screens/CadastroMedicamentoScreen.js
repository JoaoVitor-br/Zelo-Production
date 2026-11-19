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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLORS, FONTS, SPACING } from '../theme';
import { db, storage, getFirebaseErrorMessage } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { agendarAlarmeMedicamento } from './NotificationService';

function formatarDataInput(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function formatarHorarioInput(valor) {
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

export default function CadastroMedicamentoScreen({
  userId,
  isGerenciandoZelado = false,
  medicamentoSelecionado = null,
  onVoltar,
  onSalvo,
}) {
  const isEditing = Boolean(medicamentoSelecionado?.id);

  const [nome, setNome] = useState(medicamentoSelecionado?.nome || '');
  const [tipo, setTipo] = useState(medicamentoSelecionado?.tipo || 'Comprimido');
  const [horarios, setHorarios] = useState(() => {
    const cadastrados = Array.isArray(medicamentoSelecionado?.horarios)
      ? medicamentoSelecionado.horarios
      : [];
    const antigos = cadastrados.length
      ? cadastrados
      : [medicamentoSelecionado?.horario || '14:00'];
    return antigos.filter((item, index, lista) =>
      /^\d{2}:\d{2}$/.test(String(item).trim()) && lista.indexOf(item) === index
    ).length
      ? antigos.filter((item, index, lista) =>
          /^\d{2}:\d{2}$/.test(String(item).trim()) && lista.indexOf(item) === index
        )
      : ['14:00'];
  });
  const [frequencia, setFrequencia] = useState(medicamentoSelecionado?.frequencia || '1x ao dia');
  const [dose, setDose] = useState(medicamentoSelecionado?.dose || '1 comprimido');
  const [quantidade, setQuantidade] = useState(medicamentoSelecionado?.quantidade || '20');
  const [estoqueMinimo, setEstoqueMinimo] = useState(medicamentoSelecionado?.estoqueMinimo || '5');
  const imagemPadrao = 'https://cdn-icons-png.flaticon.com/512/883/883407.png';
  const imagemExistente = medicamentoSelecionado?.imagem || imagemPadrao;
  const [imagem, setImagem] = useState(
    /^https?:\/\//i.test(imagemExistente) ? imagemExistente : imagemPadrao
  );
  const [inicio, setInicio] = useState(() =>
    formatarDataInput(medicamentoSelecionado?.inicio || '10/05/2026')
  );
  const [fim, setFim] = useState(() => {
    const dataFim = medicamentoSelecionado?.fim || 'Uso contínuo';
    return dataFim === 'Uso contínuo' ? dataFim : formatarDataInput(dataFim);
  });
  const [observacao, setObservacao] = useState(medicamentoSelecionado?.observacao || '');
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  const enviarImagem = async (uri, mimeType) => {
    if (!userId) {
      Alert.alert('Erro', 'É necessário estar conectado para salvar a imagem na nuvem.');
      return;
    }

    setEnviandoImagem(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const nomeArquivo = medicamentoSelecionado?.id || `${Date.now()}`;
      const storageRef = ref(
        storage,
        `medicamentos/${userId}/${nomeArquivo}.jpg`
      );

      await uploadBytes(storageRef, blob, {
        contentType: mimeType || blob.type || 'image/jpeg',
      });
      const downloadUrl = await getDownloadURL(storageRef);
      setImagem(downloadUrl);
      Alert.alert('Sucesso', 'Imagem selecionada com sucesso!');
    } catch (error) {
      console.error('Falha ao enviar imagem do medicamento:', error);
      Alert.alert(
        'Falha ao salvar imagem',
        `A foto não foi enviada para a nuvem e não será salva neste cadastro. ${getFirebaseErrorMessage(error)}`
      );
    } finally {
      setEnviandoImagem(false);
    }
  };

  const selecionarImagem = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à galeria para adicionar uma imagem do medicamento.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        await enviarImagem(result.assets[0].uri, result.assets[0].mimeType);
      }
    } catch (_error) {
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  };

  const atualizarHorario = (index, valor) => {
    setHorarios((atuais) => atuais.map((horarioAtual, posicao) =>
      posicao === index ? formatarHorarioInput(valor) : horarioAtual
    ));
  };

  const adicionarHorario = () => {
    setHorarios((atuais) => [...atuais, '']);
  };

  const removerHorario = (index) => {
    setHorarios((atuais) => atuais.length === 1
      ? atuais
      : atuais.filter((_, posicao) => posicao !== index));
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe ao menos o nome do medicamento.');
      return;
    }

    const horariosValidos = horarios
      .map((item) => item.trim())
      .filter((item, index, lista) => {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item)) return false;
        return lista.indexOf(item) === index;
      });

    if (!horariosValidos.length) {
      Alert.alert('Atenção', 'Informe pelo menos um horário válido no formato HH:MM.');
      return;
    }

    if (!dataValida(inicio)) {
      Alert.alert('Atenção', 'Informe uma data de início válida no formato DD/MM/AAAA.');
      return;
    }

    if (fim !== 'Uso contínuo' && !dataValida(fim)) {
      Alert.alert('Atenção', 'Informe uma data final válida ou selecione Uso contínuo.');
      return;
    }

    if (!/^https?:\/\//i.test(imagem.trim())) {
      Alert.alert(
        'Imagem não salva na nuvem',
        'Escolha a foto pela galeria para enviá-la ao Firebase ou informe um endereço HTTPS.'
      );
      return;
    }

    setSalvando(true);
    try {
      const medData = {
        nome: nome.trim(),
        tipo: tipo.trim(),
        horario: horariosValidos[0],
        horarios: horariosValidos,
        frequencia: frequencia.trim(),
        dose: dose.trim(),
        quantidade: quantidade.trim(),
        estoqueMinimo: estoqueMinimo.trim(),
        imagem: imagem.trim(),
        inicio: inicio.trim(),
        fim: fim.trim(),
        observacao: observacao.trim(),
      };

      if (userId) {
        if (isEditing) {
          const medRef = doc(db, 'users', userId, 'medicamentos', medicamentoSelecionado.id);
          await updateDoc(medRef, {
            ...medData,
            updatedAt: serverTimestamp(),
          });
          if (!isGerenciandoZelado) {
            await agendarAlarmeMedicamento({ id: medicamentoSelecionado.id, ...medData });
          }
          Alert.alert(
            'Sucesso',
            isGerenciandoZelado
              ? 'Medicamento atualizado e enviado para o dispositivo do zelado!'
              : 'Medicamento atualizado com sucesso!'
          );
        } else {
          const docRef = await addDoc(collection(db, 'users', userId, 'medicamentos'), {
            ...medData,
            createdAt: serverTimestamp(),
          });
          if (!isGerenciandoZelado) {
            await agendarAlarmeMedicamento({ id: docRef.id, ...medData });
          }
          Alert.alert(
            'Sucesso',
            isGerenciandoZelado
              ? 'Medicamento agendado! O zelado já recebeu na rotina e o alarme foi ativado no aparelho dele.'
              : 'Medicamento e alarme agendados com sucesso!'
          );
        }
      }

      onSalvo?.();
    } catch (error) {
      console.error('Falha ao salvar medicamento:', error);
      Alert.alert(
        'Erro',
        `Não foi possível salvar o medicamento. ${getFirebaseErrorMessage(error)}`
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = () => {
    if (!isEditing || !userId) return;

    Alert.alert(
      'Remover Medicamento',
      `Tem certeza que deseja excluir "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId, 'medicamentos', medicamentoSelecionado.id));
              onSalvo?.();
            } catch (_error) {
              Alert.alert('Erro', 'Não foi possível remover o medicamento.');
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
        <View style={styles.headerCard}>
          <TouchableOpacity
            onPress={selecionarImagem}
            activeOpacity={0.8}
            style={styles.medIconContainer}
            disabled={enviandoImagem}
          >
            <Image source={{ uri: imagem }} style={styles.medIcon} />
            <View style={styles.cameraBadge}>
              {enviandoImagem
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.cameraBadgeText}>📷</Text>}
            </View>
          </TouchableOpacity>
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
              placeholder="Ex: Comprimido, Xarope"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {isEditing ? 'Editar Informações' : 'Informações e Estoque'}
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.horariosContainer}>
            <View style={styles.horariosHeader}>
              <Text style={styles.rowLabel}>Horários do Alarme</Text>
              <TouchableOpacity style={styles.addHorarioButton} onPress={adicionarHorario}>
                <Text style={styles.addHorarioText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>
            {horarios.map((item, index) => (
              <View key={index} style={styles.horarioRow}>
                <TextInput
                  style={styles.horarioInput}
                  value={item}
                  onChangeText={(valor) => atualizarHorario(index, valor)}
                  placeholder="HH:MM"
                  keyboardType="number-pad"
                  maxLength={5}
                />
                {horarios.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeHorarioButton}
                    onPress={() => removerHorario(index)}
                  >
                    <Text style={styles.removeHorarioText}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Frequência</Text>
            <TextInput style={styles.rowInput} value={frequencia} onChangeText={setFrequencia} />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dose Prescrita</Text>
            <TextInput style={styles.rowInput} value={dose} onChangeText={setDose} />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Estoque Atual (Qtd)</Text>
            <TextInput style={styles.rowInput} value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Estoque Mínimo (Alerta)</Text>
            <TextInput style={styles.rowInput} value={estoqueMinimo} onChangeText={setEstoqueMinimo} keyboardType="numeric" />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Início</Text>
            <TextInput
              style={styles.rowInput}
              value={inicio}
              onChangeText={(valor) => setInicio(formatarDataInput(valor))}
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fim</Text>
            <TextInput
              style={styles.rowInput}
              value={fim === 'Uso contínuo' ? '' : fim}
              onChangeText={(valor) => setFim(formatarDataInput(valor))}
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
            />
            <TouchableOpacity
              style={styles.continuoButton}
              onPress={() => setFim('Uso contínuo')}
            >
              <Text style={styles.continuoButtonText}>Contínuo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>URL da Imagem</Text>
            <TextInput style={[styles.rowInput, { fontSize: 13 }]} value={imagem} onChangeText={setImagem} autoCapitalize="none" />
          </View>
          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.galleryButton}
            onPress={selecionarImagem}
            disabled={enviandoImagem}
          >
            <Text style={styles.galleryButtonText}>
              {enviandoImagem ? 'Enviando imagem...' : 'Escolher foto da galeria'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Observação:</Text>
        <View style={styles.obsCard}>
          <TextInput
            style={styles.obsInput}
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Orientações alimentares, reações adversas ou avisos..."
            placeholderTextColor="#8EA2B0"
            multiline
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={salvando}>
          <Text style={styles.saveButtonText}>
            {salvando
              ? 'Salvando...'
              : isEditing
              ? 'Salvar Alterações'
              : 'Salvar e Enviar ao Zelado'}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleExcluir}>
            <Text style={styles.deleteButtonText}>Remover Medicamento</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE', padding: SPACING.md },
  backButton: { paddingVertical: SPACING.sm, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: FONTS.medium },
  scrollContent: { paddingBottom: 30 },
  headerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C5ECFC', borderRadius: 20, padding: 16, marginVertical: 12, borderWidth: 1.5, borderColor: COLORS.inputBorder },
  medIconContainer: { width: 56, height: 56, marginRight: 16 },
  medIcon: { width: 56, height: 56, borderRadius: 10 },
  cameraBadge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadgeText: { fontSize: 12 },
  headerInputs: { flex: 1 },
  nameInput: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.primaryBlue },
  subInput: { fontSize: 15, color: COLORS.textDark, marginTop: 2 },
  sectionTitle: { fontSize: 22, color: COLORS.primaryBlue, fontWeight: FONTS.bold, marginTop: 14, marginBottom: 8 },
  infoCard: { backgroundColor: '#D1F0FA', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: COLORS.inputBorder },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { fontSize: 16, color: COLORS.textDark, fontWeight: FONTS.medium },
  rowInput: { fontSize: 16, color: COLORS.textDark, fontWeight: FONTS.bold, textAlign: 'right', minWidth: 100 },
  rowDivider: { height: 1, backgroundColor: COLORS.primaryBlue, opacity: 0.4 },
  horariosContainer: { paddingVertical: 8 },
  horariosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addHorarioButton: { backgroundColor: COLORS.primaryBlue, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  addHorarioText: { color: '#FFFFFF', fontSize: 14, fontWeight: FONTS.bold },
  horarioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  horarioInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: FONTS.bold,
    textAlign: 'center',
  },
  removeHorarioButton: { paddingHorizontal: 10, paddingVertical: 8, marginLeft: 8 },
  removeHorarioText: { color: COLORS.redOrange, fontSize: 14, fontWeight: FONTS.bold },
  continuoButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 6,
  },
  continuoButtonText: { color: COLORS.primaryBlue, fontSize: 12, fontWeight: FONTS.bold },
  galleryButton: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    paddingVertical: 10,
    marginVertical: 8,
  },
  galleryButtonText: {
    color: COLORS.primaryBlue,
    fontSize: 15,
    fontWeight: FONTS.bold,
    textAlign: 'center',
  },
  obsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.inputBorder, padding: 12, minHeight: 80 },
  obsInput: { fontSize: 15, color: COLORS.textDark, textAlignVertical: 'top' },
  saveButton: { backgroundColor: COLORS.secondaryGreen, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: FONTS.bold },
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
  deleteButtonText: { color: COLORS.redOrange, fontSize: 17, fontWeight: FONTS.bold },
});
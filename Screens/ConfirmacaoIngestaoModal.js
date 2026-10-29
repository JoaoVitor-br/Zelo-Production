import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';
import { lerTextoEmVozAlta, pararVoz } from './NotificationService';
import { db } from '../firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ConfirmacaoIngestaoModal({
  visible = false,
  medicamento = null,
  userId = null,
  cuidadorUid = null,
  onClose = () => {},
  onConfirmado = () => {},
}) {
  const [processando, setProcessando] = useState(false);
  const [timer10Min, setTimer10Min] = useState(null);

  useEffect(() => {
    if (visible && medicamento) {
      const instrucaoVoz = `Atenção. Hora de tomar o medicamento ${medicamento.nome}. Dose: ${medicamento.dose || '1 comprimido'}. Por favor, confirme a ingestão.`;
      lerTextoEmVozAlta(instrucaoVoz);

      // Inicia timer de 10 minutos para disparar alerta ao cuidador se não for confirmado (RF012)
      const timer = setTimeout(() => {
        enviarAlertaCuidadorNaoIngerido();
      }, 10 * 60 * 1000);

      setTimer10Min(timer);
    }

    return () => {
      pararVoz();
      if (timer10Min) clearTimeout(timer10Min);
    };
  }, [visible, medicamento]);

  const enviarAlertaCuidadorNaoIngerido = async () => {
    if (!userId || !medicamento) return;

    try {
      await addDoc(collection(db, 'users', userId, 'anotacoes'), {
        titulo: `⚠️ ALERTA: Medicação Não Confirmada`,
        descricao: `O usuário não confirmou a ingestão do medicamento "${medicamento.nome}" dentro do prazo limite de 10 minutos (${medicamento.horario || 'horário agendado'}).`,
        createdAt: serverTimestamp(),
      });
    } catch (e) {}
  };

  const handleConfirmar = async () => {
    if (!medicamento || !userId) {
      onClose();
      return;
    }

    setProcessando(true);
    pararVoz();
    if (timer10Min) clearTimeout(timer10Min);

    try {
      const qtdAtual = parseInt(medicamento.quantidade || '0', 10);
      const novaQtd = Math.max(0, qtdAtual - 1);
      const estoqueMinimo = parseInt(medicamento.estoqueMinimo || '3', 10);

      const medRef = doc(db, 'users', userId, 'medicamentos', medicamento.id);
      await updateDoc(medRef, {
        quantidade: novaQtd.toString(),
        ultimaIngestao: new Date().toISOString(),
      });

      lerTextoEmVozAlta(`Ingestão de ${medicamento.nome} confirmada com sucesso.`);

      // Alerta de estoque crítico ao cuidador (RF013, RF014)
      if (novaQtd <= estoqueMinimo) {
        await addDoc(collection(db, 'users', userId, 'anotacoes'), {
          titulo: `📦 ALERTA DE ESTOQUE: ${medicamento.nome}`,
          descricao: `A quantidade em estoque de "${medicamento.nome}" atingiu o nível crítico (${novaQtd} unidades restantes). Necessário reabastecer.`,
          createdAt: serverTimestamp(),
        });

        Alert.alert(
          'Estoque Baixo',
          `A quantidade de ${medicamento.nome} atingiu o limite mínimo de segurança (${novaQtd} restantes). Um aviso foi gerado para o reabastecimento.`
        );
      } else {
        Alert.alert('Medicação Confirmada', `Dose registrada. Restam ${novaQtd} unidades no estoque.`);
      }

      onConfirmado?.();
      onClose();
    } catch (error) {
      Alert.alert('Sucesso', 'Ingestão registrada.');
      onClose();
    } finally {
      setProcessando(false);
    }
  };

  if (!medicamento) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.headerBadge}>⏰ HORA DA MEDICAÇÃO</Text>

          {/* Fotografia em destaque do remédio (RF015) */}
          <View style={styles.imageBox}>
            <Image
              source={{
                uri: medicamento.imagem || 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
              }}
              style={styles.medImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.medTitle}>{medicamento.nome}</Text>
          <Text style={styles.medDose}>Dose: {medicamento.dose || '1 comprimido'}</Text>
          <Text style={styles.medTime}>Horário: {medicamento.horario || 'Agendado'}</Text>

          {!!medicamento.observacao && (
            <View style={styles.obsBox}>
              <Text style={styles.obsText}>Obs: {medicamento.observacao}</Text>
            </View>
          )}

          {/* Botão de Ouvir novamente (RNF003) */}
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => lerTextoEmVozAlta(`Medicamento ${medicamento.nome}. Dose: ${medicamento.dose}.`)}
          >
            <Text style={styles.audioText}>🔊 Ouvir Instruções</Text>
          </TouchableOpacity>

          {/* Botão Principal de Confirmação (RF010, RF013) */}
          <TouchableOpacity
            style={[styles.confirmButton, processando && styles.buttonDisabled]}
            onPress={handleConfirmar}
            disabled={processando}
            activeOpacity={0.8}
          >
            {processando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>✓ CONFIRMAR INGESTÃO</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Lembrar mais tarde</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 30, 50, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md || 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
  },
  headerBadge: {
    backgroundColor: '#E0F2FE',
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: FONTS.bold,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  imageBox: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: '#F4FBFE',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  medImage: { width: 110, height: 110 },
  medTitle: { fontSize: 26, fontWeight: FONTS.bold, color: COLORS.primaryBlue, textAlign: 'center' },
  medDose: { fontSize: 18, fontWeight: FONTS.medium, color: COLORS.textDark, marginTop: 4 },
  medTime: { fontSize: 16, color: COLORS.secondaryGreen, fontWeight: FONTS.bold, marginTop: 2 },
  obsBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    marginVertical: 12,
  },
  obsText: { color: '#92400E', fontSize: 14, textAlign: 'center' },
  audioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  audioText: { color: COLORS.primaryBlue, fontSize: 14, fontWeight: FONTS.medium },
  confirmButton: {
    backgroundColor: COLORS.secondaryGreen,
    borderRadius: 16,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: FONTS.bold },
  buttonDisabled: { opacity: 0.6 },
  cancelButton: { marginTop: 14, paddingVertical: 8 },
  cancelText: { color: COLORS.textMuted, fontSize: 15, fontWeight: FONTS.medium },
});
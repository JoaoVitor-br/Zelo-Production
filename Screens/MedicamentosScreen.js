import React from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Text from './AppText';
import { COLORS, FONTS, SPACING } from '../theme';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function MedicamentosScreen({
  medicamentos = [],
  userId = null,
  zeladoNome = null,
  onVoltar,
  onNavigateToCadastro,
  onEditMedicamento,
  onSelectMedicamento,
}) {
  const handleExcluirMedicamento = (med) => {
    Alert.alert(
      'Remover Medicamento',
      `Deseja realmente excluir "${med.nome}" da lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (userId && med.id) {
                await deleteDoc(doc(db, 'users', userId, 'medicamentos', med.id));
              }
            } catch (error) {
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

      <Text style={styles.screenTitle}>
        {zeladoNome ? `REMÉDIOS DE ${zeladoNome.toUpperCase()}` : 'REMÉDIOS CADASTRADOS'}
      </Text>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardBox}>
          {medicamentos.length ? (
            medicamentos.map((med, index) => (
              <View key={med.id || index} style={styles.medCard}>
                <TouchableOpacity
                  style={styles.medMainRow}
                  onPress={() => onSelectMedicamento?.(med)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri: med.imagem || 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
                    }}
                    style={styles.medImage}
                  />
                  <View style={styles.medDetails}>
                    <Text style={styles.medName}>{med.nome || 'Medicamento'}</Text>
                    <Text style={styles.medType}>
                      {med.tipo || 'Comprimido'} • {
                        (Array.isArray(med.horarios) ? med.horarios : [med.horario])
                          .filter(Boolean)
                          .join(' • ') || 'Horário não definido'
                      }
                    </Text>
                    <Text style={styles.medStock}>
                      Dose: {med.dose || '1 un.'} | Estoque: {med.quantidade || '0'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Botões de Ação: Editar e Excluir */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => onEditMedicamento?.(med)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editBtnText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleExcluirMedicamento(med)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteBtnText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum medicamento cadastrado ainda.</Text>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={onNavigateToCadastro}
            activeOpacity={0.8}
          >
            <Text style={styles.addIcon}>+</Text>
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
  screenTitle: {
    fontFamily: FONTS.heading,
    fontSize: 21,
    color: COLORS.primaryBlue,
    fontWeight: FONTS.bold,
    textAlign: 'center',
    marginVertical: 14,
  },
  listContainer: { flexGrow: 1, paddingBottom: 20 },
  cardBox: {
    backgroundColor: '#BFE7FA',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    padding: 16,
    minHeight: 450,
    alignItems: 'center',
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  medMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medImage: { width: 50, height: 50, resizeMode: 'contain', marginRight: 14 },
  medDetails: { flex: 1 },
  medName: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.textDark },
  medType: { fontSize: 14, color: COLORS.primaryBlue, fontWeight: FONTS.medium, marginTop: 2 },
  medStock: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
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
  emptyText: {
    color: COLORS.textDark,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.limeGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 10,
    elevation: 3,
  },
  addIcon: { color: '#FFFFFF', fontSize: 36, fontWeight: '300', marginTop: -4 },
});
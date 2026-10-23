import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';

export default function MedicamentosScreen({
  medicamentos = [],
  onVoltar,
  onNavigateToCadastro,
  onSelectMedicamento,
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>REMÉDIOS CADASTRADOS</Text>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardBox}>
          {medicamentos.length ? (
            medicamentos.map((med, index) => (
              <TouchableOpacity
                key={med.id || index}
                style={styles.medCard}
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
                  <Text style={styles.medType}>{med.tipo || 'Comprimido'}</Text>
                </View>
              </TouchableOpacity>
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
    fontSize: 22,
    color: COLORS.primaryBlue,
    fontWeight: FONTS.bold,
    textAlign: 'center',
    marginVertical: 16,
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  medImage: { width: 50, height: 50, resizeMode: 'contain', marginRight: 14 },
  medDetails: { flex: 1 },
  medName: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.textDark },
  medType: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
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
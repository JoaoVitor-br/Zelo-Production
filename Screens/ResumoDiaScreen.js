import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';

export default function ResumoDiaScreen({ assuntos = [], onVoltar = () => {} }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Resumo do dia</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {assuntos.length ? assuntos.map((item, index) => {
          const titulo = typeof item === 'string' ? item : item.titulo;
          const descricao = typeof item === 'string' ? '' : item.descricao;
          return <View key={`${titulo}-${index}`} style={styles.item}>
            <View style={styles.bullet} />
            <View style={styles.itemText}><Text style={styles.itemTitle}>{titulo || 'Assunto'}</Text>{!!descricao && <Text style={styles.detail}>{descricao}</Text>}</View>
          </View>;
        }) : <Text style={styles.empty}>Ainda não há assuntos no resumo de hoje.</Text>}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE', padding: SPACING.md || 16 },
  backButton: { paddingVertical: SPACING.sm || 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: FONTS.medium },
  title: { fontSize: 29, color: COLORS.primaryBlue, fontWeight: FONTS.bold, marginVertical: SPACING.md || 16 },
  list: { gap: 12, flexGrow: 1 },
  item: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.inputBorder },
  bullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primaryBlue, marginTop: 6, marginRight: 12 },
  itemText: { flex: 1 },
  itemTitle: { color: COLORS.textDark, fontSize: 17, fontWeight: FONTS.bold },
  detail: { color: COLORS.textDark, marginTop: 4, fontSize: 14, lineHeight: 20 },
  empty: { color: COLORS.textDark, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 40 },
});

import React from 'react';
import { View, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './AppText';
import { COLORS, FONTS, SPACING } from '../theme';

export default function ListaZeladosScreen({
  zelados = [],
  onVoltar = () => {},
  onSelectZelado = () => {},
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onVoltar} style={styles.backButton}>
        <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Image source={require('./assets/icons/iconZelado.png')} style={styles.titleIcon} />
        <Text style={styles.title}>Ver Zelados</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {zelados.length ? (
          zelados.map((item, index) => {
            const zeladoObj = typeof item === 'string' ? { id: item } : item || {};
            const nome = zeladoObj.nome || 'Pessoa Monitorada';
            const detalhe =
              zeladoObj.descricao || zeladoObj.email || zeladoObj.telefone || 'Usuário monitorado';
            const fotoUrl = zeladoObj.fotoUrl || zeladoObj.photoURL || null;

            return (
              <TouchableOpacity
                key={`${zeladoObj.id || nome}-${index}`}
                style={styles.item}
                onPress={() => onSelectZelado(zeladoObj)}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  {fotoUrl ? (
                    <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{(nome || '?').charAt(0).toUpperCase()}</Text>
                  )}
                </View>

                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{nome}</Text>
                  {!!detalhe && <Text style={styles.detail}>{detalhe}</Text>}
                  <Text style={styles.actionHint}>Abrir Menu do Cuidado ›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.empty}>Nenhum usuário monitorado cadastrado ainda.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE', padding: SPACING.md || 16 },
  backButton: {
    paddingVertical: SPACING.sm || 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: FONTS.medium },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: SPACING.md || 16,
    marginBottom: 4,
  },
  titleIcon: { width: 36, height: 36, resizeMode: 'contain', tintColor: COLORS.primaryBlue },
  title: { fontFamily: FONTS.heading, fontSize: 28, color: COLORS.primaryBlue, fontWeight: FONTS.bold },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.md || 16,
  },
  list: { gap: 12, flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#C7ECF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 27 },
  avatarText: { color: COLORS.primaryBlue, fontSize: 22, fontWeight: FONTS.bold },
  itemText: { flex: 1 },
  itemTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: FONTS.bold },
  detail: { color: COLORS.textMuted, marginTop: 2, fontSize: 14 },
  actionHint: {
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: FONTS.bold,
    marginTop: 6,
  },
  empty: { color: COLORS.textDark, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 40 },
});
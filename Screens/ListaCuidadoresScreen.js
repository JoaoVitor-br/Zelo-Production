import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';

export default function ListaZeladosScreen({ zelados = [], onVoltar = () => {} }) {
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
            const nome = typeof item === 'string' ? item : item.nome;
            const detalhe =
              typeof item === 'string'
                ? ''
                : item.descricao || item.email || item.telefone || 'Usuário monitorado';
            const fotoUrl = typeof item === 'object' ? item.fotoUrl : null;

            return (
              <View key={`${nome}-${index}`} style={styles.item}>
                <View style={styles.avatar}>
                  {fotoUrl ? (
                    <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{(nome || '?').charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{nome || 'Pessoa Monitorada'}</Text>
                  {!!detalhe && <Text style={styles.detail}>{detalhe}</Text>}
                </View>
              </View>
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
    marginVertical: SPACING.md || 16,
  },
  titleIcon: { width: 36, height: 36, resizeMode: 'contain', tintColor: COLORS.primaryBlue },
  title: { fontSize: 28, color: COLORS.primaryBlue, fontWeight: FONTS.bold },
  list: { gap: 12, flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C7ECF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 24 },
  avatarText: { color: COLORS.primaryBlue, fontSize: 20, fontWeight: FONTS.bold },
  itemText: { flex: 1 },
  itemTitle: { color: COLORS.textDark, fontSize: 17, fontWeight: FONTS.bold },
  detail: { color: COLORS.textDark, marginTop: 4, fontSize: 14 },
  empty: { color: COLORS.textDark, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 40 },
});
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme';

export default function MapaMap({ style, loadingLocation, permissionDenied }) {
  let message = 'Mapa interativo disponível no aplicativo para Android e iOS. Use “Rota” para abrir um local no Google Maps.';
  if (loadingLocation) {
    message = 'Obtendo sua localização...';
  } else if (permissionDenied) {
    message = 'Acesso ao GPS desativado. Você ainda pode abrir as rotas dos locais listados.';
  }

  return (
    <View style={[style, styles.container]}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E5F3F8',
  },
  message: {
    maxWidth: 360,
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: FONTS.medium,
    lineHeight: 22,
    textAlign: 'center',
  },
});

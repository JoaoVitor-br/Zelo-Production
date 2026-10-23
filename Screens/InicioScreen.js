import React, { useEffect } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import ZeloLogo from '../components/ZeloLogo';

export default function InicioScreen({ onFinish }) {
  useEffect(() => {
    const timeout = setTimeout(() => onFinish?.(), 2000);
    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <View style={estilos.caixa}>
      <ImageBackground
        source={require('./assets/fundo-pontilhado.png')}
        style={estilos.fundo}
        resizeMode="cover"
      >
        <View style={estilos.box}>
          <ZeloLogo size="large" />
        </View>
      </ImageBackground>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flex: 1,
  },
  fundo: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
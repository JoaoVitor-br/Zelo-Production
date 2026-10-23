import { Image, StyleSheet } from 'react-native';

export default function ZeloLogo({ size = 'large' }) {
  return (
    <Image
      source={require('../Screens/assets/zelo-logo.png')}
      accessibilityRole="image"
      accessibilityLabel="Logo Zelo"
      resizeMode="contain"
      style={[styles.logo, size === 'small' ? styles.small : styles.large]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 96,
    height: 96,
  },
  small: {
    width: 64,
    height: 64,
  },
  large: {
    width: 128,
    height: 128,
  },
});

import React from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';

export default function MenuPrincipalScreen({
  nomeUsuario = 'Ana',
  onOpenNav = () => {},
  onNavigateToCuidadores = () => {},
  onNavigateToResumo = () => {},
  onNavigateToConvidar = () => {},
  onNavigateToMedicamentos = () => {},
  onNavigateToAnotacoes = () => {},
  onNavigateToMapa = () => {},
  onNavigateToPerfil = () => {},
}) {
  const nome = (nomeUsuario || '').trim() || 'Olá';
  const saudacaoNome = nome === 'Olá' ? 'Olá' : `Olá, ${nome},`;

  return (
    <View style={styles.background}>
      {/* Barra de Topo com Ícone de Menu Hambúrguer */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onOpenNav} style={styles.hamburgerButton} activeOpacity={0.7}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <View pointerEvents="none" style={styles.dotPattern}>
        {Array.from({ length: 80 }, (_, index) => (
          <View key={index} style={[styles.dot, { opacity: 0.12 + (index % 4) * 0.04 }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner com foto e saudação */}
        <TouchableOpacity style={styles.hero} onPress={onNavigateToPerfil} activeOpacity={0.9}>
          <Image
            source={require('./assets/cuidadora.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.greeting}>
            <Text style={styles.greetingTitle}>{saudacaoNome}</Text>
            <Text style={styles.greetingSubtitle}>Como podemos ajudar hoje?</Text>
          </View>
        </TouchableOpacity>

        {/* Card Principal de Opções */}
        <View style={styles.optionsCard}>
          <TouchableOpacity style={styles.option} onPress={onNavigateToCuidadores} activeOpacity={0.75}>
            <Image source={require('./assets/icons/users-round (1) 1.png')} style={styles.optionIcon} />
            <Text style={styles.optionText}>Ver cuidadores</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.option} onPress={onNavigateToResumo} activeOpacity={0.75}>
            <Image source={require('./assets/icons/pill (1) 1.png')} style={styles.optionIcon} />
            <Text style={styles.optionText}>Resumo do dia</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.option} onPress={onNavigateToConvidar} activeOpacity={0.75}>
            <Image source={require('./assets/icons/qr-code 1.png')} style={styles.optionIcon} />
            <Text style={styles.optionText}>Convidar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F4FBFE' },
  topHeader: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F4FBFE',
    zIndex: 10,
  },
  hamburgerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  hamburgerIcon: {
    fontSize: 28,
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
  },
  dotPattern: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingTop: 60 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7BC8E5', margin: 6 },
  content: { paddingBottom: SPACING.lg || 24 },
  hero: { height: 180, width: '100%', overflow: 'hidden', borderRadius: 22 },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 47, 70, 0.28)' },
  greeting: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.md || 16 },
  greetingTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: FONTS.bold },
  greetingSubtitle: { color: '#FFFFFF', fontSize: 20, fontWeight: FONTS.medium, marginTop: 4 },
  optionsCard: {
    marginTop: 20, marginHorizontal: '8%', borderRadius: 24, borderWidth: 2,
    borderColor: COLORS.primaryBlue, backgroundColor: 'rgba(116, 207, 239, 0.43)',
    paddingHorizontal: 16, paddingVertical: 4,
  },
  option: { minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  optionText: { color: COLORS.primaryBlue, fontSize: 21, fontWeight: FONTS.bold, flexShrink: 1 },
  separator: { height: 1.5, backgroundColor: COLORS.primaryBlue, opacity: 0.85 },
  optionIcon: { width: 48, height: 48, resizeMode: 'contain' },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: '8%', marginTop: 20, gap: 12 },
  gridItem: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.inputBorder,
  },
  gridEmoji: { fontSize: 26, marginBottom: 4 },
  gridText: { color: COLORS.primaryBlue, fontSize: 15, fontWeight: FONTS.bold },
});
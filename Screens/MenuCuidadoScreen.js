import React from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Text from './AppText';
import { COLORS, FONTS, SPACING } from '../theme';

export default function MenuCuidadoScreen({
  zelado = {},
  onVoltarListaZelados = () => {},
  onVoltarMenuPrincipal = () => {},
  onNavigateToMedicamentos = () => {},
  onNavigateToTratamentos = () => {},
  onNavigateToAnotacoes = () => {},
  onNavigateToResumo = () => {},
}) {
  const nomeZelado = (zelado?.nome || 'Pessoa Monitorada').trim();
  const fotoZelado = zelado?.fotoUrl || zelado?.photoURL;

  return (
    <View style={styles.background}>
      {/* Barra Superior */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onVoltarListaZelados} style={styles.backButton} activeOpacity={0.7}>
          <Image source={require('./assets/icons/arrow-left 1.png')} style={styles.backIcon} />
          <Text style={styles.backText}>Trocar zelado</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onVoltarMenuPrincipal} style={styles.homeButton} activeOpacity={0.7}>
          <Text style={styles.homeText}>Meu Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Padrão de pontos decorativos */}
      

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cartão de Identificação do Zelado Monitorado */}
        <View style={styles.heroCard}>
          <Image
            source={
              fotoZelado
                ? { uri: fotoZelado }
                : require('./assets/cuidadora.jpg')
            }
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>MENU DO CUIDADO</Text>
            </View>
            <Text style={styles.greetingTitle}>{nomeZelado}</Text>
            <Text style={styles.greetingSubtitle}>
              Gerenciando rotina, remédios e consultas
            </Text>
          </View>
        </View>

        {/* Menu Principal de Ações do Zelado */}
        <View style={styles.optionsCard}>
          <TouchableOpacity
            style={styles.option}
            onPress={onNavigateToMedicamentos}
            activeOpacity={0.75}
          >
            <Image source={require('./assets/icons/pill (1) 1.png')} style={styles.optionIcon} />
            <View style={styles.optionTextGroup}>
              <Text style={styles.optionText}>Remédios</Text>
              <Text style={styles.optionSubtext}>Adicionar, editar ou remover</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.option}
            onPress={onNavigateToTratamentos}
            activeOpacity={0.75}
          >
            <Image source={require('./assets/icons/calendar-days 1.png')} style={styles.optionIcon} />
            <View style={styles.optionTextGroup}>
              <Text style={styles.optionText}>Tratamentos e Consultas</Text>
              <Text style={styles.optionSubtext}>Agendar, editar ou remover</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.option}
            onPress={onNavigateToAnotacoes}
            activeOpacity={0.75}
          >
            <Image source={require('./assets/icons/user-round-pen 1.png')} style={styles.optionIcon} />
            <View style={styles.optionTextGroup}>
              <Text style={styles.optionText}>Anotações</Text>
              <Text style={styles.optionSubtext}>Registrar, editar ou remover</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.option}
            onPress={onNavigateToResumo}
            activeOpacity={0.75}
          >
            <Image source={require('./assets/icons/iconZelado.png')} style={styles.optionIcon} />
            <View style={styles.optionTextGroup}>
              <Text style={styles.optionText}>Resumo do Dia</Text>
              <Text style={styles.optionSubtext}>Acompanhar horários de hoje</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F4FBFE' },
  topHeader: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F4FBFE',
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 16, fontWeight: FONTS.medium },
  homeButton: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  homeText: { color: COLORS.primaryBlue, fontSize: 14, fontWeight: FONTS.bold },
  dotPattern: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingTop: 60,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7BC8E5', margin: 6 },
  content: { paddingBottom: SPACING.lg || 24 },
  heroCard: {
    height: 185,
    marginHorizontal: '6%',
    marginTop: 8,
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
  },
  heroImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 47, 70, 0.52)' },
  heroContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondaryGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: FONTS.bold, letterSpacing: 0.5 },
  greetingTitle: { fontFamily: FONTS.heading, color: '#FFFFFF', fontSize: 28, fontWeight: FONTS.bold },
  greetingSubtitle: { color: '#E0F2FE', fontSize: 15, fontWeight: FONTS.medium, marginTop: 4 },
  optionsCard: {
    marginTop: 22,
    marginHorizontal: '6%',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
    backgroundColor: 'rgba(116, 207, 239, 0.43)',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  option: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 16,
  },
  optionIcon: { width: 44, height: 44, resizeMode: 'contain' },
  optionTextGroup: { flex: 1 },
  optionText: { color: COLORS.primaryBlue, fontSize: 20, fontWeight: FONTS.bold },
  optionSubtext: { color: COLORS.textDark, fontSize: 13, marginTop: 2 },
  separator: { height: 1.5, backgroundColor: COLORS.primaryBlue, opacity: 0.85 },
});
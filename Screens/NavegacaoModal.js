import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from 'react-native';
import Text from './AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../theme';

export default function NavegacaoModal({
  visible = false,
  onClose = () => { },
  onNavigateToMedicamentos = () => { },
  onNavigateToTratamentos = () => { },
  onNavigateToResumo = () => { },
  onNavigateToAnotacoes = () => { },
  onNavigateToMapa = () => { },
  onNavigateToPerfil = () => { },
  onNavigateToZelados = () => { },
  onLogout = () => { },
}) {
  const handleNavigate = (action) => {
    onClose();
    action?.();
  };

  const handleConfirmarSair = () => {
    onClose();
    Alert.alert(
      'Sair do aplicativo',
      'Deseja realmente encerrar a sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => onLogout?.(),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Opções de Navegação */}
          <View style={styles.menuList}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate(onNavigateToMedicamentos)}
              activeOpacity={0.8}
            >
              <Image
                source={require('./assets/icons/pill (1) 1.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Medicamentos</Text>
            </TouchableOpacity>

            {/* Farmácias */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate(onNavigateToTratamentos)}
              activeOpacity={0.8}
            >
              <Image
                source={require('./assets/icons/hospital.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Consultas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate(onNavigateToMapa)}
              activeOpacity={0.8}
            >
              <Image
                source={require('./assets/icons/map.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Mapa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate(onNavigateToResumo)}
              activeOpacity={0.8}
            >
              <Image
                source={require('./assets/icons/calendar-days 1.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Agenda</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate(onNavigateToAnotacoes)}
              activeOpacity={0.8}
            >
              <Image
                source={require('./assets/icons/user-round-pen 1.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Anotações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate(onNavigateToPerfil)}
              activeOpacity={0.8}
            >
              <Image
                source={require('./assets/icons/users-round (1) 1.png')}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>

            {/* BOTÃO DE SAIR */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleConfirmarSair}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutEmoji}>🚪</Text>
              <Text style={styles.logoutText}>Sair do aplicativo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 56,
    backgroundColor: '#BFE7FA',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  closeButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 28, fontWeight: '700', color: COLORS.primaryBlue },
  menuList: { paddingHorizontal: SPACING.md || 20, paddingTop: 20, gap: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 20,
    position: 'relative',
  },
  menuIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    position: 'absolute',
    left: 20,
    tintColor: COLORS.primaryBlue,
  },
  menuText: { fontSize: 19, fontWeight: FONTS.bold, color: COLORS.primaryBlue, textAlign: 'center' },
  logoutItem: {
    borderColor: COLORS.redOrange,
    marginTop: 12,
    backgroundColor: '#FEF2F2',
  },
  logoutEmoji: {
    fontSize: 22,
    position: 'absolute',
    left: 20,
  },
  logoutText: {
    fontSize: 19,
    fontWeight: FONTS.bold,
    color: COLORS.redOrange,
    textAlign: 'center',
  },
});
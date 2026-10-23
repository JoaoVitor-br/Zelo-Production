import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../theme';

export default function NavegacaoModal({
  visible = false,
  onClose = () => {},
  onNavigateToMedicamentos = () => {},
  onNavigateToResumo = () => {},
  onNavigateToAnotacoes = () => {},
  onNavigateToPerfil = () => {},
  onNavigateToMapa = () => {},
}) {
  const handleNavigate = (action) => {
    onClose();
    action?.();
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
          {/* Cabeçalho com o botão de Fechar (X) */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Opções de Navegação */}
          <View style={styles.menuList}>
            {/* Medicamentos */}
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

            {/* Agenda / Resumo do Dia */}
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

            {/* Farmácias */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate(onNavigateToMapa)}
              activeOpacity={0.8}
            >
              <Text style={styles.menuEmoji}>📍</Text>
              <Text style={styles.menuText}>Farmácias</Text>
            </TouchableOpacity>

            {/* Anotações */}
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

            {/* Perfil */}
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
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    backgroundColor: '#BFE7FA',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primaryBlue,
  },
  menuList: {
    paddingHorizontal: SPACING.md || 20,
    paddingTop: 32,
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderRadius: 16,
    height: 64,
    paddingHorizontal: 20,
    position: 'relative',
  },
  menuIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    position: 'absolute',
    left: 20,
    tintColor: COLORS.primaryBlue,
  },
  menuEmoji: {
    fontSize: 28,
    position: 'absolute',
    left: 20,
  },
  menuText: {
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: COLORS.primaryBlue,
    textAlign: 'center',
  },
});
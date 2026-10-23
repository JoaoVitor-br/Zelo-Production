// App.js
import React, { useState } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, StyleSheet, StatusBar } from 'react-native';
import InicioScreen from './Screens/InicioScreen';
import LoginScreen from './Screens/LoginScreen';
import CriarContaScreen from './Screens/CriarContaScreen';
import MenuPrincipalScreen from './Screens/MenuPrincipalScreen';
import ListaCuidadoresScreen from './Screens/ListaCuidadoresScreen';
import ResumoDiaScreen from './Screens/ResumoDiaScreen';
import { COLORS } from './theme';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  // Troque pelos dados da sessão/API quando estiverem disponíveis.
  const [nomeUsuario] = useState('Ana');
  const [cuidadores] = useState([]);
  const [assuntosResumo] = useState([]);

  const voltarAoMenu = () => setCurrentScreen('menu');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screenContainer}>
        {currentScreen === 'inicio' && <InicioScreen />}
        {currentScreen === 'login' && <LoginScreen onNavigateToRegister={() => setCurrentScreen('criar')} />}
        {currentScreen === 'criar' && <CriarContaScreen onNavigateToLogin={() => setCurrentScreen('login')} />}
        {currentScreen === 'menu' && (
          <MenuPrincipalScreen
            nomeUsuario={nomeUsuario}
            onNavigateToCuidadores={() => setCurrentScreen('cuidadores')}
            onNavigateToResumo={() => setCurrentScreen('resumo')}
            onNavigateToConvidar={() => setCurrentScreen('convidar')}
          />
        )}
        {currentScreen === 'cuidadores' && <ListaCuidadoresScreen cuidadores={cuidadores} onVoltar={voltarAoMenu} />}
        {currentScreen === 'resumo' && <ResumoDiaScreen assuntos={assuntosResumo} onVoltar={voltarAoMenu} />}
        {currentScreen === 'convidar' && (
          <View style={styles.placeholder}>
            <TouchableOpacity onPress={voltarAoMenu}><Text style={styles.backText}>‹  Voltar ao menu</Text></TouchableOpacity>
            <Text style={styles.placeholderTitle}>Convidar</Text>
            <Text style={styles.placeholderText}>A tela de convite pode ser conectada aqui.</Text>
          </View>
        )}
      </View>

      {/* Barra auxiliar mantida para alternar entre as telas já existentes durante o desenvolvimento. */}
      <View style={styles.navBar}>
        {[
          ['menu', 'Menu'], ['inicio', 'Início'], ['login', 'Login'], ['criar', 'Criar conta'],
        ].map(([screen, label]) => (
          <TouchableOpacity key={screen} style={[styles.navButton, currentScreen === screen && styles.navButtonActive]} onPress={() => setCurrentScreen(screen)}>
            <Text style={[styles.navText, currentScreen === screen && styles.navTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  screenContainer: { flex: 1 },
  navBar: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F3F4F6', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 8, justifyContent: 'space-around' },
  navButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  navButtonActive: { backgroundColor: COLORS.primaryBlue },
  navText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  navTextActive: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  placeholder: { flex: 1, padding: 24, backgroundColor: '#F5FBFE', justifyContent: 'center' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: '600' },
  placeholderTitle: { color: COLORS.primaryBlue, fontSize: 29, fontWeight: '700', marginTop: 28, marginBottom: 10 },
  placeholderText: { color: '#263746', fontSize: 16 },
});

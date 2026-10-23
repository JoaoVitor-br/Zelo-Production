import React, { useState, useEffect } from 'react';
import { BackHandler, SafeAreaView, View, StyleSheet, StatusBar } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';

import { auth, db } from './firebase';
import InicioScreen from './Screens/InicioScreen';
import LoginScreen from './Screens/LoginScreen';
import CriarContaScreen from './Screens/CriarContaScreen';
import EsqueciSenhaScreen from './Screens/EsqueciSenhaScreen';
import MenuPrincipalScreen from './Screens/MenuPrincipalScreen';
import ListaCuidadoresScreen from './Screens/ListaCuidadoresScreen';
import ResumoDiaScreen from './Screens/ResumoDiaScreen';
import ConvidarScreen from './Screens/ConvidarScreen';
import MedicamentosScreen from './Screens/MedicamentosScreen';
import CadastroMedicamentoScreen from './Screens/CadastroMedicamentoScreen';
import PerfilScreen from './Screens/PerfilScreen';
import AnotacoesScreen from './Screens/AnotacoesScreen';
import MapaScreen from './Screens/MapaScreen';
import NavegacaoModal from './Screens/NavegacaoModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('inicio');
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({});
  const [cuidadores, setCuidadores] = useState([]);
  const [assuntosResumo, setAssuntosResumo] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [anotacoes, setAnotacoes] = useState([]);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authenticatedUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
            if (userDoc.data().cuidadores) {
              setCuidadores(userDoc.data().cuidadores);
            }
          }
        } catch (e) {}
      } else {
        setUserProfile({});
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubMeds = onSnapshot(
      collection(db, 'users', user.uid, 'medicamentos'),
      (snapshot) => {
        const medsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMedicamentos(medsData);

        const resumoItems = medsData.map((m) => ({
          titulo: `${m.nome} - ${m.horario || 'Horário do dia'}`,
          descricao: `Dose: ${m.dose || '1 comprimido'}. Obs: ${m.observacao || 'Uso contínuo'}`,
        }));
        setAssuntosResumo(resumoItems);
      },
      () => {}
    );

    const unsubNotes = onSnapshot(
      collection(db, 'users', user.uid, 'anotacoes'),
      (snapshot) => {
        const notesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAnotacoes(notesData);
      },
      () => {}
    );

    return () => {
      unsubMeds();
      unsubNotes();
    };
  }, [user]);

  const voltarAoMenu = () => setCurrentScreen('menu');

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navModalVisible) {
        setNavModalVisible(false);
        return true;
      }

      if (currentScreen === 'cadastroMedicamento') {
        setCurrentScreen('medicamentos');
        return true;
      }

      if (currentScreen === 'criar' || currentScreen === 'esqueciSenha') {
        setCurrentScreen('login');
        return true;
      }

      if (
        currentScreen === 'cuidadores' ||
        currentScreen === 'resumo' ||
        currentScreen === 'convidar' ||
        currentScreen === 'medicamentos' ||
        currentScreen === 'perfil' ||
        currentScreen === 'anotacoes' ||
        currentScreen === 'mapa'
      ) {
        voltarAoMenu();
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [currentScreen, navModalVisible]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentScreen('login');
    } catch (e) {
      setCurrentScreen('login');
    }
  };

  const nomeExibicao = userProfile.nome || user?.displayName || 'Ana';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Modal de Navegação do Protótipo (iPhone 17 - 31) */}
      <NavegacaoModal
        visible={navModalVisible}
        onClose={() => setNavModalVisible(false)}
        onNavigateToMedicamentos={() => setCurrentScreen('medicamentos')}
        onNavigateToResumo={() => setCurrentScreen('resumo')}
        onNavigateToAnotacoes={() => setCurrentScreen('anotacoes')}
        onNavigateToPerfil={() => setCurrentScreen('perfil')}
        onNavigateToMapa={() => setCurrentScreen('mapa')}
      />

      <View style={styles.screenContainer}>
        {currentScreen === 'inicio' && (
          <InicioScreen onFinish={() => setCurrentScreen(user ? 'menu' : 'login')} />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onNavigateToRegister={() => setCurrentScreen('criar')}
            onNavigateToForgotPassword={() => setCurrentScreen('esqueciSenha')}
            onAuthenticationSuccess={voltarAoMenu}
          />
        )}

        {currentScreen === 'esqueciSenha' && (
          <EsqueciSenhaScreen onVoltar={() => setCurrentScreen('login')} />
        )}

        {currentScreen === 'criar' && (
          <CriarContaScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onAuthenticationSuccess={voltarAoMenu}
          />
        )}

        {currentScreen === 'menu' && (
          <MenuPrincipalScreen
            nomeUsuario={nomeExibicao}
            onOpenNav={() => setNavModalVisible(true)}
            onNavigateToCuidadores={() => setCurrentScreen('cuidadores')}
            onNavigateToResumo={() => setCurrentScreen('resumo')}
            onNavigateToConvidar={() => setCurrentScreen('convidar')}
            onNavigateToMedicamentos={() => setCurrentScreen('medicamentos')}
            onNavigateToAnotacoes={() => setCurrentScreen('anotacoes')}
            onNavigateToMapa={() => setCurrentScreen('mapa')}
            onNavigateToPerfil={() => setCurrentScreen('perfil')}
          />
        )}

        {currentScreen === 'cuidadores' && (
          <ListaCuidadoresScreen cuidadores={cuidadores} onVoltar={voltarAoMenu} />
        )}

        {currentScreen === 'resumo' && (
          <ResumoDiaScreen assuntos={assuntosResumo} onVoltar={voltarAoMenu} />
        )}

        {currentScreen === 'convidar' && (
          <ConvidarScreen
            userProfile={userProfile}
            currentUserId={user?.uid}
            onVoltar={voltarAoMenu}
            onConexaoSucesso={voltarAoMenu}
          />
        )}

        {currentScreen === 'medicamentos' && (
          <MedicamentosScreen
            medicamentos={medicamentos}
            onVoltar={voltarAoMenu}
            onNavigateToCadastro={() => {
              setMedicamentoSelecionado(null);
              setCurrentScreen('cadastroMedicamento');
            }}
            onSelectMedicamento={(med) => {
              setMedicamentoSelecionado(med);
              setCurrentScreen('cadastroMedicamento');
            }}
          />
        )}

        {currentScreen === 'cadastroMedicamento' && (
          <CadastroMedicamentoScreen
            userId={user?.uid}
            medicamentoSelecionado={medicamentoSelecionado}
            onVoltar={() => setCurrentScreen('medicamentos')}
            onSalvo={() => setCurrentScreen('medicamentos')}
          />
        )}

        {currentScreen === 'perfil' && (
          <PerfilScreen
            userProfile={userProfile}
            userId={user?.uid}
            onVoltar={voltarAoMenu}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'anotacoes' && (
          <AnotacoesScreen
            anotacoes={anotacoes}
            userId={user?.uid}
            onVoltar={voltarAoMenu}
            onAnotacaoAdicionada={() => {}}
          />
        )}

        {currentScreen === 'mapa' && <MapaScreen onVoltar={voltarAoMenu} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
});
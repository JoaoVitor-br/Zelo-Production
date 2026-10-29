import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, StatusBar } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

import { auth, db } from './firebase';
import InicioScreen from './Screens/InicioScreen';
import LoginScreen from './Screens/LoginScreen';
import CriarContaScreen from './Screens/CriarContaScreen';
import EsqueciSenhaScreen from './Screens/EsqueciSenhaScreen';
import MenuPrincipalScreen from './Screens/MenuPrincipalScreen';
import ListaCuidadoresScreen from './Screens/ListaCuidadoresScreen';
import ListaZeladosScreen from './Screens/ListaZeladosScreen';
import ResumoDiaScreen from './Screens/ResumoDiaScreen';
import ConvidarScreen from './Screens/ConvidarScreen';
import MedicamentosScreen from './Screens/MedicamentosScreen';
import CadastroMedicamentoScreen from './Screens/CadastroMedicamentoScreen';
import TratamentosScreen from './Screens/TratamentosScreen';
import PerfilScreen from './Screens/PerfilScreen';
import AnotacoesScreen from './Screens/AnotacoesScreen';
import MapaScreen from './Screens/MapaScreen';
import NavegacaoModal from './Screens/NavegacaoModal';
import ConfirmacaoIngestaoModal from './Screens/ConfirmacaoIngestaoModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('inicio');
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({});
  const [cuidadores, setCuidadores] = useState([]);
  const [zelados, setZelados] = useState([]);
  const [assuntosResumo, setAssuntosResumo] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [anotacoes, setAnotacoes] = useState([]);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState(null);

  // Controle do Alarme de Confirmar Dose Ativo (RF010, RF015)
  const [modalIngetaoVisible, setModalIngestaoVisible] = useState(false);
  const [medicamentoParaConfirmar, setMedicamentoParaConfirmar] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authenticatedUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            if (data.cuidadores) setCuidadores(data.cuidadores);
            if (data.zelados) setZelados(data.zelados);
          }
        } catch (e) {}
      } else {
        setUserProfile({});
        setCuidadores([]);
        setZelados([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setUserProfile(data);
        if (data.cuidadores) setCuidadores(data.cuidadores);
        if (data.zelados) setZelados(data.zelados);
      }
    });

    const unsubMeds = onSnapshot(
      collection(db, 'users', user.uid, 'medicamentos'),
      (snapshot) => {
        const medsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMedicamentos(medsData);

        const resumoItems = medsData.map((m) => ({
          titulo: `${m.nome} - Horário: ${m.horario || 'Agendado'}`,
          descricao: `Dose: ${m.dose || '1 comprimido'}. Restantes no estoque: ${m.quantidade || '0'}`,
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

    // Escuta toque em notificações do SO (RF015)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const medId = response.notification.request.content.data?.medicamentoId;
      if (medId) {
        const medEncontrado = medicamentos.find((m) => m.id === medId);
        if (medEncontrado) {
          setMedicamentoParaConfirmar(medEncontrado);
          setModalIngestaoVisible(true);
        }
      }
    });

    return () => {
      unsubUserDoc();
      unsubMeds();
      unsubNotes();
      subscription.remove();
    };
  }, [user, medicamentos]);

  const voltarAoMenu = () => setCurrentScreen('menu');

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

      {/* Modal Interativa do Alarme de Medicamento */}
      <ConfirmacaoIngestaoModal
        visible={modalIngetaoVisible}
        medicamento={medicamentoParaConfirmar}
        userId={user?.uid}
        onClose={() => setModalIngestaoVisible(false)}
        onConfirmado={() => setModalIngestaoVisible(false)}
      />

      <NavegacaoModal
        visible={navModalVisible}
        onClose={() => setNavModalVisible(false)}
        onNavigateToZelados={() => setCurrentScreen('zelados')}
        onNavigateToMedicamentos={() => setCurrentScreen('medicamentos')}
        onNavigateToResumo={() => setCurrentScreen('resumo')}
        onNavigateToAnotacoes={() => setCurrentScreen('anotacoes')}
        onNavigateToPerfil={() => setCurrentScreen('perfil')}
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
            fotoUsuario={userProfile.fotoUrl || user?.photoURL}
            onOpenNav={() => setNavModalVisible(true)}
            onNavigateToCuidadores={() => setCurrentScreen('cuidadores')}
            onNavigateToZelados={() => setCurrentScreen('zelados')}
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

        {currentScreen === 'zelados' && (
          <ListaZeladosScreen zelados={zelados} onVoltar={voltarAoMenu} />
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
              setMedicamentoParaConfirmar(med);
              setModalIngestaoVisible(true);
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

        {currentScreen === 'tratamentos' && (
          <TratamentosScreen userId={user?.uid} onVoltar={voltarAoMenu} />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  screenContainer: { flex: 1 },
});
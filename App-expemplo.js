import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, StatusBar } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

import { auth, db } from './firebase';
import { sincronizarAlarmesLocais } from './services/NotificationService';
import InicioScreen from './Screens/InicioScreen';
import LoginScreen from './Screens/LoginScreen';
import CriarContaScreen from './Screens/CriarContaScreen';
import EsqueciSenhaScreen from './Screens/EsqueciSenhaScreen';
import MenuPrincipalScreen from './Screens/MenuPrincipalScreen';
import MenuCuidadoScreen from './Screens/MenuCuidadoScreen';
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
  const [zeladoSelecionado, setZeladoSelecionado] = useState(null);

  const [medicamentos, setMedicamentos] = useState([]);
  const [tratamentos, setTratamentos] = useState([]);
  const [anotacoes, setAnotacoes] = useState([]);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState(null);

  const [modalIngetaoVisible, setModalIngestaoVisible] = useState(false);
  const [medicamentoParaConfirmar, setMedicamentoParaConfirmar] = useState(null);

  // UID completo do perfil ativo (zelado selecionado no Menu do Cuidado ou o próprio usuário logado)
  const activeTargetUserId = zeladoSelecionado?.uid || zeladoSelecionado?.id || user?.uid;
  const isGerenciandoZelado = Boolean(
    zeladoSelecionado && activeTargetUserId && activeTargetUserId !== user?.uid
  );

  // 1. Garante documento do usuário e registro do código de pareamento de 6 dígitos
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        try {
          const userRef = doc(db, 'users', authenticatedUser.uid);
          const userDoc = await getDoc(userRef);
          const codigoCurto = authenticatedUser.uid.substring(0, 6).toLowerCase();

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            if (data.cuidadores) setCuidadores(data.cuidadores);
            if (data.zelados) setZelados(data.zelados);

            await setDoc(
              doc(db, 'codigosPareamento', data.codigoPareamento || codigoCurto),
              {
                uid: authenticatedUser.uid,
                nome: data.nome || authenticatedUser.displayName || 'Usuário Zelo',
                email: data.email || authenticatedUser.email || '',
                fotoUrl: data.fotoUrl || authenticatedUser.photoURL || '',
              },
              { merge: true }
            );
          } else {
            const novoPerfil = {
              uid: authenticatedUser.uid,
              nome: authenticatedUser.displayName || 'Usuário Zelo',
              email: authenticatedUser.email || '',
              fotoUrl: authenticatedUser.photoURL || '',
              codigoPareamento: codigoCurto,
            };
            await setDoc(userRef, novoPerfil, { merge: true });
            await setDoc(
              doc(db, 'codigosPareamento', codigoCurto),
              {
                uid: authenticatedUser.uid,
                nome: novoPerfil.nome,
                email: novoPerfil.email,
                fotoUrl: novoPerfil.fotoUrl,
              },
              { merge: true }
            );
            setUserProfile(novoPerfil);
          }
        } catch (e) {}
      } else {
        setUserProfile({});
        setCuidadores([]);
        setZelados([]);
        setZeladoSelecionado(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Escuta alterações no documento do usuário logado (vínculos em tempo real)
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

    return () => unsubUserDoc();
  }, [user]);

  // 3. Escuta medicamentos, tratamentos e anotações do contexto ativo (zelado ou próprio usuário)
  useEffect(() => {
    if (!activeTargetUserId) return;

    const unsubMeds = onSnapshot(
      collection(db, 'users', activeTargetUserId, 'medicamentos'),
      (snapshot) => {
        const medsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMedicamentos(medsData);
      },
      () => {}
    );

    const unsubTrats = onSnapshot(
      collection(db, 'users', activeTargetUserId, 'tratamentos'),
      (snapshot) => {
        const tratsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTratamentos(tratsData);
      },
      () => {}
    );

    const unsubNotes = onSnapshot(
      collection(db, 'users', activeTargetUserId, 'anotacoes'),
      (snapshot) => {
        const notesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAnotacoes(notesData);
      },
      () => {}
    );

    return () => {
      unsubMeds();
      unsubTrats();
      unsubNotes();
    };
  }, [activeTargetUserId]);

  // 4. Quando o usuário está no próprio dispositivo (!isGerenciandoZelado), sincroniza os alarmes locais
  // sempre que o cuidador adicionar ou editar remédios/tratamentos no Firestore
  useEffect(() => {
    if (!user || isGerenciandoZelado) return;
    sincronizarAlarmesLocais(medicamentos, tratamentos);
  }, [user, isGerenciandoZelado, medicamentos, tratamentos]);

  // 5. Escuta toque na notificação de alarme no celular do zelado
  useEffect(() => {
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

    return () => subscription.remove();
  }, [medicamentos]);

  // Consolida remédios e tratamentos para a tela de Resumo do Dia
  const assuntosResumo = [
    ...medicamentos.map((m) => ({
      titulo: `💊 ${m.nome} - Horário: ${m.horario || 'Agendado'}`,
      descricao: `Dose: ${m.dose || '1 comprimido'} • Estoque: ${m.quantidade || '0'}`,
    })),
    ...tratamentos.map((t) => ({
      titulo: `📅 ${t.titulo} - ${t.dataHora || 'Agendado'}`,
      descricao: `${t.local ? `Local: ${t.local} • ` : ''}${
        t.confirmado ? 'Presença confirmada' : 'Aguardando comparecimento'
      }`,
    })),
  ];

  const voltarAoMenuPrincipal = () => {
    setZeladoSelecionado(null);
    setCurrentScreen('menu');
  };

  const voltarAoContextoAtual = () => {
    if (zeladoSelecionado) {
      setCurrentScreen('menuCuidado');
    } else {
      setCurrentScreen('menu');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setZeladoSelecionado(null);
      setCurrentScreen('login');
    } catch (e) {
      setCurrentScreen('login');
    }
  };

  const nomeExibicao = userProfile.nome || user?.displayName || 'Ana';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ConfirmacaoIngestaoModal
        visible={modalIngetaoVisible}
        medicamento={medicamentoParaConfirmar}
        userId={activeTargetUserId}
        onClose={() => setModalIngestaoVisible(false)}
        onConfirmado={() => setModalIngestaoVisible(false)}
      />

      <NavegacaoModal
        visible={navModalVisible}
        onClose={() => setNavModalVisible(false)}
        onNavigateToZelados={() => {
          setZeladoSelecionado(null);
          setCurrentScreen('zelados');
        }}
        onNavigateToMedicamentos={() => setCurrentScreen('medicamentos')}
        onNavigateToResumo={() => setCurrentScreen('resumo')}
        onNavigateToAnotacoes={() => setCurrentScreen('anotacoes')}
        onNavigateToPerfil={() => {
          setZeladoSelecionado(null);
          setCurrentScreen('perfil');
        }}
        onLogout={handleLogout}
      />

      <View style={styles.screenContainer}>
        {currentScreen === 'inicio' && (
          <InicioScreen onFinish={() => setCurrentScreen(user ? 'menu' : 'login')} />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onNavigateToRegister={() => setCurrentScreen('criar')}
            onNavigateToForgotPassword={() => setCurrentScreen('esqueciSenha')}
            onAuthenticationSuccess={voltarAoMenuPrincipal}
          />
        )}

        {currentScreen === 'esqueciSenha' && (
          <EsqueciSenhaScreen onVoltar={() => setCurrentScreen('login')} />
        )}

        {currentScreen === 'criar' && (
          <CriarContaScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onAuthenticationSuccess={voltarAoMenuPrincipal}
          />
        )}

        {currentScreen === 'menu' && (
          <MenuPrincipalScreen
            nomeUsuario={nomeExibicao}
            fotoUsuario={userProfile.fotoUrl || user?.photoURL}
            onOpenNav={() => setNavModalVisible(true)}
            onNavigateToCuidadores={() => setCurrentScreen('cuidadores')}
            onNavigateToZelados={() => setCurrentScreen('zelados')}
            onNavigateToResumo={() => {
              setZeladoSelecionado(null);
              setCurrentScreen('resumo');
            }}
            onNavigateToConvidar={() => setCurrentScreen('convidar')}
            onNavigateToMedicamentos={() => {
              setZeladoSelecionado(null);
              setCurrentScreen('medicamentos');
            }}
            onNavigateToAnotacoes={() => {
              setZeladoSelecionado(null);
              setCurrentScreen('anotacoes');
            }}
            onNavigateToMapa={() => setCurrentScreen('mapa')}
            onNavigateToPerfil={() => setCurrentScreen('perfil')}
          />
        )}

        {currentScreen === 'cuidadores' && (
          <ListaCuidadoresScreen cuidadores={cuidadores} onVoltar={voltarAoMenuPrincipal} />
        )}

        {currentScreen === 'zelados' && (
          <ListaZeladosScreen
            zelados={zelados}
            onVoltar={voltarAoMenuPrincipal}
            onSelectZelado={(zelado) => {
              setZeladoSelecionado(zelado);
              setCurrentScreen('menuCuidado');
            }}
          />
        )}

        {currentScreen === 'menuCuidado' && (
          <MenuCuidadoScreen
            zelado={zeladoSelecionado}
            onVoltarListaZelados={() => {
              setZeladoSelecionado(null);
              setCurrentScreen('zelados');
            }}
            onVoltarMenuPrincipal={voltarAoMenuPrincipal}
            onNavigateToMedicamentos={() => setCurrentScreen('medicamentos')}
            onNavigateToTratamentos={() => setCurrentScreen('tratamentos')}
            onNavigateToAnotacoes={() => setCurrentScreen('anotacoes')}
            onNavigateToResumo={() => setCurrentScreen('resumo')}
          />
        )}

        {currentScreen === 'resumo' && (
          <ResumoDiaScreen assuntos={assuntosResumo} onVoltar={voltarAoContextoAtual} />
        )}

        {currentScreen === 'convidar' && (
          <ConvidarScreen
            userProfile={userProfile}
            currentUserId={user?.uid}
            onVoltar={voltarAoMenuPrincipal}
            onConexaoSucesso={voltarAoMenuPrincipal}
          />
        )}

        {currentScreen === 'medicamentos' && (
          <MedicamentosScreen
            medicamentos={medicamentos}
            userId={activeTargetUserId}
            zeladoNome={zeladoSelecionado?.nome}
            onVoltar={voltarAoContextoAtual}
            onNavigateToCadastro={() => {
              setMedicamentoSelecionado(null);
              setCurrentScreen('cadastroMedicamento');
            }}
            onEditMedicamento={(med) => {
              setMedicamentoSelecionado(med);
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
            userId={activeTargetUserId}
            isGerenciandoZelado={isGerenciandoZelado}
            medicamentoSelecionado={medicamentoSelecionado}
            onVoltar={() => setCurrentScreen('medicamentos')}
            onSalvo={() => setCurrentScreen('medicamentos')}
          />
        )}

        {currentScreen === 'tratamentos' && (
          <TratamentosScreen
            userId={activeTargetUserId}
            zeladoNome={zeladoSelecionado?.nome}
            onVoltar={voltarAoContextoAtual}
          />
        )}

        {currentScreen === 'perfil' && (
          <PerfilScreen
            userProfile={userProfile}
            userId={user?.uid}
            onVoltar={voltarAoMenuPrincipal}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'anotacoes' && (
          <AnotacoesScreen
            anotacoes={anotacoes}
            userId={activeTargetUserId}
            zeladoNome={zeladoSelecionado?.nome}
            onVoltar={voltarAoContextoAtual}
            onAnotacaoAdicionada={() => {}}
          />
        )}

        {currentScreen === 'mapa' && <MapaScreen onVoltar={voltarAoMenuPrincipal} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  screenContainer: { flex: 1 },
});
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

import { auth, db } from './firebase';
import { sincronizarAlarmesLocais } from './Screens/NotificationService';
import InicioScreen from './Screens/InicioScreen';
import LoginScreen from './Screens/LoginScreen';
import CriarContaScreen from './Screens/CriarContaScreen';
import EsqueciSenhaScreen from './Screens/EsqueciSenhaScreen';
import MenuPrincipalScreen from './Screens/MenuPrincipalScreen';
import MenuCuidadoScreen from './Screens/MenuCuidadoScreen';
import ListaCuidadoresScreen from './Screens/ListaCuidadoresScreen';
import ListaZeladosScreen from './Screens/ListaZeladosScreen';
import ResumoDiaScreen from './Screens/ResumoDiaScreen';
import AgendaScreen from './Screens/AgendaScreen';
import ConvidarScreen from './Screens/ConvidarScreen';
import MedicamentosScreen from './Screens/MedicamentosScreen';
import CadastroMedicamentoScreen from './Screens/CadastroMedicamentoScreen';
import TratamentosScreen from './Screens/TratamentosScreen';
import PerfilScreen from './Screens/PerfilScreen';
import AnotacoesScreen from './Screens/AnotacoesScreen';
import MapaScreen from './Screens/MapaScreen';
import NavegacaoModal from './Screens/NavegacaoModal';
import ConfirmacaoIngestaoModal from './Screens/ConfirmacaoIngestaoModal';

function combinarVinculos(legados, vinculados) {
  const itens = [
    ...(Array.isArray(legados) ? legados : []),
    ...(Array.isArray(vinculados) ? vinculados : []),
  ];
  const vistos = new Set();

  return itens.filter((item) => {
    const chave =
      typeof item === 'string'
        ? item
        : item?.id || item?.uid || item?.email || item?.nome;
    if (!chave || vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('inicio');
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({});
  const [cuidadores, setCuidadores] = useState([]);
  const [cuidadoresVinculados, setCuidadoresVinculados] = useState([]);
  const [zelados, setZelados] = useState([]);
  const [zeladosVinculados, setZeladosVinculados] = useState([]);
  const [zeladoSelecionado, setZeladoSelecionado] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [tratamentos, setTratamentos] = useState([]);
  const [anotacoes, setAnotacoes] = useState([]);
  const [medicamentosDoUsuarioId, setMedicamentosDoUsuarioId] = useState(null);
  const [tratamentosDoUsuarioId, setTratamentosDoUsuarioId] = useState(null);
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState(null);
  const medicamentosRef = useRef([]);

  // Controle do Alarme de Confirmar Dose Ativo (RF010, RF015)
  const [modalIngetaoVisible, setModalIngestaoVisible] = useState(false);
  const [medicamentoParaConfirmar, setMedicamentoParaConfirmar] = useState(null);

  const activeTargetUserId = zeladoSelecionado?.uid || zeladoSelecionado?.id || user?.uid;
  const isGerenciandoZelado = Boolean(
    zeladoSelecionado && activeTargetUserId && activeTargetUserId !== user?.uid
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authenticatedUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            setCuidadores(Array.isArray(data.cuidadores) ? data.cuidadores : []);
            setZelados(Array.isArray(data.zelados) ? data.zelados : []);
          }
        } catch (error) {
          console.error('Falha ao carregar o perfil do Firestore:', error);
        }
      } else {
        setUserProfile({});
        setCuidadores([]);
        setCuidadoresVinculados([]);
        setZelados([]);
        setZeladosVinculados([]);
        setZeladoSelecionado(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubUserDoc = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setUserProfile(data);
          setCuidadores(Array.isArray(data.cuidadores) ? data.cuidadores : []);
          setZelados(Array.isArray(data.zelados) ? data.zelados : []);
        }
      },
      (error) => console.error('Falha no listener do perfil do Firestore:', error)
    );

    return () => unsubUserDoc();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const unsubCaregivers = onSnapshot(
      collection(db, 'users', user.uid, 'cuidadores'),
      (snapshot) => {
        setCuidadoresVinculados(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error('Falha no listener de cuidadores do Firestore:', error)
    );
    const unsubZelados = onSnapshot(
      collection(db, 'users', user.uid, 'zelados'),
      (snapshot) => {
        setZeladosVinculados(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error('Falha no listener de zelados do Firestore:', error)
    );

    return () => {
      unsubCaregivers();
      unsubZelados();
    };
  }, [user]);

  useEffect(() => {
    if (!activeTargetUserId) return;

    const unsubMeds = onSnapshot(
      collection(db, 'users', activeTargetUserId, 'medicamentos'),
      (snapshot) => {
        const medsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMedicamentos(medsData);
        setMedicamentosDoUsuarioId(activeTargetUserId);
      },
      (error) => console.error('Falha no listener de medicamentos do Firestore:', error)
    );

    const unsubTreatments = onSnapshot(
      collection(db, 'users', activeTargetUserId, 'tratamentos'),
      (snapshot) => {
        setTratamentos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTratamentosDoUsuarioId(activeTargetUserId);
      },
      (error) => console.error('Falha no listener de tratamentos do Firestore:', error)
    );

    const unsubNotes = onSnapshot(
      collection(db, 'users', activeTargetUserId, 'anotacoes'),
      (snapshot) => {
        const notesData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAnotacoes(notesData);
      },
      (error) => console.error('Falha no listener de anotações do Firestore:', error)
    );

    return () => {
      unsubMeds();
      unsubTreatments();
      unsubNotes();
    };
  }, [activeTargetUserId]);

  const medicamentosVisiveis = useMemo(
    () => (medicamentosDoUsuarioId === activeTargetUserId ? medicamentos : []),
    [medicamentosDoUsuarioId, activeTargetUserId, medicamentos]
  );
  const tratamentosVisiveis = useMemo(
    () => (tratamentosDoUsuarioId === activeTargetUserId ? tratamentos : []),
    [tratamentosDoUsuarioId, activeTargetUserId, tratamentos]
  );

  useEffect(() => {
    if (!user || activeTargetUserId !== user.uid) return;
    if (medicamentosDoUsuarioId !== user.uid || tratamentosDoUsuarioId !== user.uid) return;

    sincronizarAlarmesLocais(medicamentosVisiveis, tratamentosVisiveis).catch((error) => {
      console.error('Falha ao sincronizar alarmes locais:', error);
    });
  }, [
    user,
    activeTargetUserId,
    medicamentosDoUsuarioId,
    tratamentosDoUsuarioId,
    medicamentosVisiveis,
    tratamentosVisiveis,
  ]);

  useEffect(() => {
    medicamentosRef.current = medicamentosVisiveis;
  }, [medicamentosVisiveis]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const medId = response.notification.request.content.data?.medicamentoId;
      if (medId) {
        const medEncontrado = medicamentosRef.current.find((m) => m.id === medId);
        if (medEncontrado) {
          setMedicamentoParaConfirmar(medEncontrado);
          setModalIngestaoVisible(true);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const voltarAoMenu = () => {
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
    } catch (_e) {
      setZeladoSelecionado(null);
      setCurrentScreen('login');
    }
  };

  const nomeExibicao = userProfile.nome || user?.displayName || 'Ana';
  const cuidadoresExibidos = combinarVinculos(cuidadores, cuidadoresVinculados);
  const zeladosExibidos = combinarVinculos(zelados, zeladosVinculados);
  const assuntosResumo = [
    ...medicamentosVisiveis.map((medicamento) => ({
      titulo: `💊 ${medicamento.nome} - Horário: ${
        (Array.isArray(medicamento.horarios) ? medicamento.horarios : [medicamento.horario])
          .filter(Boolean)
          .join(' • ') || 'Agendado'
      }`,
      descricao: `Dose: ${medicamento.dose || '1 comprimido'} • Estoque: ${medicamento.quantidade || '0'}`,
    })),
    ...tratamentosVisiveis.map((tratamento) => ({
      titulo: `📅 ${tratamento.titulo} - ${tratamento.dataHora || 'Agendado'}`,
      descricao: `${tratamento.local ? `Local: ${tratamento.local} • ` : ''}${
        tratamento.confirmado ? 'Presença confirmada' : 'Aguardando comparecimento'
      }`,
    })),
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Modal Interativa do Alarme de Medicamento */}
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
          onNavigateToMedicamentos={() => {
            setZeladoSelecionado(null);
            setCurrentScreen('medicamentos');
          }}
          onNavigateToTratamentos={() => setCurrentScreen('tratamentos')}
          onNavigateToResumo={() => setCurrentScreen('agenda')}
          onNavigateToAnotacoes={() => {
            setZeladoSelecionado(null);
            setCurrentScreen('anotacoes');
          }}
          onNavigateToPerfil={() => {
            setZeladoSelecionado(null);
            setCurrentScreen('perfil');
          }}
          onNavigateToMapa={() => setCurrentScreen('mapa')}
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
            <ListaCuidadoresScreen cuidadores={cuidadoresExibidos} onVoltar={voltarAoMenu} />
          )}

          {currentScreen === 'zelados' && (
            <ListaZeladosScreen
              zelados={zeladosExibidos}
              onVoltar={voltarAoMenu}
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
              onVoltarMenuPrincipal={() => {
                setZeladoSelecionado(null);
                setCurrentScreen('menu');
              }}
              onNavigateToMedicamentos={() => setCurrentScreen('medicamentos')}
              onNavigateToTratamentos={() => setCurrentScreen('tratamentos')}
              onNavigateToAnotacoes={() => setCurrentScreen('anotacoes')}
              onNavigateToResumo={() => setCurrentScreen('resumo')}
            />
          )}

          {currentScreen === 'resumo' && (
            <ResumoDiaScreen assuntos={assuntosResumo} onVoltar={voltarAoContextoAtual} />
          )}

          {currentScreen === 'agenda' && (
            <AgendaScreen
              userId={activeTargetUserId}
              zeladoNome={zeladoSelecionado?.nome}
              onVoltar={voltarAoContextoAtual}
            />
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
              medicamentos={medicamentosVisiveis}
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
              onVoltar={voltarAoMenu}
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

          {currentScreen === 'mapa' && <MapaScreen onVoltar={voltarAoContextoAtual} />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  screenContainer: { flex: 1 },
});
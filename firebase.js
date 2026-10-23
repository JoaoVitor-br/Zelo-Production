import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
apiKey: "AIzaSyBxsvd8PA7qIqijCmsu925hSF4RbuoZ-Hc",
  authDomain: "zelo-projeto.firebaseapp.com",
  projectId: "zelo-projeto",
  storageBucket: "zelo-projeto.firebasestorage.app",
  messagingSenderId: "586527342856",
  appId: "1:586527342856:web:f20d891bdb30919a0aacbd",
  measurementId: "G-TC5V4131T7"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const analytics =
  Platform.OS === 'web'
    ? import('firebase/analytics')
        .then(async ({ getAnalytics, isSupported }) =>
          (await isSupported()) ? getAnalytics(app) : null,
        )
        .catch(() => null)
    : null;

export function getFirebaseErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/operation-not-allowed': 'Ative o provedor E-mail/senha no Firebase Console > Authentication.',
    'auth/admin-restricted-operation': 'Ative o provedor E-mail/senha no Firebase Console > Authentication.',
    'auth/configuration-not-found': 'O Firebase Authentication não está configurado neste projeto. Ative o Authentication e o provedor E-mail/senha no Firebase Console.',
    'auth/invalid-api-key': 'A chave da API do Firebase é inválida. Confira a configuração do projeto.',
    'auth/requests-to-this-api-are-blocked': 'A chave do Firebase está bloqueada para esta API.',
    'auth/unauthorized-domain': 'Este domínio não está autorizado no Firebase Authentication.',
    'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente novamente.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'permission-denied': 'O Firestore recusou o acesso. Confira as regras de segurança.',
    'firestore/permission-denied': 'O Firestore recusou o acesso. Confira as regras de segurança.',
    'failed-precondition': 'O Firestore não está configurado neste projeto Firebase.',
    'firestore/failed-precondition': 'O Firestore não está configurado neste projeto Firebase.',
    'not-found': 'O banco Firestore não foi encontrado.',
    'unavailable': 'Não foi possível conectar ao Firebase. Verifique sua conexão.',
    'firestore/unavailable': 'Não foi possível conectar ao Firebase. Verifique sua conexão.',
  };

  return (
    messages[error?.code] ||
    (error?.code ? `Erro do Firebase (${error.code}).` : 'Não foi possível concluir a operação. Tente novamente.')
  );
}
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// Configuração do comportamento das notificações locais quando o aplicativo está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permissão para disparo de alarmes e notificações locais.
 */
export async function solicitarPermissaoNotificacoes() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('zelo-alarmes', {
      name: 'Alarmes de Medicamentos e Tratamentos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0084C8',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Agenda alarme recorrente local no SO para o horário do medicamento (RF009, RNF005).
 */
export async function agendarAlarmeMedicamento(medicamento) {
  const temPermissao = await solicitarPermissaoNotificacoes();
  if (!temPermissao) return null;

  const [horasStr, minutosStr] = (medicamento.horario || '08:00').split(':');
  const hora = parseInt(horasStr, 10) || 8;
  const minuto = parseInt(minutosStr, 10) || 0;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Hora do Medicamento: ${medicamento.nome}`,
        body: `Dose: ${medicamento.dose || '1 comprimido'}. Clique para confirmar a ingestão.`,
        data: { medicamentoId: medicamento.id, tipo: 'MEDICAMENTO', foto: medicamento.imagem },
        sound: 'default',
      },
      trigger: {
        hour: hora,
        minute: minuto,
        repeats: true,
        channelId: 'zelo-alarmes',
      },
    });

    return notificationId;
  } catch (error) {
    return null;
  }
}

/**
 * Cancela o alarme local agendado.
 */
export async function cancelarAlarme(notificationId) {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {}
  }
}

/**
 * Leitura por Voz (Text-To-Speech) para acessibilidade (RNF003, RF010, RF011).
 */
export function lerTextoEmVozAlta(texto) {
  if (!texto) return;

  Speech.stop();
  Speech.speak(texto, {
    language: 'pt-BR',
    pitch: 1.0,
    rate: 0.9,
  });
}

/**
 * Para a síntese de voz ativa.
 */
export function pararVoz() {
  Speech.stop();
}
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function solicitarPermissaoNotificacoes() {
  if (Platform.OS === 'web') return false;

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

export async function agendarAlarmeMedicamento(medicamento) {
  const temPermissao = await solicitarPermissaoNotificacoes();
  if (!temPermissao) return null;

  try {
    const horarios = Array.isArray(medicamento.horarios)
      ? medicamento.horarios
      : [medicamento.horario || '08:00'];
    const ids = [];

    for (const horario of horarios) {
      const [horasStr, minutosStr] = String(horario).trim().split(':');
      const hora = parseInt(horasStr, 10);
      const minuto = parseInt(minutosStr, 10);
      if (isNaN(hora) || isNaN(minuto)) continue;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Hora do Medicamento: ${medicamento.nome}`,
          body: `Dose: ${medicamento.dose || '1 comprimido'}. Toque para confirmar a ingestão.`,
          data: {
            medicamentoId: medicamento.id,
            horarioAlarme: `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`,
            tipo: 'MEDICAMENTO',
            foto: medicamento.imagem,
          },
          sound: 'default',
        },
        trigger: {
          hour: hora,
          minute: minuto,
          repeats: true,
          channelId: 'zelo-alarmes',
        },
      });
      ids.push(notificationId);
    }

    return ids.length ? ids : null;
  } catch (error) {
    return null;
  }
}

export async function agendarAlarmeTratamento(tratamento) {
  const temPermissao = await solicitarPermissaoNotificacoes();
  if (!temPermissao || tratamento.confirmado) return null;

  // Extrai horário no formato HH:MM caso o campo dataHora contenha hora (ex: "20/11 às 14:00")
  const matchHora = (tratamento.dataHora || '').match(/(\d{1,2}):(\d{2})/);
  if (!matchHora) return null;

  const hora = parseInt(matchHora[1], 10);
  const minuto = parseInt(matchHora[2], 10);

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 Lembrete de Consulta/Tratamento: ${tratamento.titulo}`,
        body: `${tratamento.dataHora}${tratamento.local ? ` • Local: ${tratamento.local}` : ''}`,
        data: { tratamentoId: tratamento.id, tipo: 'TRATAMENTO' },
        sound: 'default',
      },
      trigger: {
        hour: hora,
        minute: minuto,
        repeats: false,
        channelId: 'zelo-alarmes',
      },
    });

    return notificationId;
  } catch (error) {
    return null;
  }
}

/**
 * Reagenda todos os alarmes locais no dispositivo do usuário monitorado sempre que
 * o cuidador adicionar, editar ou remover remédios/tratamentos no Firestore.
 */
export async function sincronizarAlarmesLocais(medicamentos = [], tratamentos = []) {
  const temPermissao = await solicitarPermissaoNotificacoes();
  if (!temPermissao) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const med of medicamentos) {
      await agendarAlarmeMedicamento(med);
    }

    for (const trat of tratamentos) {
      if (!trat.confirmado) {
        await agendarAlarmeTratamento(trat);
      }
    }
  } catch (e) {}
}

export async function cancelarAlarme(notificationId) {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {}
  }
}

export function lerTextoEmVozAlta(texto) {
  if (!texto) return;

  Speech.stop();
  Speech.speak(texto, {
    language: 'pt-BR',
    pitch: 1.0,
    rate: 0.9,
  });
}

export function pararVoz() {
  Speech.stop();
}
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from './AppText';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { COLORS, FONTS } from '../theme';

const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarChaveData(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function criarDataLocal(ano, mes, dia) {
  const date = new Date(ano, mes, dia);
  date.setHours(0, 0, 0, 0);
  return date;
}

function converterData(valor, anoPadrao = new Date().getFullYear()) {
  if (!valor) return null;

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return criarDataLocal(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }
  if (typeof valor?.toDate === 'function') {
    return converterData(valor.toDate(), anoPadrao);
  }

  const texto = String(valor);
  const isoMatch = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return criarDataLocal(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const brMatch = texto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (brMatch) {
    let ano = brMatch[3] ? Number(brMatch[3]) : anoPadrao;
    if (ano < 100) ano += 2000;
    return criarDataLocal(ano, Number(brMatch[2]) - 1, Number(brMatch[1]));
  }

  return null;
}

function extrairHora(texto) {
  const match = String(texto || '').match(/(?:às?\s*)?(\d{1,2}):(\d{2})/i);
  if (!match) return '';
  return `${String(match[1]).padStart(2, '0')}:${match[2]}`;
}

function medicamentoAtivoNaData(medicamento, date) {
  const inicio = converterData(medicamento.inicio);
  const fim = converterData(medicamento.fim);
  const diaSelecionado = criarDataLocal(date.getFullYear(), date.getMonth(), date.getDate());

  return (!inicio || diaSelecionado >= inicio) && (!fim || diaSelecionado <= fim);
}

function eventosDoDia(date, medicamentos, tratamentos) {
  const chaveData = formatarChaveData(date);
  const eventosMedicamento = medicamentos
    .filter((medicamento) => medicamentoAtivoNaData(medicamento, date))
    .map((medicamento) => ({
      id: `med-${medicamento.id}`,
      tipo: 'medicamento',
      horario: extrairHora(medicamento.horario) || 'Horário não definido',
      titulo: `Tomar ${medicamento.nome || 'medicamento'}`,
      detalhe: [medicamento.dose, medicamento.frequencia].filter(Boolean).join(' • '),
    }));

  const eventosTratamento = tratamentos
    .filter((tratamento) => {
      const data = converterData(tratamento.dataHora, date.getFullYear());
      return data && formatarChaveData(data) === chaveData;
    })
    .map((tratamento) => ({
      id: `trat-${tratamento.id}`,
      tipo: 'tratamento',
      horario: extrairHora(tratamento.dataHora) || 'Horário não definido',
      titulo: tratamento.titulo || 'Tratamento ou consulta',
      detalhe: [tratamento.local, tratamento.observacao].filter(Boolean).join(' • '),
    }));

  return [...eventosMedicamento, ...eventosTratamento].sort((a, b) => {
    if (a.horario === 'Horário não definido') return 1;
    if (b.horario === 'Horário não definido') return -1;
    return a.horario.localeCompare(b.horario);
  });
}

export default function AgendaScreen({ userId, zeladoNome = null, onVoltar = () => {} }) {
  const hoje = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const [mesExibido, setMesExibido] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [medicamentos, setMedicamentos] = useState([]);
  const [tratamentos, setTratamentos] = useState([]);
  const [usuarioMedicamentos, setUsuarioMedicamentos] = useState(null);
  const [usuarioTratamentos, setUsuarioTratamentos] = useState(null);
  const [erroMedicamentos, setErroMedicamentos] = useState(false);
  const [erroTratamentos, setErroTratamentos] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onVoltar();
      return true;
    });

    return () => subscription.remove();
  }, [onVoltar]);

  useEffect(() => {
    if (!userId) return undefined;

    const unsubMedicamentos = onSnapshot(
      collection(db, 'users', userId, 'medicamentos'),
      (snapshot) => {
        setMedicamentos(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setUsuarioMedicamentos(userId);
        setErroMedicamentos(false);
      },
      (error) => {
        console.error('Falha ao carregar medicamentos da agenda:', error);
        setUsuarioMedicamentos(userId);
        setErroMedicamentos(true);
      }
    );
    const unsubTratamentos = onSnapshot(
      collection(db, 'users', userId, 'tratamentos'),
      (snapshot) => {
        setTratamentos(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setUsuarioTratamentos(userId);
        setErroTratamentos(false);
      },
      (error) => {
        console.error('Falha ao carregar tratamentos da agenda:', error);
        setUsuarioTratamentos(userId);
        setErroTratamentos(true);
      }
    );

    return () => {
      unsubMedicamentos();
      unsubTratamentos();
    };
  }, [userId]);

  const medicamentosVisiveis = useMemo(
    () => (usuarioMedicamentos === userId ? medicamentos : []),
    [usuarioMedicamentos, userId, medicamentos]
  );
  const tratamentosVisiveis = useMemo(
    () => (usuarioTratamentos === userId ? tratamentos : []),
    [usuarioTratamentos, userId, tratamentos]
  );
  const carregando = Boolean(userId) && (
    usuarioMedicamentos !== userId || usuarioTratamentos !== userId
  );
  const houveErro = (
    (usuarioMedicamentos === userId && erroMedicamentos)
    || (usuarioTratamentos === userId && erroTratamentos)
  );

  const eventosSelecionados = useMemo(
    () => eventosDoDia(dataSelecionada, medicamentosVisiveis, tratamentosVisiveis),
    [dataSelecionada, medicamentosVisiveis, tratamentosVisiveis]
  );

  const diasDoMes = useMemo(() => {
    const ano = mesExibido.getFullYear();
    const mes = mesExibido.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const celulas = Array(primeiroDia).fill(null);

    for (let dia = 1; dia <= totalDias; dia += 1) {
      celulas.push(criarDataLocal(ano, mes, dia));
    }
    while (celulas.length % 7 !== 0) celulas.push(null);
    return celulas;
  }, [mesExibido]);

  const datasComEventos = useMemo(() => {
    const datas = new Set();
    const ano = mesExibido.getFullYear();
    const mes = mesExibido.getMonth();

    medicamentosVisiveis.forEach((medicamento) => {
      for (let dia = 1; dia <= new Date(ano, mes + 1, 0).getDate(); dia += 1) {
        const date = criarDataLocal(ano, mes, dia);
        if (medicamentoAtivoNaData(medicamento, date)) {
          datas.add(formatarChaveData(date));
        }
      }
    });

    tratamentosVisiveis.forEach((tratamento) => {
      const data = converterData(tratamento.dataHora, ano);
      if (data && data.getFullYear() === ano && data.getMonth() === mes) {
        datas.add(formatarChaveData(data));
      }
    });
    return datas;
  }, [mesExibido, medicamentosVisiveis, tratamentosVisiveis]);

  const mudarMes = (quantidade) => {
    setMesExibido((atual) => new Date(atual.getFullYear(), atual.getMonth() + quantidade, 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onVoltar}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Image
            source={require('./assets/icons/arrow-left 1.png')}
            style={styles.backIcon}
          />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Agenda</Text>
        {!!zeladoNome && <Text style={styles.subtitle}>Agenda de {zeladoNome}</Text>}

        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => mudarMes(-1)}
              style={styles.monthArrow}
              accessibilityLabel="Mês anterior"
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MESES[mesExibido.getMonth()]} de {mesExibido.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => mudarMes(1)}
              style={styles.monthArrow}
              accessibilityLabel="Próximo mês"
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {DIAS_SEMANA.map((dia) => (
              <Text key={dia} style={styles.weekDay}>{dia}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {diasDoMes.map((date, index) => {
              if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const selected = formatarChaveData(date) === formatarChaveData(dataSelecionada);
              const today = formatarChaveData(date) === formatarChaveData(hoje);
              const hasEvents = datasComEventos.has(formatarChaveData(date));
              const fimDeSemana = date.getDay() === 0 || date.getDay() === 6;

              return (
                <TouchableOpacity
                  key={formatarChaveData(date)}
                  style={[
                    styles.dayCell,
                    styles.dayButton,
                    fimDeSemana && styles.weekendDay,
                    selected && styles.selectedDay,
                    today && !selected && styles.todayDay,
                  ]}
                  onPress={() => setDataSelecionada(date)}
                  accessibilityLabel={`${date.getDate()} de ${MESES[date.getMonth()]}`}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.dayText, selected && styles.selectedDayText]}>
                    {date.getDate()}
                  </Text>
                  {hasEvents && <View style={[styles.eventDot, selected && styles.selectedEventDot]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.selectedDate}>
          {`Dia ${dataSelecionada.getDate()} de ${MESES[dataSelecionada.getMonth()]} de ${dataSelecionada.getFullYear()}`}
        </Text>
        <Text style={styles.sectionTitle}>Lembretes:</Text>

        {carregando ? (
          <ActivityIndicator color={COLORS.primaryBlue} style={styles.loader} />
        ) : houveErro ? (
          <Text style={styles.emptyText}>
            Não foi possível carregar todos os itens da agenda. Verifique sua conexão e tente novamente.
          </Text>
        ) : eventosSelecionados.length ? (
          <View style={styles.eventsList}>
            {eventosSelecionados.map((evento, index) => (
              <View
                key={evento.id}
                style={[
                  styles.eventRow,
                  index % 2 === 0 && styles.eventRowAlternate,
                ]}
              >
                <Text style={styles.eventTime}>{evento.horario}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{evento.titulo}</Text>
                  {!!evento.detalhe && <Text style={styles.eventDetail}>{evento.detalhe}</Text>}
                  <Text style={styles.eventType}>
                    {evento.tipo === 'medicamento' ? 'Medicamento' : 'Tratamento / consulta'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhum medicamento ou tratamento marcado para este dia.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FBFE' },
  header: {
    height: 66,
    backgroundColor: '#BFE7FA',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 12 },
  backIcon: { width: 20, height: 20, resizeMode: 'contain' },
  backText: { color: COLORS.primaryBlue, fontSize: 17, fontWeight: FONTS.medium, marginLeft: 8 },
  closeButton: { width: 44, height: 44, justifyContent: 'center' },
  closeText: { color: COLORS.primaryBlue, fontSize: 44, lineHeight: 48, fontWeight: '400' },
  content: { paddingBottom: 28 },
  title: {
    fontFamily: FONTS.heading,
    color: COLORS.textDark,
    fontSize: 34,
    fontWeight: FONTS.bold,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  subtitle: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', marginTop: -12, marginBottom: 14 },
  calendar: {
    marginHorizontal: 18,
    padding: 10,
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthArrow: { width: 36, height: 34, justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: COLORS.primaryBlue, fontSize: 30, lineHeight: 34, fontWeight: FONTS.bold },
  monthTitle: { color: COLORS.textDark, fontSize: 17, fontWeight: FONTS.bold },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { width: `${100 / 7}%`, color: COLORS.textDark, fontSize: 13, fontWeight: FONTS.bold, textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: { backgroundColor: '#9ADFF8' },
  weekendDay: { backgroundColor: '#FF969C' },
  selectedDay: { borderWidth: 2, borderColor: COLORS.primaryBlue, backgroundColor: '#BFE7FA' },
  todayDay: { borderWidth: 1, borderColor: COLORS.primaryBlue },
  dayText: { color: COLORS.textDark, fontSize: 16, fontWeight: FONTS.medium },
  selectedDayText: { color: COLORS.primaryBlue, fontWeight: FONTS.bold },
  eventDot: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primaryBlue },
  selectedEventDot: { backgroundColor: COLORS.primaryBlue },
  selectedDate: {
    color: COLORS.textDark,
    fontSize: 20,
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    color: COLORS.textDark,
    fontSize: 28,
    fontWeight: FONTS.bold,
    marginHorizontal: 28,
    marginBottom: 6,
  },
  loader: { marginTop: 24 },
  eventsList: { paddingBottom: 8 },
  eventRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DDF5FE',
    paddingVertical: 11,
    paddingHorizontal: 26,
  },
  eventRowAlternate: { backgroundColor: '#F5FBFE' },
  eventTime: { color: COLORS.textDark, fontSize: 21, fontWeight: FONTS.bold, marginRight: 10 },
  eventInfo: { flex: 1 },
  eventTitle: { color: COLORS.textDark, fontSize: 20 },
  eventDetail: { color: COLORS.textMuted, fontSize: 14, marginTop: 3 },
  eventType: { color: COLORS.primaryBlue, fontSize: 12, fontWeight: FONTS.bold, marginTop: 4 },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 18,
  },
});

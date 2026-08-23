import {setGlobalOptions} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineString} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {calendar_v3 as CalendarV3, google} from "googleapis";

export {identificarEspecie} from "./identificarEspecie";

// For cost control, limit concurrent containers for this function set.
setGlobalOptions({maxInstances: 10});

initializeApp();

const CALENDAR_ID_PUBLICO = defineString("CALENDAR_ID_PUBLICO");
const CALENDAR_ID_DIRETORIA = defineString("CALENDAR_ID_DIRETORIA");

type VisibilidadeEvento = "publico" | "diretoria";

interface EventoDoc {
  googleEventId: string;
  calendarId: string;
  visibilidade: VisibilidadeEvento;
  titulo: string;
  descricao: string;
  local: string;
  inicio: string;
  fim: string;
  diaTodo: boolean;
  atualizadoEm: string;
}

/**
 * Cria um cliente autenticado da API do Google Calendar usando as
 * credenciais padrão do ambiente (service account do Cloud Functions).
 * @return {Promise<CalendarV3.Calendar>} Cliente autenticado.
 */
async function obterClienteCalendar(): Promise<CalendarV3.Calendar> {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  const authClient = await auth.getClient();
  return google.calendar({version: "v3", auth: authClient as never});
}

/**
 * Monta um ID de documento estável e único para um evento do Google
 * Calendar, combinando o ID da agenda e o ID do evento.
 * @param {string} calendarId ID da agenda de origem.
 * @param {string} googleEventId ID do evento no Google Calendar.
 * @return {string} ID do documento a usar no Firestore.
 */
function idDoDocumento(calendarId: string, googleEventId: string): string {
  const calendarIdSeguro = calendarId.replace(/[^a-zA-Z0-9]/g, "_");
  return `${calendarIdSeguro}_${googleEventId}`;
}

/**
 * Busca os próximos eventos do calendário informado e sincroniza com a
 * coleção /eventos do Firestore, removendo eventos futuros que não
 * vieram mais na resposta (cancelados ou alterados).
 * @param {CalendarV3.Calendar} calendar Cliente autenticado da API.
 * @param {string} calendarId ID da agenda a sincronizar.
 * @param {VisibilidadeEvento} visibilidade Quem pode ver os eventos.
 * @return {Promise<void>} Nada.
 */
async function sincronizarCalendario(
  calendar: CalendarV3.Calendar,
  calendarId: string,
  visibilidade: VisibilidadeEvento,
): Promise<void> {
  if (!calendarId) {
    return;
  }

  const agora = new Date().toISOString();
  const resposta = await calendar.events.list({
    calendarId,
    timeMin: agora,
    maxResults: 30,
    singleEvents: true,
    orderBy: "startTime",
  });

  const eventosGoogle = resposta.data.items ?? [];
  const db = getFirestore();
  const colecao = db.collection("eventos");
  const idsAtuais = new Set<string>();
  const lote = db.batch();

  for (const evento of eventosGoogle) {
    if (!evento.id || evento.status === "cancelled") {
      continue;
    }

    const inicioBruto = evento.start?.dateTime ?? evento.start?.date;
    const fimBruto = evento.end?.dateTime ?? evento.end?.date;
    if (!inicioBruto || !fimBruto) {
      continue;
    }

    const docId = idDoDocumento(calendarId, evento.id);
    idsAtuais.add(docId);

    const doc: EventoDoc = {
      googleEventId: evento.id,
      calendarId,
      visibilidade,
      titulo: evento.summary ?? "(sem título)",
      descricao: evento.description ?? "",
      local: evento.location ?? "",
      inicio: new Date(inicioBruto).toISOString(),
      fim: new Date(fimBruto).toISOString(),
      diaTodo: !evento.start?.dateTime,
      atualizadoEm: agora,
    };

    lote.set(colecao.doc(docId), doc);
  }

  const existentes = await colecao
    .where("calendarId", "==", calendarId)
    .where("inicio", ">=", agora)
    .get();

  for (const docSnap of existentes.docs) {
    if (!idsAtuais.has(docSnap.id)) {
      lote.delete(docSnap.ref);
    }
  }

  await lote.commit();
}

/**
 * Sincroniza um calendário e registra no log qualquer falha, sem
 * interromper a sincronização dos demais calendários.
 * @param {CalendarV3.Calendar} calendar Cliente autenticado da API.
 * @param {string} calendarId ID da agenda a sincronizar.
 * @param {VisibilidadeEvento} visibilidade Quem pode ver os eventos.
 * @return {Promise<void>} Nada.
 */
async function sincronizarComTratamentoDeErro(
  calendar: CalendarV3.Calendar,
  calendarId: string,
  visibilidade: VisibilidadeEvento,
): Promise<void> {
  try {
    await sincronizarCalendario(calendar, calendarId, visibilidade);
  } catch (erro) {
    logger.error(
      `Falha ao sincronizar calendário "${visibilidade}" ` +
        `(calendarId="${calendarId}"). Verifique se o ID está correto ` +
        "e se a agenda foi compartilhada com a service account " +
        "78211745730-compute@developer.gserviceaccount.com.",
      erro,
    );
  }
}

export const sincronizarEventosAgenda = onSchedule({
  schedule: "every 30 minutes",
  timeZone: "America/Sao_Paulo",
}, async () => {
  const calendar = await obterClienteCalendar();
  const publico = CALENDAR_ID_PUBLICO.value();
  const diretoria = CALENDAR_ID_DIRETORIA.value();
  await sincronizarComTratamentoDeErro(calendar, publico, "publico");
  await sincronizarComTratamentoDeErro(calendar, diretoria, "diretoria");
});

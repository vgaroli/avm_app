import { setGlobalOptions } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { calendar_v3, google } from "googleapis";

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This limit is a per-function limit.
setGlobalOptions({ maxInstances: 10 });

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

async function obterClienteCalendar(): Promise<calendar_v3.Calendar> {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  const authClient = await auth.getClient();
  return google.calendar({ version: "v3", auth: authClient as never });
}

function idDoDocumento(calendarId: string, googleEventId: string): string {
  return `${calendarId.replace(/[^a-zA-Z0-9]/g, "_")}_${googleEventId}`;
}

/**
 * Busca os próximos eventos do calendário informado e sincroniza com a
 * coleção /eventos do Firestore, removendo eventos futuros que não vieram
 * mais na resposta (cancelados ou alterados).
 */
async function sincronizarCalendario(
  calendar: calendar_v3.Calendar,
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

  const existentes = await colecao.where("calendarId", "==", calendarId).where("inicio", ">=", agora).get();

  for (const docSnap of existentes.docs) {
    if (!idsAtuais.has(docSnap.id)) {
      lote.delete(docSnap.ref);
    }
  }

  await lote.commit();
}

export const sincronizarEventosAgenda = onSchedule(
  { schedule: "every 30 minutes", timeZone: "America/Sao_Paulo" },
  async () => {
    const calendar = await obterClienteCalendar();
    await sincronizarCalendario(calendar, CALENDAR_ID_PUBLICO.value(), "publico");
    await sincronizarCalendario(calendar, CALENDAR_ID_DIRETORIA.value(), "diretoria");
  },
);

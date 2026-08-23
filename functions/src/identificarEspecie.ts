import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";

const PLANTNET_API_KEY = defineSecret("PLANTNET_API_KEY");

type TipoFoto = "inteira" | "folha" | "fruto" | "casca" | "flor";

const ORGAO_POR_TIPO: Record<TipoFoto, string> = {
  inteira: "habit",
  folha: "leaf",
  fruto: "fruit",
  casca: "bark",
  flor: "flower",
};

interface FotoRequisicao {
  url: string;
  tipo: TipoFoto;
}

interface IdentificarEspecieRequest {
  fotos: FotoRequisicao[];
}

interface SugestaoEspecie {
  nomeCientifico: string;
  nomesComuns: string[];
  confianca: number;
}

/**
 * Confirma que o uid autenticado pertence a uma pessoa diretoria ativa,
 * lançando HttpsError caso contrário.
 * @param {string | undefined} uid Uid do usuário autenticado na chamada.
 * @return {Promise<void>} Nada.
 */
async function verificarDiretoria(uid: string | undefined): Promise<void> {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Autenticação necessária.");
  }
  const snap = await getFirestore().collection("pessoas").doc(uid).get();
  const pessoa = snap.data();
  const autorizado = pessoa &&
    pessoa["status"] === "ativo" && pessoa["papel"] === "diretoria";
  if (!autorizado) {
    throw new HttpsError(
      "permission-denied",
      "Apenas diretoria pode identificar espécies.",
    );
  }
}

export const identificarEspecie = onCall(
  {secrets: [PLANTNET_API_KEY]},
  async (request): Promise<SugestaoEspecie[]> => {
    await verificarDiretoria(request.auth?.uid);

    const dados = request.data as IdentificarEspecieRequest;
    if (!dados?.fotos?.length || dados.fotos.length > 5) {
      throw new HttpsError("invalid-argument", "Envie de 1 a 5 fotos.");
    }

    const formData = new FormData();
    for (const foto of dados.fotos) {
      const resposta = await fetch(foto.url);
      if (!resposta.ok) {
        throw new HttpsError(
          "internal",
          `Falha ao baixar foto (${foto.tipo}).`,
        );
      }
      const blob = await resposta.blob();
      formData.append("organs", ORGAO_POR_TIPO[foto.tipo]);
      formData.append("images", blob, `${foto.tipo}.jpg`);
    }

    const url =
      `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY.value()}`;
    const respostaPlantnet = await fetch(url, {method: "POST", body: formData});
    if (!respostaPlantnet.ok) {
      logger.error("Falha na API Pl@ntNet", await respostaPlantnet.text());
      throw new HttpsError("internal", "Falha ao consultar Pl@ntNet.");
    }

    interface ResultadoPlantnet {
      score: number;
      species: {
        scientificNameWithoutAuthor: string;
        commonNames?: string[];
      };
    }
    const json = (await respostaPlantnet.json()) as {
      results?: ResultadoPlantnet[];
    };

    return (json.results ?? []).slice(0, 5).map((r) => ({
      nomeCientifico: r.species.scientificNameWithoutAuthor,
      nomesComuns: r.species.commonNames ?? [],
      confianca: r.score,
    }));
  },
);

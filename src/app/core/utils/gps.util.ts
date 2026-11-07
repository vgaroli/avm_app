export type StatusGps = 'aguardando' | 'sucesso' | 'negado' | 'erro';

export const PRECISAO_GPS_LIMITE_METROS = 30;

export interface ResultadoLocalizacao {
  lat: number;
  lng: number;
  precisaoGpsMetros: number | null;
}

export function excedePrecisaoGps(precisaoGpsMetros: number | null): boolean {
  return precisaoGpsMetros !== null && precisaoGpsMetros > PRECISAO_GPS_LIMITE_METROS;
}

/** Envolve `navigator.geolocation.getCurrentPosition` em Promise; rejeita com o `GeolocationPositionError` original. */
export function capturarLocalizacaoAtual(): Promise<ResultadoLocalizacao> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('geolocation-indisponivel'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        resolve({
          lat: posicao.coords.latitude,
          lng: posicao.coords.longitude,
          precisaoGpsMetros: posicao.coords.accuracy ?? null,
        });
      },
      (erro) => reject(erro),
      { enableHighAccuracy: true },
    );
  });
}

/** Mapeia o erro de `capturarLocalizacaoAtual` para o status de UI (`negado` só quando é PERMISSION_DENIED, código 1). */
export function statusGpsDoErro(erro: unknown): StatusGps {
  const codigo = erro && typeof erro === 'object' && 'code' in erro ? (erro as { code: unknown }).code : null;
  return codigo === 1 ? 'negado' : 'erro';
}

import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Polygon } from 'geojson';

const CAMINHO_POLIGONO = 'geo/vila-mariana-simplificado.geojson';

let poligonoCache: Promise<Feature<Polygon>> | null = null;

function carregarPoligono(): Promise<Feature<Polygon>> {
  if (!poligonoCache) {
    poligonoCache = fetch(CAMINHO_POLIGONO)
      .then((resposta) => resposta.json())
      .then((geojson: FeatureCollection<Polygon>) => geojson.features[0]);
  }
  return poligonoCache;
}

/** `navigator.geolocation` retorna { latitude, longitude }; turf espera pontos [lng, lat]. */
export async function dentroDoPerimetroVilaMariana(lat: number, lng: number): Promise<boolean> {
  const poligono = await carregarPoligono();
  return booleanPointInPolygon([lng, lat], poligono);
}

/** Reaproveita o mesmo cache de `dentroDoPerimetroVilaMariana` — usado para desenhar o contorno no mapa. */
export function obterPoligonoVilaMariana(): Promise<Feature<Polygon>> {
  return carregarPoligono();
}

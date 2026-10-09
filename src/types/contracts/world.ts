import type { ESCALA_MUNDO, Ponto } from "@caelum/world-contracts";
export { EVENTOS_MUNDO, VERSAO_PROTOCOLO } from "@caelum/world-contracts";
// Contratos reservados: sem handlers ou mutações na Fase 0.
export type { TipoMira, IntencaoMover, IntencaoConjurar, IntencaoInteragir, EntrarMundo, EntidadeMundo, SnapshotMundo, ErroMundo } from "@caelum/world-contracts";
export interface ManifestoMundo {
  versao: 1;
  assets_versao: "v1";
  fase: 0;
  modo: "preview_cartografico";
  escala: typeof ESCALA_MUNDO;
  geografia_validada: false;
  operacoes_disponiveis: never[];
  mapa_oficial_url: string;
  mapas: { slug: string; nome: string; estado: "preview" | "planejado"; tiled_url: string }[];
  posicao: { mapa_slug: "capital"; tile: Ponto; pixel: Ponto; versao: number };
  territorios: { id: number; slug: string; nome: string; polygon_percentual: Ponto[]; polygon_tile: Ponto[] }[];
  pontos: { id: number; nome: string; tipo: string; id_territorio: number | null; percentual: Ponto; tile: Ponto }[];
  conexoes: { id: number; id_origem: number; id_destino: number; tipo: string }[];
}
export interface MapaTiled {
  type: "map"; infinite: true; width: 400; height: 180; tilewidth: 32; tileheight: 32;
  layers: { id: number; type: "imagelayer" | "objectgroup"; name: string; offsetx?: number; offsety?: number; image?: string; properties?: { name: string; type: string; value: string | number | boolean }[]; visible: boolean; objects?: unknown[] }[];
}

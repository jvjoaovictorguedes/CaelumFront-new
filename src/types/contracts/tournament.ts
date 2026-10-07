
export interface TorneioSerieAtualizadaPayload {
  serieId: number;
  status?: string;
  placar?: { a?: number; b?: number };
  formato?: string;
  prazoReadyCheckSegundos?: number;
  readyA?: boolean;
  readyB?: boolean;
  vencedorSerie?: number | null;
}

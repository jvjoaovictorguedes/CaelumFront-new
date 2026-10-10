import type {
  PuzzleInstanceRuntimeApi,
  PistaDesbloqueadaApi,
  ConquistaPioneiraApi,
  RecompensaConcedidaApi,
} from "@/lib/api/eventPuzzle";

// Evento "O Coração da Máquina Celestial" — Fase 16. Payload de
// `eventpuzzle:estado` (tanto o resync de "entrar" quanto o broadcast
// depois de uma ação HTTP bem-sucedida de QUALQUER personagem na mesma
// sala — ver eventPuzzleSocket.js). Mesmo shape do que o controller
// HTTP devolve em POST .../actions, exceto que o "entrar" inicial manda
// `eventos`/pistas/conquistas/recompensas vazios (não há nada "recém-
// acontecido" só de reconectar).
export interface EstadoEventPuzzleSocketPayload {
  instancia: PuzzleInstanceRuntimeApi;
  eventos: Array<Record<string, unknown>>;
  pistasDesbloqueadas?: PistaDesbloqueadaApi[];
  conquistasPioneiras?: ConquistaPioneiraApi[];
  recompensasConcedidas?: RecompensaConcedidaApi[];
}
